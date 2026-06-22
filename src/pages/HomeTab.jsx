import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import PrayerCard from '../components/PrayerCard';
import { format } from 'date-fns';
import { fr, enUS, de, ptBR } from 'date-fns/locale';
import { t } from '../i18n';

const DAY_NAMES = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

const DATE_LOCALES = { fr, en: enUS, de, pt: ptBR };

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
};

export default function HomeTab({ onEdit }) {
  const { getTodaysPrayers, categories, prayers, settings } = usePrayerStore();
  const { user } = useAuthStore();
  const { tr } = useTranslationStore();
  const lang = settings.language || 'fr';
  const dateLocale = DATE_LOCALES[lang] || fr;

  const todaysPrayers = getTodaysPrayers();
  const today = new Date();
  const dayIndex = today.getDay();
  const todayCategories = categories.filter((c) => c.week_days && c.week_days.includes(dayIndex));
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const verseList = VERSES[lang] || VERSES.en;
  const verse = verseList[dayIndex % verseList.length];

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const hour = today.getHours();
  const greeting = hour < 12 ? t(lang, 'greetingMorning') : hour < 18 ? t(lang, 'greetingAfternoon') : t(lang, 'greetingEvening');
  const greetingEmoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';

  return (
    <div>
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
            <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>"{verse.text}"</p>
            <p className="text-xs text-right mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>— {verse.ref}</p>
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

        {/* Today's prayers */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'todaysPrayers')}</h3>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{todaysPrayers.length} {t(lang, 'subjects')}</span>
        </div>

        {todaysPrayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🕊️</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'noPrayersToday')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'noPrayersSub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todaysPrayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} onEdit={onEdit} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
