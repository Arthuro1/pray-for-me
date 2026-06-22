import { useState } from 'react';
import { Home, BookOpen, Calendar, Settings, PlusCircle } from 'lucide-react';

const tabs = [
  { id: 'home', label: "Aujourd'hui", icon: Home },
  { id: 'prayers', label: 'Prières', icon: BookOpen },
  { id: 'plan', label: 'Plan', icon: Calendar },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export default function Layout({ children, currentTab, onTabChange, onAddPrayer }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto relative shadow-xl">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🙏</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Pray For Me</h1>
            <p className="text-indigo-200 text-xs">Votre compagnon de prière</p>
          </div>
        </div>
        <button
          onClick={onAddPrayer}
          className="bg-white text-indigo-700 rounded-full p-2 shadow hover:bg-indigo-50 transition-colors"
          title="Ajouter une prière"
        >
          <PlusCircle size={22} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-200 flex z-10">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              currentTab === id
                ? 'text-indigo-700 font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={20} strokeWidth={currentTab === id ? 2.5 : 1.8} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
