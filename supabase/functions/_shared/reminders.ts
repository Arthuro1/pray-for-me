// Shared helpers for the independently-scheduled send-daily-reminder and
// send-follow-up-reminder Edge Functions (split from the original combined
// send-reminders function so each reminder type has its own cron/deploy).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

export const WINDOW_MIN = 15; // must match each cron's interval

// Short localized templates. {count} is replaced; body0 is used when count === 0.
// {titles} is a ": Title1, Title2…" suffix (built in code, empty when no plaintext
// titles are available — e.g. prayers still locked in an E2EE vault) inserted
// right before the closing punctuation of the count sentence.
export const MSG: Record<string, { title: string; body: string; body0: string }> = {
  en: { title: 'Daily reminder', body: 'You have {count} prayer subject(s) for today{titles}.', body0: 'Take a moment with God today.' },
  fr: { title: 'Rappel quotidien', body: 'Vous avez {count} sujet(s) de prière aujourd\'hui{titles}.', body0: 'Prenez un moment avec Dieu aujourd\'hui.' },
  de: { title: 'Tägliche Erinnerung', body: 'Du hast heute {count} Gebetsanliegen{titles}.', body0: 'Nimm dir heute einen Moment mit Gott.' },
  pt: { title: 'Lembrete diário', body: 'Você tem {count} pedido(s) de oração hoje{titles}.', body0: 'Reserve um momento com Deus hoje.' },
  es: { title: 'Recordatorio diario', body: 'Tienes {count} petición(es) de oración hoy{titles}.', body0: 'Tómate un momento con Dios hoy.' },
  zh: { title: '每日提醒', body: '今天你有 {count} 个祷告事项{titles}。', body0: '今天花点时间与神交通。' },
  ja: { title: '毎日のリマインダー', body: '今日は {count} 件の祈りの課題があります{titles}。', body0: '今日、神様と過ごすひとときを。' },
  ko: { title: '매일 알림', body: '오늘 {count}개의 기도 제목이 있습니다{titles}.', body0: '오늘 하나님과 함께하는 시간을 가지세요.' },
  ru: { title: 'Ежедневное напоминание', body: 'У вас сегодня {count} молитвенных просьб{titles}.', body0: 'Уделите сегодня время Богу.' },
  ar: { title: 'تذكير يومي', body: 'لديك {count} طلب(ات) صلاة اليوم{titles}.', body0: 'خصص لحظة مع الله اليوم.' },
  fa: { title: 'یادآور روزانه', body: 'امروز {count} موضوع دعا دارید{titles}.', body0: 'امروز لحظه‌ای را با خدا بگذرانید.' },
  hi: { title: 'दैनिक अनुस्मारक', body: 'आज आपके {count} प्रार्थना विषय हैं{titles}।', body0: 'आज परमेश्वर के साथ कुछ समय बिताएं।' },
  sw: { title: 'Ukumbusho wa kila siku', body: 'Una maombi {count} leo{titles}.', body0: 'Tumia muda na Mungu leo.' },
  am: { title: 'የዕለት ማስታወሻ', body: 'ዛሬ {count} የጸሎት ርዕሶች አሉዎት{titles}።', body0: 'ዛሬ ከእግዚአብሔር ጋር ጊዜ ይውሰዱ።' },
  id: { title: 'Pengingat harian', body: 'Anda punya {count} pokok doa hari ini{titles}.', body0: 'Luangkan waktu bersama Tuhan hari ini.' },
  tl: { title: 'Araw-araw na paalala', body: 'May {count} paksa ng panalangin ka ngayon{titles}.', body0: 'Maglaan ng sandali kasama ang Diyos ngayon.' },
};

// Follow-up reminder: encourages reaching out to whoever a prayer is for
// (or the user themself) and logging the answer on the prayer. Fires on the
// same local reminder_time window as the daily reminder, but only every
// {days}, per subscription (see FOLLOWUP_MSG.self / followUpDue below).
export const FOLLOWUP_MSG: Record<string, { title: string; body: string; body0: string; self: string }> = {
  en: { title: 'Prayer follow-up', body: 'Reach out to {names} and see how God has been moving — then add what you learn to their prayer.', body0: "Reach out to those you've prayed for — yourself included — and see how God has been moving. Add what you learn to their prayer.", self: 'yourself' },
  fr: { title: 'Suivi des prières', body: 'Prenez des nouvelles de {names} et voyez comment Dieu a agi — puis ajoutez sa réponse à la prière.', body0: 'Prenez des nouvelles des personnes pour qui vous avez prié — vous y compris — et voyez comment Dieu a agi. Ajoutez ce que vous apprenez à la prière.', self: 'vous-même' },
  de: { title: 'Gebet-Nachverfolgung', body: 'Melde dich bei {names} und erfahre, wie Gott gewirkt hat — füge die Antwort dann zum Gebet hinzu.', body0: 'Melde dich bei den Menschen, für die du gebetet hast — dich eingeschlossen — und erfahre, wie Gott gewirkt hat. Füge es dem Gebet hinzu.', self: 'dir selbst' },
  pt: { title: 'Acompanhamento', body: 'Entre em contato com {names} e veja como Deus tem agido — depois adicione a resposta à oração.', body0: 'Entre em contato com quem você orou — incluindo você mesmo — e veja como Deus tem agido. Adicione o que descobrir à oração.', self: 'você mesmo' },
  es: { title: 'Seguimiento', body: 'Contacta a {names} y descubre cómo ha actuado Dios — luego añade la respuesta a la oración.', body0: 'Contacta a quienes has orado — incluyéndote a ti mismo — y descubre cómo ha actuado Dios. Añade lo que descubras a la oración.', self: 'ti mismo' },
  zh: { title: '祷告跟进', body: '联系 {names}，看看神做了什么工作——然后把结果添加到祷告详情中。', body0: '联系你曾为之祷告的人（也包括你自己），看看神做了什么工作，并把结果添加到祷告详情中。', self: '你自己' },
  ja: { title: 'フォローアップ', body: '{names} に連絡して、神様の働きを聞いてみましょう。祈りの詳細に追記してください。', body0: '祈った相手に——あなた自身も含めて——連絡して、神様の働きを聞いてみましょう。祈りの詳細に追記してください。', self: 'あなた自身' },
  ko: { title: '기도 후속', body: '{names}님에게 연락해 하나님이 어떻게 역사하셨는지 확인하고, 기도 항목에 추가해 보세요.', body0: '기도했던 분들에게(자기 자신 포함) 연락해 하나님의 역사하심을 확인하고 기도 항목에 추가해 보세요.', self: '자기 자신' },
  ru: { title: 'Отслеживание молитв', body: 'Свяжитесь с {names} и узнайте, как действовал Бог — затем добавьте ответ к молитве.', body0: 'Свяжитесь с теми, за кого вы молились — включая себя — и узнайте, как действовал Бог. Добавьте это к молитве.', self: 'собой' },
  ar: { title: 'متابعة الصلوات', body: 'تواصل مع {names} واكتشف كيف عمل الله — ثم أضف الإجابة إلى الصلاة.', body0: 'تواصل مع من صليت لأجلهم — بما في ذلك نفسك — واكتشف كيف عمل الله، وأضف ما تتعلمه إلى الصلاة.', self: 'نفسك' },
  fa: { title: 'پیگیری دعا', body: 'با {names} تماس بگیرید و ببینید خدا چه کرده است — سپس پاسخ را به دعا اضافه کنید.', body0: 'با کسانی که برایشان دعا کرده‌اید—از جمله خودتان—تماس بگیرید و آنچه خدا انجام داده را به دعا اضافه کنید.', self: 'خودتان' },
  hi: { title: 'प्रार्थना अनुवर्ती', body: '{names} से संपर्क करें और देखें परमेश्वर ने क्या किया — फिर उत्तर को प्रार्थना में जोड़ें।', body0: 'जिनके लिए आपने प्रार्थना की है (स्वयं सहित) उनसे संपर्क करें और परमेश्वर के काम को प्रार्थना विवरण में जोड़ें।', self: 'स्वयं' },
  sw: { title: 'Ufuatiliaji wa maombi', body: 'Wasiliana na {names} uone jinsi Mungu alivyofanya kazi — kisha ongeza jibu kwenye maombi.', body0: 'Wasiliana na wale uliowaombea — ukiwemo wewe mwenyewe — uone jinsi Mungu alivyofanya kazi, kisha uongeze kwenye maombi.', self: 'wewe mwenyewe' },
  am: { title: 'ክትትል', body: '{names}ን ያግኙ እና እግዚአብሔር እንዴት እንደሠራ ይመልከቱ — ከዚያ መልሱን ወደ ጸሎቱ ያክሉ።', body0: 'ስለ እነርሱ የጸለዩላቸውን ሰዎች — እራስዎን ጨምሮ — ያግኙ እና እግዚአብሔር የሠራውን ወደ ጸሎቱ ያክሉ።', self: 'እራስዎ' },
  id: { title: 'Tindak lanjut doa', body: 'Hubungi {names} dan lihat bagaimana Tuhan bekerja — lalu tambahkan jawabannya ke doa.', body0: 'Hubungi orang yang Anda doakan — termasuk diri sendiri — dan lihat bagaimana Tuhan bekerja. Tambahkan ke detail doa.', self: 'diri sendiri' },
  tl: { title: 'Follow-up ng panalangin', body: 'Makipag-ugnayan kay {names} at tingnan kung paano gumagalaw ang Diyos — pagkatapos ay idagdag ang sagot sa panalangin.', body0: 'Makipag-ugnayan sa mga ipinananalangin mo — kasama ang sarili mo — at tingnan kung paano gumagalaw ang Diyos. Idagdag ito sa detalye ng panalangin.', self: 'sa sarili mo' },
};

const MAX_LISTED_TITLES = 5;

// Builds the "{titles}" suffix, e.g. ": Healing for Mom, Job interview…".
// Empty when no plaintext titles exist (E2EE-locked prayers store '' server-side).
export function buildTitleSuffix(prayers: { title?: string }[]): string {
  const titles = prayers.map((p) => (p.title || '').trim()).filter(Boolean);
  if (!titles.length) return '';
  const shown = titles.slice(0, MAX_LISTED_TITLES).join(', ');
  return `: ${shown}${titles.length > MAX_LISTED_TITLES ? '…' : ''}`;
}

// Builds the "{names}" list for the follow-up reminder — who to reach out to.
// Prayers "for someone else" contribute their plaintext person_name (deduped);
// any prayer for the user's own life adds `selfLabel` once. Empty when a prayer
// is for someone else but its name is E2EE-locked (stored as '' server-side)
// and there's no personal prayer to fall back to — the caller uses body0 then.
export function buildFollowUpNames(prayers: { person_name?: string; for_other?: boolean }[], selfLabel: string): string {
  const names: string[] = [];
  const seen = new Set<string>();
  let includeSelf = false;
  for (const p of prayers) {
    if (p.for_other) {
      const name = (p.person_name || '').trim();
      if (name && !seen.has(name)) { seen.add(name); names.push(name); }
    } else {
      includeSelf = true;
    }
  }
  if (includeSelf) names.push(selfLabel);
  if (!names.length) return '';
  return `${names.slice(0, MAX_LISTED_TITLES).join(', ')}${names.length > MAX_LISTED_TITLES ? '…' : ''}`;
}

// True once `days` have elapsed since the cadence anchor (last follow-up
// push, or the enable-time stamp the client writes). A missing anchor is
// never "due now" — the scheduler stamps it on first sight instead — so the
// first follow-up always arrives one full cadence after enabling.
export function followUpDue(lastSentAt: string | null, days: number | null, now: Date): boolean {
  if (!lastSentAt) return false;
  const elapsedMs = now.getTime() - new Date(lastSentAt).getTime();
  return elapsedMs >= (days || 7) * 86400000;
}

export function prayerDueToday(p: any, dow: number, todayCatIds: Set<string>): boolean {
  if (Array.isArray(p.week_days) && p.week_days.length) return p.week_days.includes(dow);
  const catIds = (p.prayer_categories || []).map((pc: any) => pc.category_id);
  if (catIds.length === 0) return true; // uncategorized = every day
  return catIds.some((id: string) => todayCatIds.has(id));
}

// True when `sub`'s local clock has just reached `time` (within the cron's
// polling window). Defaults to the daily reminder_time; the follow-up
// scheduler passes the subscription's own follow_up_time instead.
export function isWithinReminderWindow(
  sub: { tz_offset?: number; reminder_time?: string },
  utcMinutes: number,
  time: string | undefined = sub.reminder_time,
): boolean {
  const local = (((utcMinutes + (sub.tz_offset || 0)) % 1440) + 1440) % 1440;
  const [rh, rm] = String(time || '07:00').split(':').map(Number);
  const diff = local - (rh * 60 + rm);
  return diff >= 0 && diff < WINDOW_MIN;
}

export const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

// Reads/validates the env this function needs and returns a ready Supabase
// client, or a Response to return immediately when something's missing —
// surfaces a clear reason instead of a blank 500.
export function initReminderEnv(): { supabase: SupabaseClient } | { error: Response } {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');

  const missing = ([
    ['SUPABASE_URL', url],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
    ['VAPID_PUBLIC_KEY', vapidPublic],
    ['VAPID_PRIVATE_KEY', vapidPrivate],
  ] as [string, string | undefined][]).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { error: json({ error: 'missing_env', missing }, 500) };

  try {
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@pray4me.app', vapidPublic!, vapidPrivate!);
  } catch (e) {
    return { error: json({ error: 'invalid_vapid_keys', message: String((e as Error)?.message || e) }, 500) };
  }

  return { supabase: createClient(url!, serviceKey!) };
}

// Sends one Web Push message. `gone` is true when the subscription is
// expired/invalid (404/410) or permanently rejected by the push service
// (401/403 — e.g. bound to a since-rotated VAPID key) and should be deleted
// by the caller so the client is forced to create a fresh one.
export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<{ sent: boolean; gone: boolean }> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
    );
    return { sent: true, gone: false };
  } catch (e: any) {
    // Logged so silent delivery failures (auth/VAPID mismatch, etc.) are
    // visible in the function's logs instead of just never sending.
    console.error('push send failed', e?.statusCode, e?.body || e?.message || e);
    const gone = [401, 403, 404, 410].includes(e?.statusCode);
    return { sent: false, gone };
  }
}
