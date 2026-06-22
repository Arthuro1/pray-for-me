import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
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

const VERSES = [
  { text: "Priez sans cesse.", ref: "1 Thessaloniciens 5:17" },
  { text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications.", ref: "Philippiens 4:6" },
  { text: "La prière fervente du juste a une grande efficacité.", ref: "Jacques 5:16" },
  { text: "Demandez, et l'on vous donnera; cherchez, et vous trouverez; frappez, et l'on vous ouvrira.", ref: "Matthieu 7:7" },
  { text: "Je vous le dis, tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir.", ref: "Marc 11:24" },
  { text: "Cherchez d'abord le royaume de Dieu et sa justice, et toutes ces choses vous seront données par-dessus.", ref: "Matthieu 6:33" },
  { text: "L'Éternel est proche de tous ceux qui l'invoquent, de tous ceux qui l'invoquent avec sincérité.", ref: "Psaume 145:18" },
];

export default function HomeTab({ onEdit }) {
  const { getTodaysPrayers, categories, prayers, settings } = usePrayerStore();
  const { user } = useAuthStore();
  const lang = settings.language || 'fr';
  const dateLocale = DATE_LOCALES[lang] || fr;

  const todaysPrayers = getTodaysPrayers();
  const today = new Date();
  const dayIndex = today.getDay();
  const todayCategories = categories.filter((c) => c.week_days && c.week_days.includes(dayIndex));
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const verse = VERSES[dayIndex % VERSES.length];

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const hour = today.getHours();
  const greeting = hour < 12 ? t(lang, 'greetingMorning') : hour < 18 ? t(lang, 'greetingAfternoon') : t(lang, 'greetingEvening');
  const greetingEmoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';

  return (
    <div>
      {/* Hero banner */}
      <div
        className="relative overflow-hidden px-5 pt-10 pb-8"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b5e 55%, #5a3fa0 100%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=40')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.07,
          }}
        />
        <div className="relative">
          <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {DAY_NAMES[lang]?.[dayIndex]} · {format(today, 'd MMMM yyyy', { locale: dateLocale })}
          </p>
          <h2 className="text-xl font-semibold text-white mb-5">
            {greeting}{displayName ? `, ${displayName}` : ''} {greetingEmoji}
          </h2>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {t(lang, 'verseOfDay')}
            </p>
            <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
              "{verse.text}"
            </p>
            <p className="text-xs text-right mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>— {verse.ref}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { value: activeCount, label: t(lang, 'activePrayers'), color: '#7c5cfc' },
            { value: answeredCount, label: t(lang, 'answeredPrayers') + ' 🙌', color: '#2a7a4e' },
            { value: todaysPrayers.length, label: t(lang, 'todayPrayers'), color: '#c07c2a' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center" style={{ background: '#fff', border: '0.5px solid #ede8f5' }}>
              <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9b8cb0' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Today's categories */}
        {todayCategories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#9b8cb0' }}>
              {t(lang, 'todaysCategories')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {todayCategories.map((cat) => (
                <span key={cat.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: cat.color }}>
                  {cat.emoji} {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Today's prayers */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: '#1a0f2e' }}>{t(lang, 'todaysPrayers')}</h3>
          <span className="text-xs" style={{ color: '#9b8cb0' }}>{todaysPrayers.length} {t(lang, 'subjects')}</span>
        </div>

        {todaysPrayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🕊️</p>
            <p className="text-sm" style={{ color: '#6b5b8a' }}>{t(lang, 'noPrayersToday')}</p>
            <p className="text-xs mt-1" style={{ color: '#b0a4c0' }}>{t(lang, 'noPrayersSub')}</p>
          </div>
        ) : (
          todaysPrayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} onEdit={onEdit} lang={lang} />
          ))
        )}
      </div>
    </div>
  );
}
