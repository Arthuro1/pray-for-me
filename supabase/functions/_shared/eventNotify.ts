// Pure, dependency-free builders for event-notification Web Push payloads,
// shared by the send-event-notifications Edge Function AND unit-testable from
// Vitest (no `npm:`/Deno imports here, so a plain `.ts` import resolves in
// either runtime — same pattern as notify.ts).
//
// PRIVACY CONTRACT (see acceptance criterion #9): an event push carries NO
// prayer content — no titles, descriptions, update or testimony text, or person
// names. Bodies are fixed, generic, localized strings. The URL and tag are
// built only from identifiers in `metadata`; anything that isn't a valid UUID is
// dropped and the payload falls back to a safe internal route.

export type EventType =
  | 'friend_request'
  | 'group_invitation'
  | 'community_update'
  | 'answered'
  | 'reaction_bucket'
  | 'group_prayer_added'
  | 'testimony'
  | 'membership_change'
  | 'role_change'
  | 'plan_invitation';

type Copy = { title: string; body: string };

// Generic, content-free copy per language. Falls back to English for any
// language not listed here (see pick()).
export const EVENT_MSG: Record<string, Record<EventType, Copy>> = {
  en: {
    friend_request:   { title: 'New friend request', body: 'You have a new friend request.' },
    group_invitation: { title: 'Group invitation',   body: 'You have been invited to a prayer group.' },
    community_update: { title: 'Prayer update',      body: 'There is an update on a prayer you follow.' },
    answered:         { title: 'Prayer answered',    body: 'A prayer you follow has been marked answered.' },
    reaction_bucket:  { title: 'Praying with you',   body: 'Several people are praying with you.' },
    group_prayer_added:{ title: 'New prayer request', body: 'A new prayer was shared in your group.' },
    testimony:        { title: 'New testimony',      body: 'A testimony was shared in your group.' },
    membership_change:{ title: 'Group update',       body: 'You were added to a prayer group.' },
    role_change:      { title: 'Group role updated', body: 'Your role in a group has changed.' },
    plan_invitation:  { title: 'Prayer plan invitation', body: 'You were invited to pray a plan together.' },
  },
  fr: {
    friend_request:   { title: "Nouvelle demande d'ami", body: "Vous avez une nouvelle demande d'ami." },
    group_invitation: { title: 'Invitation à un groupe', body: 'Vous avez été invité à un groupe de prière.' },
    community_update: { title: 'Mise à jour de prière', body: 'Il y a une mise à jour sur une prière que vous suivez.' },
    answered:         { title: 'Prière exaucée',        body: "Une prière que vous suivez a été marquée comme exaucée." },
    reaction_bucket:  { title: 'On prie avec vous',     body: 'Plusieurs personnes prient avec vous.' },
    group_prayer_added:{ title: 'Nouvelle demande',      body: 'Une nouvelle prière a été partagée dans votre groupe.' },
    testimony:        { title: 'Nouveau témoignage',    body: 'Un témoignage a été partagé dans votre groupe.' },
    membership_change:{ title: 'Mise à jour du groupe', body: 'Vous avez été ajouté à un groupe de prière.' },
    role_change:      { title: 'Rôle mis à jour',       body: 'Votre rôle dans un groupe a changé.' },
    plan_invitation:  { title: 'Invitation à un plan de prière', body: 'Vous avez été invité à prier un plan ensemble.' },
  },
  de: {
    friend_request:   { title: 'Neue Freundschaftsanfrage', body: 'Du hast eine neue Freundschaftsanfrage.' },
    group_invitation: { title: 'Gruppeneinladung', body: 'Du wurdest in eine Gebetsgruppe eingeladen.' },
    community_update: { title: 'Gebets-Update', body: 'Es gibt eine Aktualisierung zu einem Gebet, dem du folgst.' },
    answered:         { title: 'Gebet erhört', body: 'Ein Gebet, dem du folgst, wurde als erhört markiert.' },
    reaction_bucket:  { title: 'Man betet mit dir', body: 'Mehrere Menschen beten mit dir.' },
    group_prayer_added:{ title: 'Neues Gebetsanliegen', body: 'Ein neues Gebet wurde in deiner Gruppe geteilt.' },
    testimony:        { title: 'Neues Zeugnis', body: 'In deiner Gruppe wurde ein Zeugnis geteilt.' },
    membership_change:{ title: 'Gruppen-Update', body: 'Du wurdest zu einer Gebetsgruppe hinzugefügt.' },
    role_change:      { title: 'Rolle aktualisiert', body: 'Deine Rolle in einer Gruppe hat sich geändert.' },
    plan_invitation:  { title: 'Einladung zu einem Gebetsplan', body: 'Du wurdest eingeladen, einen Gebetsplan gemeinsam zu beten.' },
  },
  pt: {
    friend_request:   { title: 'Novo pedido de amizade', body: 'Você tem um novo pedido de amizade.' },
    group_invitation: { title: 'Convite para grupo', body: 'Você foi convidado para um grupo de oração.' },
    community_update: { title: 'Atualização de oração', body: 'Há uma atualização em uma oração que você segue.' },
    answered:         { title: 'Oração respondida', body: 'Uma oração que você segue foi marcada como respondida.' },
    reaction_bucket:  { title: 'Orando com você', body: 'Várias pessoas estão orando com você.' },
    group_prayer_added:{ title: 'Novo pedido de oração', body: 'Uma nova oração foi compartilhada no seu grupo.' },
    testimony:        { title: 'Novo testemunho', body: 'Um testemunho foi compartilhado no seu grupo.' },
    membership_change:{ title: 'Atualização do grupo', body: 'Você foi adicionado a um grupo de oração.' },
    role_change:      { title: 'Função atualizada', body: 'Sua função em um grupo foi alterada.' },
    plan_invitation:  { title: 'Convite para plano de oração', body: 'Você foi convidado para orar um plano juntos.' },
  },
  es: {
    friend_request:   { title: 'Nueva solicitud de amistad', body: 'Tienes una nueva solicitud de amistad.' },
    group_invitation: { title: 'Invitación a grupo', body: 'Te han invitado a un grupo de oración.' },
    community_update: { title: 'Actualización de oración', body: 'Hay una actualización en una oración que sigues.' },
    answered:         { title: 'Oración respondida', body: 'Una oración que sigues ha sido marcada como respondida.' },
    reaction_bucket:  { title: 'Orando contigo', body: 'Varias personas están orando contigo.' },
    group_prayer_added:{ title: 'Nueva petición', body: 'Se compartió una nueva oración en tu grupo.' },
    testimony:        { title: 'Nuevo testimonio', body: 'Se compartió un testimonio en tu grupo.' },
    membership_change:{ title: 'Actualización del grupo', body: 'Te han añadido a un grupo de oración.' },
    role_change:      { title: 'Rol actualizado', body: 'Tu rol en un grupo ha cambiado.' },
    plan_invitation:  { title: 'Invitación a un plan de oración', body: 'Te invitaron a orar un plan juntos.' },
  },
  zh: {
    friend_request:   { title: '新的好友请求', body: '你有一个新的好友请求。' },
    group_invitation: { title: '群组邀请', body: '你被邀请加入一个祷告群组。' },
    community_update: { title: '祷告更新', body: '你关注的一个祷告有新的更新。' },
    answered:         { title: '祷告蒙应允', body: '你关注的一个祷告已被标记为蒙应允。' },
    reaction_bucket:  { title: '有人与你同祷', body: '有几个人正在与你一同祷告。' },
    group_prayer_added:{ title: '新的祷告请求', body: '你的群组中分享了一个新的祷告。' },
    testimony:        { title: '新的见证', body: '你的群组中分享了一个见证。' },
    membership_change:{ title: '群组更新', body: '你已被加入一个祷告群组。' },
    role_change:      { title: '角色已更新', body: '你在群组中的角色已更改。' },
    plan_invitation:  { title: '祷告计划邀请', body: '你被邀请一起进行祷告计划。' },
  },
  ja: {
    friend_request:   { title: '新しい友達リクエスト', body: '新しい友達リクエストがあります。' },
    group_invitation: { title: 'グループへの招待', body: '祈りのグループに招待されました。' },
    community_update: { title: '祈りの更新', body: 'フォロー中の祈りに更新があります。' },
    answered:         { title: '祈りが答えられました', body: 'フォロー中の祈りが「答えられた」と記されました。' },
    reaction_bucket:  { title: '一緒に祈っています', body: '複数の人があなたと共に祈っています。' },
    group_prayer_added:{ title: '新しい祈りの課題', body: 'グループで新しい祈りが共有されました。' },
    testimony:        { title: '新しい証し', body: 'グループで証しが共有されました。' },
    membership_change:{ title: 'グループの更新', body: '祈りのグループに追加されました。' },
    role_change:      { title: '役割が更新されました', body: 'グループでのあなたの役割が変わりました。' },
    plan_invitation:  { title: '祈りのプランへの招待', body: '一緒に祈りのプランを行うよう招待されました。' },
  },
  ko: {
    friend_request:   { title: '새 친구 요청', body: '새로운 친구 요청이 있습니다.' },
    group_invitation: { title: '그룹 초대', body: '기도 그룹에 초대되었습니다.' },
    community_update: { title: '기도 업데이트', body: '팔로우한 기도에 업데이트가 있습니다.' },
    answered:         { title: '기도 응답', body: '팔로우한 기도가 응답됨으로 표시되었습니다.' },
    reaction_bucket:  { title: '함께 기도합니다', body: '여러 사람이 당신과 함께 기도하고 있습니다.' },
    group_prayer_added:{ title: '새 기도 제목', body: '그룹에 새로운 기도가 공유되었습니다.' },
    testimony:        { title: '새 간증', body: '그룹에 간증이 공유되었습니다.' },
    membership_change:{ title: '그룹 업데이트', body: '기도 그룹에 추가되었습니다.' },
    role_change:      { title: '역할 변경됨', body: '그룹에서의 역할이 변경되었습니다.' },
    plan_invitation:  { title: '기도 계획 초대', body: '함께 기도 계획을 진행하도록 초대되었습니다.' },
  },
  ru: {
    friend_request:   { title: 'Новый запрос в друзья', body: 'У вас новый запрос в друзья.' },
    group_invitation: { title: 'Приглашение в группу', body: 'Вас пригласили в молитвенную группу.' },
    community_update: { title: 'Обновление молитвы', body: 'Есть обновление по молитве, за которой вы следите.' },
    answered:         { title: 'Молитва отвечена', body: 'Молитва, за которой вы следите, отмечена как отвеченная.' },
    reaction_bucket:  { title: 'С вами молятся', body: 'Несколько человек молятся вместе с вами.' },
    group_prayer_added:{ title: 'Новая просьба', body: 'В вашей группе появилась новая молитва.' },
    testimony:        { title: 'Новое свидетельство', body: 'В вашей группе поделились свидетельством.' },
    membership_change:{ title: 'Обновление группы', body: 'Вас добавили в молитвенную группу.' },
    role_change:      { title: 'Роль обновлена', body: 'Ваша роль в группе изменилась.' },
    plan_invitation:  { title: 'Приглашение к плану молитвы', body: 'Вас пригласили молиться по плану вместе.' },
  },
  ar: {
    friend_request:   { title: 'طلب صداقة جديد', body: 'لديك طلب صداقة جديد.' },
    group_invitation: { title: 'دعوة إلى مجموعة', body: 'تمت دعوتك إلى مجموعة صلاة.' },
    community_update: { title: 'تحديث صلاة', body: 'هناك تحديث على صلاة تتابعها.' },
    answered:         { title: 'استُجيبت الصلاة', body: 'صلاة تتابعها تم تحديدها كمستجابة.' },
    reaction_bucket:  { title: 'يصلّون معك', body: 'عدة أشخاص يصلّون معك.' },
    group_prayer_added:{ title: 'طلب صلاة جديد', body: 'تمت مشاركة صلاة جديدة في مجموعتك.' },
    testimony:        { title: 'شهادة جديدة', body: 'تمت مشاركة شهادة في مجموعتك.' },
    membership_change:{ title: 'تحديث المجموعة', body: 'تمت إضافتك إلى مجموعة صلاة.' },
    role_change:      { title: 'تم تحديث الدور', body: 'تغيّر دورك في إحدى المجموعات.' },
    plan_invitation:  { title: 'دعوة إلى خطة صلاة', body: 'تمت دعوتك للصلاة وفق خطة معًا.' },
  },
  fa: {
    friend_request:   { title: 'درخواست دوستی جدید', body: 'یک درخواست دوستی جدید دارید.' },
    group_invitation: { title: 'دعوت به گروه', body: 'به یک گروه دعا دعوت شده‌اید.' },
    community_update: { title: 'به‌روزرسانی دعا', body: 'دعایی که دنبال می‌کنید به‌روزرسانی شده است.' },
    answered:         { title: 'دعا مستجاب شد', body: 'دعایی که دنبال می‌کنید به‌عنوان مستجاب علامت‌گذاری شد.' },
    reaction_bucket:  { title: 'با شما دعا می‌کنند', body: 'چند نفر همراه شما دعا می‌کنند.' },
    group_prayer_added:{ title: 'درخواست دعای جدید', body: 'دعای جدیدی در گروه شما به اشتراک گذاشته شد.' },
    testimony:        { title: 'شهادت جدید', body: 'شهادتی در گروه شما به اشتراک گذاشته شد.' },
    membership_change:{ title: 'به‌روزرسانی گروه', body: 'به یک گروه دعا اضافه شدید.' },
    role_change:      { title: 'نقش به‌روزرسانی شد', body: 'نقش شما در یک گروه تغییر کرده است.' },
    plan_invitation:  { title: 'دعوت به برنامهٔ دعا', body: 'شما دعوت شده‌اید تا برنامه‌ای را با هم دعا کنید.' },
  },
  hi: {
    friend_request:   { title: 'नया मित्र अनुरोध', body: 'आपके पास एक नया मित्र अनुरोध है।' },
    group_invitation: { title: 'समूह निमंत्रण', body: 'आपको एक प्रार्थना समूह में आमंत्रित किया गया है।' },
    community_update: { title: 'प्रार्थना अपडेट', body: 'आप जिस प्रार्थना का अनुसरण करते हैं, उसमें एक अपडेट है।' },
    answered:         { title: 'प्रार्थना का उत्तर', body: 'आप जिस प्रार्थना का अनुसरण करते हैं, वह उत्तरित के रूप में चिह्नित की गई है।' },
    reaction_bucket:  { title: 'आपके साथ प्रार्थना', body: 'कई लोग आपके साथ प्रार्थना कर रहे हैं।' },
    group_prayer_added:{ title: 'नई प्रार्थना विनती', body: 'आपके समूह में एक नई प्रार्थना साझा की गई।' },
    testimony:        { title: 'नई गवाही', body: 'आपके समूह में एक गवाही साझा की गई।' },
    membership_change:{ title: 'समूह अपडेट', body: 'आपको एक प्रार्थना समूह में जोड़ा गया।' },
    role_change:      { title: 'भूमिका अपडेट', body: 'किसी समूह में आपकी भूमिका बदल गई है।' },
    plan_invitation:  { title: 'प्रार्थना योजना निमंत्रण', body: 'आपको साथ मिलकर एक प्रार्थना योजना करने के लिए आमंत्रित किया गया है।' },
  },
  sw: {
    friend_request:   { title: 'Ombi jipya la urafiki', body: 'Una ombi jipya la urafiki.' },
    group_invitation: { title: 'Mwaliko wa kikundi', body: 'Umealikwa kwenye kikundi cha maombi.' },
    community_update: { title: 'Sasisho la maombi', body: 'Kuna sasisho kwenye ombi unalofuatilia.' },
    answered:         { title: 'Ombi limejibiwa', body: 'Ombi unalofuatilia limewekwa alama kuwa limejibiwa.' },
    reaction_bucket:  { title: 'Wanaomba nawe', body: 'Watu kadhaa wanaomba pamoja nawe.' },
    group_prayer_added:{ title: 'Ombi jipya', body: 'Ombi jipya limeshirikiwa katika kikundi chako.' },
    testimony:        { title: 'Ushuhuda mpya', body: 'Ushuhuda umeshirikiwa katika kikundi chako.' },
    membership_change:{ title: 'Sasisho la kikundi', body: 'Umeongezwa kwenye kikundi cha maombi.' },
    role_change:      { title: 'Jukumu limesasishwa', body: 'Jukumu lako katika kikundi limebadilika.' },
    plan_invitation:  { title: 'Mwaliko wa mpango wa maombi', body: 'Umealikwa kuomba mpango pamoja.' },
  },
  am: {
    friend_request:   { title: 'አዲስ የጓደኝነት ጥያቄ', body: 'አዲስ የጓደኝነት ጥያቄ አለዎት።' },
    group_invitation: { title: 'የቡድን ግብዣ', body: 'ወደ የጸሎት ቡድን ተጋብዘዋል።' },
    community_update: { title: 'የጸሎት ዝማኔ', body: 'የሚከታተሉት ጸሎት ላይ ዝማኔ አለ።' },
    answered:         { title: 'ጸሎት ተመለሰ', body: 'የሚከታተሉት ጸሎት እንደተመለሰ ተመዝግቧል።' },
    reaction_bucket:  { title: 'ከእርስዎ ጋር ይጸልያሉ', body: 'ብዙ ሰዎች ከእርስዎ ጋር እየጸለዩ ናቸው።' },
    group_prayer_added:{ title: 'አዲስ የጸሎት ጥያቄ', body: 'በቡድንዎ ውስጥ አዲስ ጸሎት ተጋርቷል።' },
    testimony:        { title: 'አዲስ ምስክርነት', body: 'በቡድንዎ ውስጥ ምስክርነት ተጋርቷል።' },
    membership_change:{ title: 'የቡድን ዝማኔ', body: 'ወደ የጸሎት ቡድን ተጨምረዋል።' },
    role_change:      { title: 'ሚና ተሻሽሏል', body: 'በቡድን ውስጥ ያለዎት ሚና ተቀይሯል።' },
    plan_invitation:  { title: 'የጸሎት እቅድ ግብዣ', body: 'አብረው የጸሎት እቅድ እንድትጸልዩ ተጋብዘዋል።' },
  },
  id: {
    friend_request:   { title: 'Permintaan pertemanan baru', body: 'Anda punya permintaan pertemanan baru.' },
    group_invitation: { title: 'Undangan grup', body: 'Anda diundang ke grup doa.' },
    community_update: { title: 'Pembaruan doa', body: 'Ada pembaruan pada doa yang Anda ikuti.' },
    answered:         { title: 'Doa terjawab', body: 'Doa yang Anda ikuti telah ditandai terjawab.' },
    reaction_bucket:  { title: 'Berdoa bersama Anda', body: 'Beberapa orang sedang berdoa bersama Anda.' },
    group_prayer_added:{ title: 'Permohonan doa baru', body: 'Doa baru dibagikan di grup Anda.' },
    testimony:        { title: 'Kesaksian baru', body: 'Sebuah kesaksian dibagikan di grup Anda.' },
    membership_change:{ title: 'Pembaruan grup', body: 'Anda ditambahkan ke grup doa.' },
    role_change:      { title: 'Peran diperbarui', body: 'Peran Anda dalam grup telah berubah.' },
    plan_invitation:  { title: 'Undangan rencana doa', body: 'Anda diundang untuk mendoakan sebuah rencana bersama.' },
  },
  tl: {
    friend_request:   { title: 'Bagong friend request', body: 'May bago kang friend request.' },
    group_invitation: { title: 'Imbitasyon sa grupo', body: 'Inimbitahan ka sa isang prayer group.' },
    community_update: { title: 'Update sa panalangin', body: 'May update sa isang panalanging sinusundan mo.' },
    answered:         { title: 'Nasagot na panalangin', body: 'Isang panalanging sinusundan mo ay minarkahang nasagot.' },
    reaction_bucket:  { title: 'Nananalangin kasama mo', body: 'Ilang tao ang nananalangin kasama mo.' },
    group_prayer_added:{ title: 'Bagong kahilingan', body: 'May bagong panalanging ibinahagi sa iyong grupo.' },
    testimony:        { title: 'Bagong testimonya', body: 'May testimonyang ibinahagi sa iyong grupo.' },
    membership_change:{ title: 'Update sa grupo', body: 'Idinagdag ka sa isang prayer group.' },
    role_change:      { title: 'Na-update na tungkulin', body: 'Nagbago ang iyong tungkulin sa isang grupo.' },
    plan_invitation:  { title: 'Imbitasyon sa plano ng panalangin', body: 'Inimbitahan ka na magdasal ng isang plano nang sama-sama.' },
  },
};

// Digest summary copy ({count} new notifications). Content-free by construction.
export const DIGEST_MSG: Record<string, { title: string; body: string }> = {
  en: { title: 'Pray4Me 🙏', body: 'You have {count} new notification(s).' },
  fr: { title: 'Pray4Me 🙏', body: 'Vous avez {count} nouvelle(s) notification(s).' },
  de: { title: 'Pray4Me 🙏', body: 'Du hast {count} neue Benachrichtigung(en).' },
  pt: { title: 'Pray4Me 🙏', body: 'Você tem {count} nova(s) notificação(ões).' },
  es: { title: 'Pray4Me 🙏', body: 'Tienes {count} notificación(es) nueva(s).' },
  zh: { title: 'Pray4Me 🙏', body: '你有 {count} 条新通知。' },
  ja: { title: 'Pray4Me 🙏', body: '新しい通知が {count} 件あります。' },
  ko: { title: 'Pray4Me 🙏', body: '새로운 알림이 {count}개 있습니다.' },
  ru: { title: 'Pray4Me 🙏', body: 'У вас {count} новых уведомлений.' },
  ar: { title: 'Pray4Me 🙏', body: 'لديك {count} إشعار جديد.' },
  fa: { title: 'Pray4Me 🙏', body: 'شما {count} اعلان جدید دارید.' },
  hi: { title: 'Pray4Me 🙏', body: 'आपके पास {count} नई सूचनाएँ हैं।' },
  sw: { title: 'Pray4Me 🙏', body: 'Una arifa {count} mpya.' },
  am: { title: 'Pray4Me 🙏', body: '{count} አዲስ ማሳወቂያዎች አለዎት።' },
  id: { title: 'Pray4Me 🙏', body: 'Anda punya {count} notifikasi baru.' },
  tl: { title: 'Pray4Me 🙏', body: 'May {count} bagong abiso ka.' },
};

// Batched-digest push payload — a single summary that replaces N individual
// pushes for a user whose delivery_mode is 'digest'. Routes to the inbox.
export function digestPayload(lang: string, count: number): string {
  const m = DIGEST_MSG[lang] || DIGEST_MSG.en;
  return JSON.stringify({
    title: m.title,
    body: m.body.replace('{count}', String(count)),
    tag: 'digest',
    url: '/notifications',
    notificationId: null,
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

function pick(lang: string): Record<EventType, Copy> {
  return EVENT_MSG[lang] || EVENT_MSG.en;
}

// Internal route for a notification, built ONLY from validated UUIDs in
// `metadata`. Anything malformed falls back to a safe community route. This is
// the server-side twin of src/lib/notificationRoutes.js — a parity test keeps
// the two in lock-step.
export function eventUrl(type: string, meta: Record<string, unknown> = {}): string {
  const group = meta.group_id;
  const prayer = meta.community_prayer_id;
  switch (type) {
    case 'community_update':
    case 'answered':
    case 'reaction_bucket':
    case 'testimony':
      if (isUuid(group) && isUuid(prayer)) return `/community/group/${group}/prayer/${prayer}`;
      if (isUuid(group)) return `/community/group/${group}`;
      return '/community';
    case 'group_prayer_added':
    case 'membership_change':
    case 'role_change':
      return isUuid(group) ? `/community/group/${group}` : '/community';
    case 'friend_request':
    case 'group_invitation':
      return '/community';
    case 'plan_invitation':
      return '/plan';
    default:
      return '/community';
  }
}

// A stable tag so the service worker collapses repeat pushes about the same
// entity instead of stacking duplicates.
export function eventTag(type: string, meta: Record<string, unknown> = {}): string {
  const prayer = meta.community_prayer_id;
  const group = meta.group_id;
  if (isUuid(prayer)) return `${type}:${prayer}`;
  if (isUuid(group)) return `${type}:${group}`;
  return type;
}

// Builds the full Web Push payload string. Content-free by construction.
export function eventPayload(
  type: string,
  lang: string,
  meta: Record<string, unknown> = {},
  notificationId?: string,
): string {
  const table = pick(lang);
  const copy = table[type as EventType] || EVENT_MSG.en[type as EventType] || {
    title: 'Pray4Me 🙏',
    body: 'You have a new notification.',
  };
  return JSON.stringify({
    title: copy.title,
    body: copy.body,
    tag: eventTag(type, meta),
    url: eventUrl(type, meta),
    notificationId: notificationId || null,
  });
}
