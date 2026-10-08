const COPY = {
  en: ['Report AI output', 'Describe the problem or paste the AI text you want to report. Your prayer and AI conversation are not attached automatically. Only what you submit here is sent to the Qetoret team.'],
  fr: ['Signaler un résultat IA', 'Décrivez le problème ou collez le texte IA à signaler. Votre prière et votre conversation IA ne sont pas jointes automatiquement. Seul ce que vous envoyez ici est transmis à l’équipe Qetoret.'],
  de: ['KI-Ausgabe melden', 'Beschreibe das Problem oder füge den KI-Text ein. Dein Gebet und dein KI-Gespräch werden nicht automatisch angehängt. Nur deine Angaben hier werden an das Qetoret-Team gesendet.'],
  es: ['Denunciar contenido de IA', 'Describe el problema o pega el texto de IA. Tu oración y conversación no se adjuntan automáticamente. Solo se envía al equipo Qetoret lo que escribas aquí.'],
  pt: ['Denunciar conteúdo de IA', 'Descreve o problema ou cola o texto de IA. A tua oração e conversa não são anexadas automaticamente. Só o que enviares aqui será transmitido à equipa Qetoret.'],
  zh: ['举报 AI 内容', '请描述问题或粘贴要举报的 AI 文本。你的祷告和 AI 对话不会自动附加。只有你在此提交的内容会发送给 Qetoret 团队。'],
  hi: ['AI सामग्री की रिपोर्ट करें', 'समस्या बताएँ या रिपोर्ट करने वाला AI पाठ चिपकाएँ। आपकी प्रार्थना और AI बातचीत अपने आप संलग्न नहीं होती। यहाँ भेजी गई जानकारी ही Qetoret टीम को जाती है।'],
  ja: ['AI の出力を報告', '問題を説明するか、報告したい AI の文章を貼り付けてください。祈りや会話は自動で添付されません。ここで送信した内容だけが Qetoret チームに届きます。'],
  sw: ['Ripoti maudhui ya AI', 'Eleza tatizo au bandika maandishi ya AI. Maombi na mazungumzo yako hayaambatishwi kiotomatiki. Unachotuma hapa tu ndicho kinachotumwa kwa timu ya Qetoret.'],
  am: ['የAI ውጤትን ሪፖርት አድርግ', 'ችግሩን ግለጽ ወይም ሪፖርት የምታደርገውን የAI ጽሑፍ ለጥፍ። ጸሎትህና ውይይትህ በራስ-ሰር አይያያዙም። እዚህ የምትልከው ብቻ ለQetoret ቡድን ይላካል።'],
  id: ['Laporkan keluaran AI', 'Jelaskan masalah atau tempel teks AI yang ingin dilaporkan. Doa dan percakapan Anda tidak dilampirkan otomatis. Hanya yang Anda kirim di sini diteruskan kepada tim Qetoret.'],
  tl: ['Iulat ang nilalaman ng AI', 'Ilarawan ang problema o idikit ang tekstong AI. Hindi awtomatikong ikinakabit ang panalangin at usapan mo. Ang isusumite mo lang dito ang ipapadala sa Qetoret team.'],
  ko: ['AI 출력 신고', '문제를 설명하거나 신고할 AI 텍스트를 붙여 넣으세요. 기도와 대화는 자동으로 첨부되지 않습니다. 여기서 제출한 내용만 Qetoret 팀에 전송됩니다.'],
  ru: ['Сообщить о тексте ИИ', 'Опишите проблему или вставьте текст ИИ. Ваша молитва и переписка не прикрепляются автоматически. Команде Qetoret отправляется только то, что вы укажете здесь.'],
  ar: ['الإبلاغ عن محتوى الذكاء الاصطناعي', 'صِف المشكلة أو الصق النص الذي تريد الإبلاغ عنه. لا تُرفق صلاتك ومحادثتك تلقائيًا. يُرسل إلى فريق Qetoret فقط ما تقدمه هنا.'],
  fa: ['گزارش خروجی هوش مصنوعی', 'مشکل را شرح دهید یا متن مورد نظر را بچسبانید. دعا و گفت‌وگوی شما خودکار پیوست نمی‌شود. فقط آنچه اینجا ارسال می‌کنید به تیم Qetoret می‌رسد.'],
};

const OWNERSHIP = {
  en: 'The report is linked to your account ID so account deletion also removes it. Your name and email are not attached.',
  fr: 'Le signalement est lié à votre identifiant de compte pour être supprimé avec celui-ci. Votre nom et votre adresse e-mail ne sont pas joints.',
  de: 'Die Meldung ist mit deiner Konto-ID verknüpft und wird bei Kontolöschung entfernt. Name und E-Mail werden nicht angehängt.',
  es: 'La denuncia se vincula al identificador de tu cuenta y se elimina con ella. No se adjuntan tu nombre ni correo.',
  pt: 'A denúncia é associada ao identificador da conta e apagada com ela. O teu nome e e-mail não são anexados.',
  zh: '举报会关联你的账户 ID，以便删除账户时一并删除。不会附加姓名或电子邮件。',
  hi: 'रिपोर्ट आपके खाता आईडी से जुड़ी है ताकि खाता मिटाने पर यह भी मिट जाए। नाम और ईमेल संलग्न नहीं होते।',
  ja: '報告はアカウント ID に紐づけられ、アカウント削除時に削除されます。名前やメールは添付されません。',
  sw: 'Ripoti inaunganishwa na kitambulisho cha akaunti yako ili ifutwe pamoja na akaunti. Jina na barua pepe haviambatishwi.',
  am: 'ሪፖርቱ መለያህ ሲሰረዝ እንዲሰረዝ ከመለያ መለያህ ጋር ይያያዛል። ስምህና ኢሜይልህ አይያያዙም።',
  id: 'Laporan dikaitkan dengan ID akun agar ikut terhapus saat akun dihapus. Nama dan email tidak dilampirkan.',
  tl: 'Nakaugnay ang ulat sa ID ng account upang mabura rin kapag binura ang account. Hindi ikinakabit ang pangalan at email.',
  ko: '계정 삭제 시 함께 삭제되도록 신고가 계정 ID에 연결됩니다. 이름과 이메일은 첨부되지 않습니다.',
  ru: 'Сообщение связано с ID аккаунта и удаляется вместе с ним. Имя и email не прикрепляются.',
  ar: 'يرتبط البلاغ بمعرّف حسابك ليُحذف عند حذف الحساب. لا يُرفق اسمك أو بريدك الإلكتروني.',
  fa: 'گزارش به شناسه حساب شما پیوند می‌خورد تا با حذف حساب حذف شود. نام و ایمیل شما پیوست نمی‌شود.',
};

export function aiOutputReportText(lang = 'en') {
  const [title, explanation] = COPY[lang] || COPY.en;
  return { title, explanation, ownership: OWNERSHIP[lang] || OWNERSHIP.en };
}
