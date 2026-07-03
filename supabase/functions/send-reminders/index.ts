// Supabase Edge Function: send-reminders
// Invoked every ~15 min by pg_cron. Finds subscriptions whose local time has
// just reached their reminder_time and sends a localized Web Push.
//
// Deploy:  supabase functions deploy send-reminders --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const WINDOW_MIN = 15; // must match the cron interval

// Short localized templates. {count} is replaced; body0 is used when count === 0.
// {titles} is a ": Title1, Title2…" suffix (built in code, empty when no plaintext
// titles are available — e.g. prayers still locked in an E2EE vault) inserted
// right before the closing punctuation of the count sentence.
const MSG: Record<string, { title: string; body: string; body0: string }> = {
  en: { title: '🙏 Time to pray', body: 'You have {count} prayer subject(s) for today{titles}.', body0: 'Take a moment with God today.' },
  fr: { title: '🙏 Temps de prière', body: 'Vous avez {count} sujet(s) de prière aujourd\'hui{titles}.', body0: 'Prenez un moment avec Dieu aujourd\'hui.' },
  de: { title: '🙏 Zeit zu beten', body: 'Du hast heute {count} Gebetsanliegen{titles}.', body0: 'Nimm dir heute einen Moment mit Gott.' },
  pt: { title: '🙏 Hora de orar', body: 'Você tem {count} pedido(s) de oração hoje{titles}.', body0: 'Reserve um momento com Deus hoje.' },
  es: { title: '🙏 Hora de orar', body: 'Tienes {count} petición(es) de oración hoy{titles}.', body0: 'Tómate un momento con Dios hoy.' },
  zh: { title: '🙏 祷告时间', body: '今天你有 {count} 个祷告事项{titles}。', body0: '今天花点时间与神交通。' },
  ja: { title: '🙏 祈りの時間', body: '今日は {count} 件の祈りの課題があります{titles}。', body0: '今日、神様と過ごすひとときを。' },
  ko: { title: '🙏 기도 시간', body: '오늘 {count}개의 기도 제목이 있습니다{titles}.', body0: '오늘 하나님과 함께하는 시간을 가지세요.' },
  ru: { title: '🙏 Время молитвы', body: 'У вас сегодня {count} молитвенных просьб{titles}.', body0: 'Уделите сегодня время Богу.' },
  ar: { title: '🙏 وقت الصلاة', body: 'لديك {count} طلب(ات) صلاة اليوم{titles}.', body0: 'خصص لحظة مع الله اليوم.' },
  fa: { title: '🙏 وقت دعا', body: 'امروز {count} موضوع دعا دارید{titles}.', body0: 'امروز لحظه‌ای را با خدا بگذرانید.' },
  hi: { title: '🙏 प्रार्थना का समय', body: 'आज आपके {count} प्रार्थना विषय हैं{titles}।', body0: 'आज परमेश्वर के साथ कुछ समय बिताएं।' },
  sw: { title: '🙏 Wakati wa kuomba', body: 'Una maombi {count} leo{titles}.', body0: 'Tumia muda na Mungu leo.' },
  am: { title: '🙏 የጸሎት ጊዜ', body: 'ዛሬ {count} የጸሎት ርዕሶች አሉዎት{titles}።', body0: 'ዛሬ ከእግዚአብሔር ጋር ጊዜ ይውሰዱ።' },
  id: { title: '🙏 Waktu berdoa', body: 'Anda punya {count} pokok doa hari ini{titles}.', body0: 'Luangkan waktu bersama Tuhan hari ini.' },
  tl: { title: '🙏 Oras na manalangin', body: 'May {count} paksa ng panalangin ka ngayon{titles}.', body0: 'Maglaan ng sandali kasama ang Diyos ngayon.' },
};

const MAX_LISTED_TITLES = 5;

// Builds the "{titles}" suffix, e.g. ": Healing for Mom, Job interview…".
// Empty when no plaintext titles exist (E2EE-locked prayers store '' server-side).
function buildTitleSuffix(prayers: { title?: string }[]): string {
  const titles = prayers.map((p) => (p.title || '').trim()).filter(Boolean);
  if (!titles.length) return '';
  const shown = titles.slice(0, MAX_LISTED_TITLES).join(', ');
  return `: ${shown}${titles.length > MAX_LISTED_TITLES ? '…' : ''}`;
}

function prayerDueToday(p: any, dow: number, todayCatIds: Set<string>): boolean {
  if (Array.isArray(p.week_days) && p.week_days.length) return p.week_days.includes(dow);
  const catIds = (p.prayer_categories || []).map((pc: any) => pc.category_id);
  if (catIds.length === 0) return true; // uncategorized = every day
  return catIds.some((id: string) => todayCatIds.has(id));
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async () => {
 try {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');

  // Surface a clear reason instead of a blank 500 when a secret is missing.
  const missing = ([
    ['SUPABASE_URL', url],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
    ['VAPID_PUBLIC_KEY', vapidPublic],
    ['VAPID_PRIVATE_KEY', vapidPrivate],
  ] as [string, string | undefined][]).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return json({ error: 'missing_env', missing }, 500);

  const supabase = createClient(url!, serviceKey!);

  try {
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@pray4me.app', vapidPublic!, vapidPrivate!);
  } catch (e) {
    return json({ error: 'invalid_vapid_keys', message: String((e as Error)?.message || e) }, 500);
  }

  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('enabled', true);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;
  for (const sub of subs || []) {
    const local = (((utcMinutes + (sub.tz_offset || 0)) % 1440) + 1440) % 1440;
    const [rh, rm] = String(sub.reminder_time || '07:00').split(':').map(Number);
    const diff = local - (rh * 60 + rm);
    if (diff < 0 || diff >= WINDOW_MIN) continue; // not due in this window

    // Count today's prayers in the subscriber's local timezone.
    const localDow = new Date(now.getTime() + (sub.tz_offset || 0) * 60000).getUTCDay();
    const [{ data: cats }, { data: prayers }] = await Promise.all([
      supabase.from('categories').select('id, week_days').eq('user_id', sub.user_id),
      supabase.from('prayers').select('title, week_days, prayer_categories(category_id)').eq('user_id', sub.user_id).eq('status', 'active'),
    ]);
    const todayCatIds = new Set((cats || []).filter((c: any) => (c.week_days || []).includes(localDow)).map((c: any) => c.id));
    const duePrayers = (prayers || []).filter((p: any) => prayerDueToday(p, localDow, todayCatIds));

    const m = MSG[sub.lang] || MSG.en;
    const payload = JSON.stringify({
      title: m.title,
      body: duePrayers.length > 0
        ? m.body.replace('{count}', String(duePrayers.length)).replace('{titles}', buildTitleSuffix(duePrayers))
        : m.body0,
      url: '/',
      tag: 'daily-reminder',
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (e: any) {
      // Subscription expired/invalid — clean it up.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return json({ sent });
 } catch (e) {
  // Any unexpected failure → readable message instead of a blank 500.
  return json({ error: 'unhandled', message: String((e as Error)?.message || e) }, 500);
 }
});
