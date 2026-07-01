// Curated "verse of the day" pool, one vetted set per supported language.
//
// This replaces the former AI-generated daily verse (a Supabase cron that made
// ~16 Claude calls every day, forever): a static, deterministic rotation costs
// nothing, shows instantly, works offline, and — unlike an LLM asked to quote
// Scripture — can never misquote. `verseOfDay` picks the same verse for every
// user on a given day so the "verse of the day" stays shared across the app.
//
// To expand variety, add more vetted verses per language from an authoritative
// translation; the rotation adapts automatically to the list length.
export const VERSES = {
  fr: [
    { text: "Priez sans cesse.", ref: "1 Thessaloniciens 5:17" },
    { text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications.", ref: "Philippiens 4:6" },
    { text: "La prière fervente du juste a une grande efficacité.", ref: "Jacques 5:16" },
    { text: "Demandez, et l'on vous donnera; cherchez, et vous trouverez; frappez, et l'on vous ouvrira.", ref: "Matthieu 7:7" },
    { text: "Je vous le dis, tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir.", ref: "Marc 11:24" },
    { text: "Cherchez d'abord le royaume de Dieu et sa justice, et toutes ces choses vous seront données par-dessus.", ref: "Matthieu 6:33" },
    { text: "L'Éternel est proche de tous ceux qui l'invoquent, de tous ceux qui l'invoquent avec sincérité.", ref: "Psaume 145:18" },
  ],
  en: [
    { text: "Pray without ceasing.", ref: "1 Thessalonians 5:17" },
    { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", ref: "Philippians 4:6" },
    { text: "The prayer of a righteous person is powerful and effective.", ref: "James 5:16" },
    { text: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.", ref: "Matthew 7:7" },
    { text: "Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.", ref: "Mark 11:24" },
    { text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", ref: "Matthew 6:33" },
    { text: "The Lord is near to all who call on him, to all who call on him in truth.", ref: "Psalm 145:18" },
  ],
  de: [
    { text: "Betet ohne Unterlass.", ref: "1. Thessalonicher 5:17" },
    { text: "Sorgt euch um nichts, sondern in allem lasst eure Bitten im Gebet und Flehen mit Danksagung vor Gott kundwerden.", ref: "Philipper 4:6" },
    { text: "Das inständige Gebet eines Gerechten vermag viel.", ref: "Jakobus 5:16" },
    { text: "Bittet, so wird euch gegeben; suchet, so werdet ihr finden; klopfet an, so wird euch aufgetan.", ref: "Matthäus 7:7" },
    { text: "Darum sage ich euch: Alles, was ihr im Gebet begehrt, glaubt nur, dass ihr's empfangen werdet, so wird's euch werden.", ref: "Markus 11:24" },
    { text: "Trachtet zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch das alles zufallen.", ref: "Matthäus 6:33" },
    { text: "Der Herr ist nahe allen, die ihn anrufen, allen, die ihn ernstlich anrufen.", ref: "Psalm 145:18" },
  ],
  pt: [
    { text: "Orai sem cessar.", ref: "1 Tessalonicenses 5:17" },
    { text: "Não andeis ansiosos por coisa alguma; antes em tudo apresentai as vossas petições a Deus em oração e súplica com ações de graças.", ref: "Filipenses 4:6" },
    { text: "A oração eficaz do justo pode muito.", ref: "Tiago 5:16" },
    { text: "Pedi, e dar-se-vos-á; buscai e encontrareis; batei, e abrir-se-vos-á.", ref: "Mateus 7:7" },
    { text: "Por isso vos digo que tudo quanto em oração pedirdes, crede que recebestes e assim será convosco.", ref: "Marcos 11:24" },
    { text: "Buscai em primeiro lugar o seu reino e a sua justiça, e todas essas coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
    { text: "O Senhor está perto de todos os que o invocam, de todos os que o invocam com sinceridade.", ref: "Salmos 145:18" },
  ],
  zh: [
    { text: "不住地祷告。", ref: "帖撒罗尼迦前书 5:17" },
    { text: "应当一无挂虑，只要凡事藉着祷告、祈求和感谢，将你们所要的告诉神。", ref: "腓立比书 4:6" },
    { text: "义人祈祷所发的力量是大有功效的。", ref: "雅各书 5:16" },
    { text: "你们祈求，就给你们；寻找，就寻见；叩门，就给你们开门。", ref: "马太福音 7:7" },
    { text: "所以我告诉你们，凡你们祷告祈求的，无论是什么，只要信是得着的，就必得着。", ref: "马可福音 11:24" },
    { text: "你们要先求他的国和他的义，这些东西都要加给你们了。", ref: "马太福音 6:33" },
    { text: "凡呼求耶和华的，就是诚心呼求他的，耶和华便与他们相近。", ref: "诗篇 145:18" },
  ],
  es: [
    { text: "Orad sin cesar.", ref: "1 Tesalonicenses 5:17" },
    { text: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.", ref: "Filipenses 4:6" },
    { text: "La oración eficaz del justo puede mucho.", ref: "Santiago 5:16" },
    { text: "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.", ref: "Mateo 7:7" },
    { text: "Por tanto, os digo que todo lo que pidiereis orando, creed que lo recibiréis, y os vendrá.", ref: "Marcos 11:24" },
    { text: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.", ref: "Mateo 6:33" },
    { text: "Cercano está Jehová a todos los que le invocan, a todos los que le invocan de veras.", ref: "Salmos 145:18" },
  ],
  hi: [
    { text: "निरन्तर प्रार्थना करते रहो।", ref: "1 थिस्सलुनीकियों 5:17" },
    { text: "किसी भी बात की चिन्ता मत करो; परन्तु हर एक बात में प्रार्थना और बिनती के द्वारा धन्यवाद के साथ अपनी विनतियाँ परमेश्वर के सम्मुख उपस्थित करो।", ref: "फिलिप्पियों 4:6" },
    { text: "धर्मी जन की प्रार्थना के प्रभाव से बहुत कुछ हो सकता है।", ref: "याकूब 5:16" },
    { text: "मांगो, तो तुम्हें दिया जाएगा; ढूंढ़ो, तो तुम पाओगे; खटखटाओ, तो तुम्हारे लिए खोला जाएगा।", ref: "मत्ती 7:7" },
    { text: "इसलिए मैं तुमसे कहता हूं, जो कुछ तुम प्रार्थना करके मांगो, विश्वास करो कि मिल गया, तो तुम्हें मिलेगा।", ref: "मरकुस 11:24" },
    { text: "इसलिए पहले परमेश्वर के राज्य और उसकी धार्मिकता की खोज करो, तो ये सब वस्तुएं भी तुम्हें मिल जाएंगी।", ref: "मत्ती 6:33" },
    { text: "जो उसे पुकारते हैं, जो उसे सच्चाई से पुकारते हैं, उन सबके निकट यहोवा है।", ref: "भजन संहिता 145:18" },
  ],
  ja: [
    { text: "絶えず祈りなさい。", ref: "1テサロニケ 5:17" },
    { text: "何も思い煩わないで、あらゆる場合に、感謝をもってささげる祈りと願いによって、あなたがたの求めることを神に打ち明けなさい。", ref: "ピリピ 4:6" },
    { text: "義人の祈りは大いに力があり、効果があります。", ref: "ヤコブ 5:16" },
    { text: "求めなさい。そうすれば与えられます。捜しなさい。そうすれば見つかります。たたきなさい。そうすれば開かれます。", ref: "マタイ 7:7" },
    { text: "だからあなたがたに言うのです。祈って求めるものは何でも、すでに受けたと信じなさい。そうすれば、そのとおりになります。", ref: "マルコ 11:24" },
    { text: "まず神の国と神の義を求めなさい。そうすれば、これらのものはすべて、それに加えて与えられます。", ref: "マタイ 6:33" },
    { text: "主はご自分を呼び求めるすべての者に、真実をもってご自分を呼び求めるすべての者に、近くいてくださいます。", ref: "詩篇 145:18" },
  ],
  sw: [
    { text: "Ombeni bila kukoma.", ref: "1 Wathesalonike 5:17" },
    { text: "Msijishughulishe na kitu chochote, bali katika kila kitu maombi yenu na dua na shukrani ziwasilishwe kwa Mungu.", ref: "Wafilipi 4:6" },
    { text: "Maombi ya mtu mwenye haki, yakiombwa kwa bidii, yana nguvu nyingi.", ref: "Yakobo 5:16" },
    { text: "Ombeni, nanyi mtapewa; tafuteni, nanyi mtapata; bisheni, nanyi mtafunguliwa.", ref: "Mathayo 7:7" },
    { text: "Kwa sababu hiyo nawaambia, kila kitu mnaomba mkisali, aminini kwamba mmekwisha kupokea, nazo zitakuwa zenu.", ref: "Marko 11:24" },
    { text: "Bali utafuteni kwanza ufalme wa Mungu na haki yake; na hizi zote mtaziongezewa.", ref: "Mathayo 6:33" },
    { text: "Bwana yu karibu na wote wanaomwita, wote wanaomwita kwa kweli.", ref: "Zaburi 145:18" },
  ],
  am: [
    { text: "ሳታቋርጡ ጸልዩ።", ref: "1ኛ ተሰሎንቄ 5:17" },
    { text: "ስለ ምንም አትጨነቁ፤ ነገር ግን በሁሉ ነገር ምስጋናን ጨምራችሁ ጸሎትና ልመናን ለእግዚአብሔር አሳውቁ።", ref: "ፊልጵስዩስ 4:6" },
    { text: "የጻድቅ ሰው ጸሎት ብዙ ያደርጋል።", ref: "ያዕቆብ 5:16" },
    { text: "ለምኑ ይሰጣችኋል፤ ፈልጉ ታገኛላችሁ፤ መቱ ይከፈትላችኋል።", ref: "ማቴዎስ 7:7" },
    { text: "ስለዚህ እላችኋለሁ፤ ስትጸልዩ የምትለምኑትን ሁሉ ተቀብላችኋል ብላችሁ እመኑ፥ ይሆናልላችሁ።", ref: "ማርቆስ 11:24" },
    { text: "ነገር ግን አስቀድማችሁ የእግዚአብሔርን መንግሥቱንና ጽድቁን ፈልጉ፤ ይህም ሁሉ ይጨመርላችኋል።", ref: "ማቴዎስ 6:33" },
    { text: "እግዚአብሔር ለሚጠሩት ሁሉ፥ በእውነት ለሚጠሩት ሁሉ ቅርብ ነው።", ref: "መዝሙር 145:18" },
  ],
  id: [
    { text: "Berdoalah tanpa henti.", ref: "1 Tesalonika 5:17" },
    { text: "Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.", ref: "Filipi 4:6" },
    { text: "Doa orang yang benar, bila dengan yakin didoakan, sangat besar kuasanya.", ref: "Yakobus 5:16" },
    { text: "Mintalah, maka akan diberikan kepadamu; carilah, maka kamu akan mendapat; ketoklah, maka pintu akan dibukakan bagimu.", ref: "Matius 7:7" },
    { text: "Karena itu Aku berkata kepadamu: apa saja yang kamu minta dan doakan, percayalah bahwa kamu telah menerimanya, maka hal itu akan diberikan kepadamu.", ref: "Markus 11:24" },
    { text: "Tetapi carilah dahulu Kerajaan Allah dan kebenarannya, maka semuanya itu akan ditambahkan kepadamu.", ref: "Matius 6:33" },
    { text: "TUHAN dekat pada semua orang yang berseru kepada-Nya, pada semua orang yang berseru kepada-Nya dalam kesetiaan.", ref: "Mazmur 145:18" },
  ],
  tl: [
    { text: "Manalangin kayo nang walang humpay.", ref: "1 Tesalonica 5:17" },
    { text: "Huwag kayong mabalisa sa anumang bagay; sa halip, sa lahat ng bagay, ipahayag ang inyong mga kahilingan sa Diyos sa pamamagitan ng panalangin at pagmamakaawa na may pasasalamat.", ref: "Filipos 4:6" },
    { text: "Ang taimtim na panalangin ng taong matuwid ay may malaking kapangyarihan.", ref: "Santiago 5:16" },
    { text: "Humingi kayo at kayo'y bibigyan; maghanap kayo at kayo'y makakahanap; kumatok kayo at kayo'y pagbubukas.", ref: "Mateo 7:7" },
    { text: "Kaya sinasabi ko sa inyo, anumang hingin ninyo sa panalangin, manampalataya kayong ito ay natanggap na ninyo, at magkakaroon kayo nito.", ref: "Marcos 11:24" },
    { text: "Ngunit hanapin muna ninyo ang kaharian ng Diyos at ang kanyang katuwiran, at ang lahat ng mga bagay na ito ay idadagdag sa inyo.", ref: "Mateo 6:33" },
    { text: "Ang Panginoon ay malapit sa lahat ng tumatawag sa kanya, sa lahat ng tumatawag sa kanya nang tapat.", ref: "Awit 145:18" },
  ],
  ko: [
    { text: "쉬지 말고 기도하라.", ref: "데살로니가전서 5:17" },
    { text: "아무것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라.", ref: "빌립보서 4:6" },
    { text: "의인의 간구는 역사하는 힘이 큼이니라.", ref: "야고보서 5:16" },
    { text: "구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니.", ref: "마태복음 7:7" },
    { text: "그러므로 내가 너희에게 말하노니 무엇이든지 기도하고 구하는 것은 받은 줄로 믿으라 그리하면 너희에게 그대로 되리라.", ref: "마가복음 11:24" },
    { text: "그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라.", ref: "마태복음 6:33" },
    { text: "여호와께서는 자기에게 간구하는 모든 자 곧 진실하게 간구하는 모든 자에게 가까이 하시는도다.", ref: "시편 145:18" },
  ],
  ru: [
    { text: "Непрестанно молитесь.", ref: "1 Фессалоникийцам 5:17" },
    { text: "Не заботьтесь ни о чём, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом.", ref: "Филиппийцам 4:6" },
    { text: "Много может усиленная молитва праведного.", ref: "Иакова 5:16" },
    { text: "Просите, и дано будет вам; ищите, и найдёте; стучите, и отворят вам.", ref: "Матфея 7:7" },
    { text: "Потому говорю вам: всё, чего ни будете просить в молитве, верьте, что получите, — и будет вам.", ref: "Марка 11:24" },
    { text: "Ищите же прежде Царства Божия и правды Его, и это всё приложится вам.", ref: "Матфея 6:33" },
    { text: "Господь близок ко всем призывающим Его, ко всем призывающим Его в истине.", ref: "Псалтирь 145:18" },
  ],
  ar: [
    { text: "صلوا بلا انقطاع.", ref: "1 تسالونيكي 5:17" },
    { text: "لا تهتموا بشيء، بل في كل شيء بالصلاة والتضرع مع الشكر، لتُعلَم طلباتكم لدى الله.", ref: "فيلبي 4:6" },
    { text: "صلاة البار تقتدر كثيراً في فعلها.", ref: "يعقوب 5:16" },
    { text: "اسألوا تُعطَوا، اطلبوا تجدوا، اقرعوا يُفتَح لكم.", ref: "متى 7:7" },
    { text: "لذلك أقول لكم: كل ما تطلبونه حين تصلون فآمنوا أنكم تنالونه، فيكون لكم.", ref: "مرقس 11:24" },
    { text: "بل اطلبوا أولاً ملكوت الله وبره، وهذه كلها تُزاد لكم.", ref: "متى 6:33" },
    { text: "الرب قريب من كل الذين يدعونه، من كل الذين يدعونه بالحق.", ref: "مزمور 145:18" },
  ],
  fa: [
    { text: "پیوسته دعا کنید.", ref: "اول تسالونیکیان 5:17" },
    { text: "هیچ چیز را نگران نباشید، بلکه در هر چیز، با دعا و تضرع با شکرگزاری، خواسته‌های خود را به خدا اعلام کنید.", ref: "فیلیپیان 4:6" },
    { text: "دعای مرد عادل تأثیر عظیمی دارد.", ref: "یعقوب 5:16" },
    { text: "بخواهید تا به شما داده شود؛ بجویید تا بیابید؛ بکوبید تا در باز شود.", ref: "متی 7:7" },
    { text: "بنابراین به شما می‌گویم هر چه در دعا بخواهید، ایمان داشته باشید که آن را دریافت کرده‌اید، و برای شما خواهد بود.", ref: "مرقس 11:24" },
    { text: "بلکه نخست پادشاهی خدا و عدالت او را بجویید، و همه این‌ها به شما افزوده خواهد شد.", ref: "متی 6:33" },
    { text: "خداوند به همه کسانی که او را می‌خوانند، به همه کسانی که او را در راستی می‌خوانند، نزدیک است.", ref: "مزامیر 145:18" },
  ],
};

// Day-of-year (1–366) in the given date's local time, used to rotate the pool so
// every user sees the same verse on the same calendar day.
function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86400000);
}

// The verse of the day for a language: deterministic per calendar day, shared
// across all users, with an English fallback for languages without a pool.
export function verseOfDay(lang, date = new Date()) {
  const list = VERSES[lang] || VERSES.en;
  return list[dayOfYear(date) % list.length];
}
