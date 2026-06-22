import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import PrayerCard from '../components/PrayerCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

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
  const { getTodaysPrayers, categories, prayers } = usePrayerStore();
  const { user } = useAuthStore();
  const todaysPrayers = getTodaysPrayers();

  const today = new Date();
  const dayIndex = today.getDay();
  const todayCategories = categories.filter((c) => c.week_days && c.week_days.includes(dayIndex));
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const verse = VERSES[dayIndex % VERSES.length];

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'ami';

  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
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
          {/* Greeting */}
          <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {DAY_NAMES[dayIndex]} · {format(today, 'd MMMM yyyy', { locale: fr })}
          </p>
          <h2 className="text-xl font-semibold text-white mb-5">
            {greeting}, {displayName} {greetingEmoji}
          </h2>

          {/* Verse card */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Verset du jour
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
            { value: activeCount, label: 'Actives', color: '#7c5cfc' },
            { value: answeredCount, label: 'Exaucées 🙌', color: '#2a7a4e' },
            { value: todaysPrayers.length, label: "Aujourd'hui", color: '#c07c2a' },
          ].map(({ value, label, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{ background: '#fff', border: '0.5px solid #ede8f5' }}
            >
              <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9b8cb0' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Today's categories */}
        {todayCategories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#9b8cb0' }}>
              Catégories du jour
            </p>
            <div className="flex gap-2 flex-wrap">
              {todayCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="text-xs px-3 py-1.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.emoji} {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Today's prayers */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: '#1a0f2e' }}>Prières d'aujourd'hui</h3>
          <span className="text-xs" style={{ color: '#9b8cb0' }}>{todaysPrayers.length} sujets</span>
        </div>

        {todaysPrayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🕊️</p>
            <p className="text-sm" style={{ color: '#6b5b8a' }}>Aucune prière planifiée pour aujourd'hui</p>
            <p className="text-xs mt-1" style={{ color: '#b0a4c0' }}>Ajoutez des prières ou configurez votre plan</p>
          </div>
        ) : (
          todaysPrayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}
