import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import { format } from 'date-fns';
import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { Sparkles, Loader2, Plus, User } from 'lucide-react';
import { t } from '../i18n';
import { originAuthor } from '../utils/user';
import { getDayPlanSuggestions } from '../aiRecommendations';
import { supabase } from '../lib/supabase';
import AiConsentModal, { hasAiConsent } from '../components/AiConsentModal';

const DAY_NAMES = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR, zh: enUS, es: enUS, hi: enUS, ja: enUS, sw: enUS, am: enUS, id: enUS, tl: enUS, ko: enUS, ru: enUS, ar: enUS, fa: enUS };

const VERSES = {
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

export default function HomeTab({ onAdd }) {
  const navigate = useNavigate();
  const { getTodaysPrayers, categories, prayers, settings, addPrayer } = usePrayerStore();
  const { user } = useAuthStore();
  const { tr } = useTranslationStore();
  const [daySuggestions, setDaySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState(null);
  const [addedTitles, setAddedTitles] = useState(new Set());
  const [verse, setVerse] = useState(null);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const lang = settings.language || 'fr';
  const dateLocale = DATE_LOCALES[lang] || fr;

  const todaysPrayers = getTodaysPrayers();
  const today = new Date();
  const dayIndex = today.getDay();
  const todayCategories = categories.filter((c) => c.week_days && c.week_days.includes(dayIndex));
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const activeCount = prayers.filter((p) => p.status === 'active').length;

  useEffect(() => {
    const dateKey = today.toISOString().slice(0, 10);
    const cacheKey = `verse_${dateKey}_${lang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setVerse(JSON.parse(cached)); return; } catch {}
    }
    // Show fallback immediately
    const fallbackList = VERSES[lang] || VERSES.en;
    setVerse(fallbackList[dayIndex % fallbackList.length]);
    // Fetch from Supabase (shared verse generated by server cron)
    supabase
      .from('daily_verse')
      .select('text, ref')
      .eq('date', dateKey)
      .eq('lang', lang)
      .single()
      .then(({ data }) => {
        if (data?.text && data?.ref) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          setVerse(data);
        }
      });
  }, [lang]);

  useEffect(() => { setDaySuggestions([]); setSuggestError(null); }, [lang]);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const hour = today.getHours();
  const greeting = hour < 12 ? t(lang, 'greetingMorning') : hour < 18 ? t(lang, 'greetingAfternoon') : t(lang, 'greetingEvening');
  const greetingEmoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';

  const fetchDaySuggestions = async () => {
    if (loadingSuggestions || todayCategories.length === 0) return;
    if (!hasAiConsent('home')) { setShowAiConsent(true); return; }
    setLoadingSuggestions(true);
    setSuggestError(null);
    const catNames = todayCategories.map(c => `${c.emoji} ${c.name}`).join(', ');
    const { recs, error } = await getDayPlanSuggestions({ categoryNames: catNames, lang });
    setDaySuggestions(recs);
    setSuggestError(error);
    setLoadingSuggestions(false);
  };

  const handleAddSuggestion = async (rec) => {
    const catIds = todayCategories.map(c => c.id);
    await addPrayer({ title: rec.title, description: rec.description || '', categoryIds: catIds });
    setAddedTitles(prev => new Set([...prev, rec.title]));
  };

  return (
    <div>
      {showAiConsent && (
        <AiConsentModal
          lang={lang}
          context="home"
          onAccept={() => { setShowAiConsent(false); fetchDaySuggestions(); }}
          onCancel={() => setShowAiConsent(false)}
        />
      )}
      {/* Hero banner */}
      <div className="relative overflow-hidden px-5 md:px-8 pt-10 pb-8" style={{ background: 'var(--header)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=40')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.07 }} />
        <div className="relative">
          <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {DAY_NAMES[lang]?.[dayIndex]} · {format(today, 'd MMMM yyyy', { locale: dateLocale })}
          </p>
          <h2 className="text-xl font-semibold mb-5 text-white">
            {greeting}{displayName ? `, ${displayName}` : ''} {greetingEmoji}
          </h2>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t(lang, 'verseOfDay')}
            </p>
            {verse ? (
              <>
                <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>"{verse.text}"</p>
                <p className="text-xs text-right mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>— {verse.ref}</p>
              </>
            ) : (
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: activeCount, label: t(lang, 'activePrayers'), color: 'var(--accent)' },
            { value: answeredCount, label: t(lang, 'answeredPrayers') + ' 🙌', color: 'var(--success)' },
            { value: todaysPrayers.length, label: t(lang, 'todayPrayers'), color: '#c07c2a' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Today's categories */}
        {todayCategories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'todaysCategories')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {todayCategories.map((cat) => (
                <span key={cat.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: cat.color }}>
                  {cat.emoji} {tr(cat.name, lang)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Today's prayers header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'todaysPrayers')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{todaysPrayers.length} {t(lang, 'subjects')}</span>
            {todayCategories.length > 0 && (
              <button
                onClick={fetchDaySuggestions}
                disabled={loadingSuggestions}
                title={t(lang, 'aiDaySuggest')}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium text-white disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {loadingSuggestions
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} />}
                {t(lang, 'aiSuggest')}
              </button>
            )}
          </div>
        </div>

        {todaysPrayers.length === 0 && (
          <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-4xl mb-3">🕊️</p>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'emptyEncourage')}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>{t(lang, 'noPrayersToday')}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={15} /> {t(lang, 'emptyAddManual')}
              </button>
              {todayCategories.length > 0 && (
                <>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'emptyOrLabel')}</span>
                  <button
                    onClick={fetchDaySuggestions}
                    disabled={loadingSuggestions}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                  >
                    {loadingSuggestions
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Sparkles size={15} />}
                    {t(lang, 'emptyAiGenerate')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {todaysPrayers.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '0.5px solid var(--border)' }}>
            {todaysPrayers.map((prayer, idx) => {
              const isAnswered = prayer.status === 'answered';
              const pCatIds = (prayer.prayer_categories || []).map(pc => pc.category_id);
              const pCats = categories.filter(c => pCatIds.includes(c.id));
              return (
                <button
                  key={prayer.id}
                  onClick={() => navigate(`/prayers/${prayer.id}`)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{
                    background: 'var(--surface)',
                    borderBottom: idx < todaysPrayers.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: isAnswered ? '#059669' : 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)', textDecoration: isAnswered ? 'line-through' : 'none', opacity: isAnswered ? 0.6 : 1 }}>
                      {tr(prayer.title, lang)}
                    </p>
                    {pCats.length > 0 && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {pCats.map(c => `${c.emoji} ${tr(c.name, lang)}`).join(' · ')}
                      </p>
                    )}
                    {(() => {
                      const oa = originAuthor(prayer);
                      return oa ? (
                        <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                          <User size={11} /> {oa.anonymous ? t(lang, 'anonymous') : oa.name}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: isAnswered ? '#e8f5ed' : 'var(--accent-soft)', color: isAnswered ? '#059669' : 'var(--accent)' }}>
                    {isAnswered ? t(lang, 'answered2') : t(lang, 'active2')}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Scripture suggestions — shown regardless of list state */}
        {suggestError && (
          <p className="text-xs text-center mt-2 mb-3" style={{ color: 'var(--text-3)' }}>{suggestError}</p>
        )}
        {daySuggestions.length > 0 && (
          <div className="space-y-2 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
              <Sparkles size={11} className="inline mr-1" style={{ color: 'var(--accent)' }} />
              {t(lang, 'aiDaySuggestBtn')}
            </p>
            {daySuggestions.map((rec) => {
              const added = addedTitles.has(rec.title);
              return (
                <div key={rec.title} className="flex items-start gap-3 rounded-2xl px-4 py-3.5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{rec.title}</p>
                    {rec.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{rec.description}</p>
                    )}
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {todayCategories.map(c => (
                        <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: c.color }}>
                          {c.emoji} {tr(c.name, lang)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddSuggestion(rec)}
                    disabled={added}
                    title={t(lang, 'aiDayAdd')}
                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all"
                    style={{ background: added ? 'var(--success)' : 'var(--accent)' }}
                  >
                    {added ? '✓' : <Plus size={15} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
