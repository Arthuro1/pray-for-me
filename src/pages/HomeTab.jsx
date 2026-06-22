import usePrayerStore from '../store/prayerStore';
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
];

export default function HomeTab({ onEdit }) {
  const { getTodaysPrayers, categories, prayers } = usePrayerStore();
  const todaysPrayers = getTodaysPrayers();

  const today = new Date();
  const dayIndex = today.getDay();
  const todayCategories = categories.filter((c) => c.weekDays && c.weekDays.includes(dayIndex));
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const activeCount = prayers.filter((p) => p.status === 'active').length;


  const verse = VERSES[dayIndex % VERSES.length];

  return (
    <div className="p-4">
      {/* Date & greeting */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 uppercase tracking-widest">{DAY_NAMES[dayIndex]}</p>
        <h2 className="text-xl font-bold text-slate-800">
          {format(today, "d MMMM yyyy", { locale: fr })}
        </h2>
      </div>

      {/* Verse of the day */}
      <div className="bg-indigo-700 text-white rounded-2xl p-4 mb-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 text-8xl opacity-10 leading-none">✝</div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-1">Verset du jour</p>
        <p className="text-sm italic leading-relaxed">"{verse.text}"</p>
        <p className="text-xs text-indigo-300 mt-1 text-right">— {verse.ref}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{activeCount}</p>
          <p className="text-xs text-slate-400">Actives</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-500">{answeredCount}</p>
          <p className="text-xs text-slate-400">Exaucées</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-500">{todaysPrayers.length}</p>
          <p className="text-xs text-slate-400">Aujourd'hui</p>
        </div>
      </div>

      {/* Today's categories */}
      {todayCategories.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Catégories du jour</p>
          <div className="flex gap-2 flex-wrap">
            {todayCategories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs px-3 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: cat.color }}
              >
                {cat.emoji} {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today's prayers */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-slate-700">Prières d'aujourd'hui</h3>
        <span className="text-xs text-slate-400">{todaysPrayers.length} sujets</span>
      </div>

      {todaysPrayers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">🕊️</p>
          <p className="text-slate-500 text-sm">Aucune prière planifiée pour aujourd'hui</p>
          <p className="text-slate-400 text-xs mt-1">Ajoutez des prières ou configurez votre plan hebdomadaire</p>
        </div>
      ) : (
        <div>
          {todaysPrayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
