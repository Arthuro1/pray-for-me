// Pure, dependency-free notification-copy builders shared by the reminder Edge
// Functions AND unit-testable from Vitest (no `npm:`/Deno imports here, so a
// plain `.ts` import resolves in either runtime).
//
// PRIVACY CONTRACT (see acceptance criterion #9): by default a push carries NO
// prayer content — no titles, descriptions, person names, update or testimony
// text. Bodies are generic nudges only. Detailed levels (count / titles) are an
// explicit, per-account opt-in (`notification_detail`) that defaults to
// 'generic'. With default E2EE, prayer titles/names are stored blank server-side
// anyway, but keeping the copy generic by construction means the guarantee does
// not silently depend on encryption being on for a given row.

export type NotificationDetail = 'generic' | 'count' | 'titles';

// Localized copy. `title` + `generic` are always safe to send. `withCount` is a
// non-sensitive count-only variant used only when the user opts into 'count'.
export const DAILY_MSG: Record<string, { title: string; generic: string; withCount: string }> = {
  en: { title: 'Time to pray', generic: 'Take a moment with God today.', withCount: 'You have {count} prayer subject(s) for today.' },
  fr: { title: "Temps de prière", generic: "Prenez un moment avec Dieu aujourd'hui.", withCount: "Vous avez {count} sujet(s) de prière aujourd'hui." },
  de: { title: 'Zeit zum Beten', generic: 'Nimm dir heute einen Moment mit Gott.', withCount: 'Du hast heute {count} Gebetsanliegen.' },
  pt: { title: 'Hora de orar', generic: 'Reserve um momento com Deus hoje.', withCount: 'Você tem {count} pedido(s) de oração hoje.' },
  es: { title: 'Hora de orar', generic: 'Tómate un momento con Dios hoy.', withCount: 'Tienes {count} petición(es) de oración hoy.' },
  zh: { title: '祷告时间', generic: '今天花点时间与神交通。', withCount: '今天你有 {count} 个祷告事项。' },
  ja: { title: '祈りの時間', generic: '今日、神様と過ごすひとときを。', withCount: '今日は {count} 件の祈りの課題があります。' },
  ko: { title: '기도 시간', generic: '오늘 하나님과 함께하는 시간을 가지세요.', withCount: '오늘 {count}개의 기도 제목이 있습니다.' },
  ru: { title: 'Время молитвы', generic: 'Уделите сегодня время Богу.', withCount: 'У вас сегодня {count} молитвенных просьб.' },
  ar: { title: 'وقت الصلاة', generic: 'خصص لحظة مع الله اليوم.', withCount: 'لديك {count} طلب(ات) صلاة اليوم.' },
  fa: { title: 'زمان دعا', generic: 'امروز لحظه‌ای را با خدا بگذرانید.', withCount: 'امروز {count} موضوع دعا دارید.' },
  hi: { title: 'प्रार्थना का समय', generic: 'आज परमेश्वर के साथ कुछ समय बिताएं।', withCount: 'आज आपके {count} प्रार्थना विषय हैं।' },
  sw: { title: 'Wakati wa kuomba', generic: 'Tumia muda na Mungu leo.', withCount: 'Una maombi {count} leo.' },
  am: { title: 'የጸሎት ጊዜ', generic: 'ዛሬ ከእግዚአብሔር ጋር ጊዜ ይውሰዱ።', withCount: 'ዛሬ {count} የጸሎት ርዕሶች አሉዎት።' },
  id: { title: 'Waktunya berdoa', generic: 'Luangkan waktu bersama Tuhan hari ini.', withCount: 'Anda punya {count} pokok doa hari ini.' },
  tl: { title: 'Oras na manalangin', generic: 'Maglaan ng sandali kasama ang Diyos ngayon.', withCount: 'May {count} paksa ng panalangin ka ngayon.' },
};

// Follow-up nudge — never names anyone by default; the generic form invites the
// user to check in with those they've prayed for (themselves included).
export const FOLLOWUP_MSG: Record<string, { title: string; generic: string }> = {
  en: { title: 'Prayer follow-up', generic: "Reach out to those you've prayed for — yourself included — and see how God has been moving. Add what you learn to their prayer." },
  fr: { title: 'Suivi des prières', generic: 'Prenez des nouvelles des personnes pour qui vous avez prié — vous y compris — et voyez comment Dieu a agi. Ajoutez ce que vous apprenez à la prière.' },
  de: { title: 'Gebet-Nachverfolgung', generic: 'Melde dich bei den Menschen, für die du gebetet hast — dich eingeschlossen — und erfahre, wie Gott gewirkt hat. Füge es dem Gebet hinzu.' },
  pt: { title: 'Acompanhamento', generic: 'Entre em contato com quem você orou — incluindo você mesmo — e veja como Deus tem agido. Adicione o que descobrir à oração.' },
  es: { title: 'Seguimiento', generic: 'Contacta a quienes has orado — incluyéndote a ti mismo — y descubre cómo ha actuado Dios. Añade lo que descubras a la oración.' },
  zh: { title: '祷告跟进', generic: '联系你曾为之祷告的人（也包括你自己），看看神做了什么工作，并把结果添加到祷告详情中。' },
  ja: { title: 'フォローアップ', generic: '祈った相手に——あなた自身も含めて——連絡して、神様の働きを聞いてみましょう。祈りの詳細に追記してください。' },
  ko: { title: '기도 후속', generic: '기도했던 분들에게(자기 자신 포함) 연락해 하나님의 역사하심을 확인하고 기도 항목에 추가해 보세요.' },
  ru: { title: 'Отслеживание молитв', generic: 'Свяжитесь с теми, за кого вы молились — включая себя — и узнайте, как действовал Бог. Добавьте это к молитве.' },
  ar: { title: 'متابعة الصلوات', generic: 'تواصل مع من صليت لأجلهم — بما في ذلك نفسك — واكتشف كيف عمل الله، وأضف ما تتعلمه إلى الصلاة.' },
  fa: { title: 'پیگیری دعا', generic: 'با کسانی که برایشان دعا کرده‌اید—از جمله خودتان—تماس بگیرید و آنچه خدا انجام داده را به دعا اضافه کنید.' },
  hi: { title: 'प्रार्थना अनुवर्ती', generic: 'जिनके लिए आपने प्रार्थना की है (स्वयं सहित) उनसे संपर्क करें और परमेश्वर के काम को प्रार्थना विवरण में जोड़ें।' },
  sw: { title: 'Ufuatiliaji wa maombi', generic: 'Wasiliana na wale uliowaombea — ukiwemo wewe mwenyewe — uone jinsi Mungu alivyofanya kazi, kisha uongeze kwenye maombi.' },
  am: { title: 'ክትትል', generic: 'ስለ እነርሱ የጸለዩላቸውን ሰዎች — እራስዎን ጨምሮ — ያግኙ እና እግዚአብሔር የሠራውን ወደ ጸሎቱ ያክሉ።' },
  id: { title: 'Tindak lanjut doa', generic: 'Hubungi orang yang Anda doakan — termasuk diri sendiri — dan lihat bagaimana Tuhan bekerja. Tambahkan ke detail doa.' },
  tl: { title: 'Follow-up ng panalangin', generic: 'Makipag-ugnayan sa mga ipinananalangin mo — kasama ang sarili mo — at tingnan kung paano gumagalaw ang Diyos. Idagdag ito sa detalye ng panalangin.' },
};

// Normalizes any stored value to a known level, defaulting to the safe 'generic'.
export function normalizeDetail(value: unknown): NotificationDetail {
  return value === 'count' || value === 'titles' ? value : 'generic';
}

// Builds the daily-reminder push payload. Content-free unless the account has
// explicitly opted into a higher detail level. `count` is only read for 'count';
// titles are intentionally NOT supported here yet (kept generic) so no prayer
// text can leak through this path — 'titles' currently behaves like 'count'.
export function dailyPayload(lang: string, detail: NotificationDetail = 'generic', count = 0): string {
  const m = DAILY_MSG[lang] || DAILY_MSG.en;
  const body = (detail === 'count' || detail === 'titles') && count > 0
    ? m.withCount.replace('{count}', String(count))
    : m.generic;
  return JSON.stringify({ title: m.title, body, url: '/', tag: 'daily-reminder' });
}

// Builds the follow-up push payload — always generic; never names a person.
export function followUpPayload(lang: string): string {
  const fm = FOLLOWUP_MSG[lang] || FOLLOWUP_MSG.en;
  return JSON.stringify({ title: fm.title, body: fm.generic, url: '/', tag: 'follow-up' });
}
