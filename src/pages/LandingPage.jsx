import { useState } from 'react';
import { BookOpen, Calendar, Sparkles, CheckCircle, Globe, Lock, ChevronDown, ChevronUp } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    color: '#7c5cfc',
    bg: '#f0ebff',
    title: 'Prayer journal',
    desc: 'Log every prayer request — for yourself or for others. Add details, follow up with updates, and never forget who you said you\'d pray for.',
  },
  {
    icon: Calendar,
    color: '#059669',
    bg: '#e8f5ed',
    title: 'Weekly prayer plan',
    desc: 'Assign categories to days of the week. Monday for family, Tuesday for health… each day you see exactly what to pray for.',
  },
  {
    icon: Sparkles,
    color: '#d97706',
    bg: '#fef3c7',
    title: 'AI-powered prayer points',
    desc: 'Claude AI suggests relevant Bible verses and prayer angles for each request — with full verse text and direct links to Bible.com.',
  },
  {
    icon: CheckCircle,
    color: '#0891b2',
    bg: '#e0f2fe',
    title: 'Answered prayer gallery',
    desc: 'Mark prayers as answered and record your testimony. Watch God\'s faithfulness accumulate over time in your personal gallery.',
  },
  {
    icon: Globe,
    color: '#db2777',
    bg: '#fce7f3',
    title: '4 languages',
    desc: 'Full UI in French, English, German, and Portuguese. Switch anytime — every label, tooltip, and AI suggestion follows your choice.',
  },
  {
    icon: Lock,
    color: '#6d28d9',
    bg: '#ede9fe',
    title: 'Private & secure',
    desc: 'Your prayers never leave your account. Row-level security in Supabase means only you can see your data — ever.',
  },
];

const STEPS = [
  { emoji: '✍️', title: 'Add a prayer', desc: 'Type a request, assign a category, and optionally note who it\'s for.' },
  { emoji: '📅', title: 'Set your plan', desc: 'Assign categories to days. Open the app each morning and see today\'s list.' },
  { emoji: '🤖', title: 'Let AI inspire you', desc: 'Tap the AI button to receive Bible verses and prayer angles tailored to each request.' },
  { emoji: '🎉', title: 'Record answers', desc: 'When God answers, mark it. Add your testimony. Revisit it whenever you need faith.' },
];

const FAQS = [
  {
    q: 'Is my data private?',
    a: 'Yes. Every prayer is stored in your own Supabase account with Row Level Security — no one else can read your data, not even us.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes — a free account keeps your prayers synced across devices. Sign up with Google in one tap or use email/password.',
  },
  {
    q: 'How does the AI work?',
    a: 'We send the title and context of your prayer to Claude (Anthropic\'s AI) which returns relevant Bible verses and prayer points. Your prayer content is not stored by Anthropic.',
  },
  {
    q: 'What languages are supported?',
    a: 'The full interface works in French, English, German, and Portuguese. The AI generates suggestions in your selected language too.',
  },
  {
    q: 'Is it free?',
    a: 'Yes, completely free to use. The app is open source and self-hostable.',
  },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-medium text-white pr-4">{q}</p>
        {open ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.5)', shrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />}
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen" style={{ background: '#0d0a1e', color: '#fff' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-lg tracking-tight">Pray For Me</span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.15)' }}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="relative text-center px-6 pt-16 pb-24 max-w-3xl mx-auto">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,92,252,0.35) 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', border: '0.5px solid rgba(124,92,252,0.3)' }}
          >
            <Sparkles size={11} /> AI-powered prayer companion
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
            Never forget a prayer.<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Track every answer.
            </span>
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            A private prayer journal with a weekly plan, AI-suggested Bible verses, and a gallery of God's answered prayers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', boxShadow: '0 0 30px rgba(124,92,252,0.4)' }}
            >
              Get started — it's free
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.12)' }}
            >
              See how it works
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            "The prayer of a righteous person is powerful and effective." — James 5:16
          </p>
        </div>
      </section>

      {/* App preview strip */}
      <section className="px-6 max-w-4xl mx-auto mb-24">
        <div
          className="rounded-3xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { emoji: '📋', label: 'Active prayers', value: '12', sub: 'being prayed for' },
            { emoji: '✅', label: 'Answered prayers', value: '34', sub: 'testimonies recorded' },
            { emoji: '📅', label: 'Days covered', value: '7/7', sub: 'weekly plan set' },
          ].map(({ emoji, label, value, sub }) => (
            <div key={label} className="text-center py-2">
              <div className="text-3xl mb-2">{emoji}</div>
              <div className="text-3xl font-bold mb-0.5" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
              <div className="text-xs font-medium text-white mb-0.5">{label}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything your prayer life needs</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Built for Christians who want to pray with intention and track God's faithfulness.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: color + '22' }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5 text-white">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 max-w-3xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How it works</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>From your first prayer to a full gallery of answered ones — in four simple steps.</p>
        </div>
        <div className="space-y-4">
          {STEPS.map(({ emoji, title, desc }, i) => (
            <div
              key={title}
              className="flex items-start gap-5 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'rgba(124,92,252,0.15)', border: '0.5px solid rgba(124,92,252,0.2)' }}
              >
                {emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,92,252,0.2)', color: '#a78bfa' }}>Step {i + 1}</span>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI feature callout */}
      <section className="px-6 max-w-5xl mx-auto mb-24">
        <div
          className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8"
          style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(167,139,250,0.08))', border: '0.5px solid rgba(124,92,252,0.25)' }}
        >
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(124,92,252,0.2)', color: '#a78bfa' }}
            >
              <Sparkles size={11} /> Powered by Claude AI
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Pray deeper with AI guidance</h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Stuck on how to pray for a situation? Tap the AI button and get 3–4 prayer angles, each with 2 relevant Bible verses and their full text — ready to open directly in Bible.com.
            </p>
            <button
              onClick={onGetStarted}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
            >
              Try it now
            </button>
          </div>
          <div
            className="w-full md:w-64 rounded-2xl p-4 shrink-0"
            style={{ background: 'rgba(0,0,0,0.3)', border: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>AI Suggestion</p>
            {[
              { point: 'Peace that surpasses understanding', verse: 'Philippians 4:7' },
              { point: 'Trust in God\'s timing', verse: 'Isaiah 40:31' },
            ].map(({ point, verse }) => (
              <div key={verse} className="rounded-xl p-3 mb-2" style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #f5c842' }}>
                <p className="text-xs text-white mb-1">{point}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: '#f5c842' }}>
                  <BookOpen size={9} /> {verse}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 max-w-2xl mx-auto mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Questions</h2>
        </div>
        <div className="space-y-2">
          {FAQS.map(faq => <FAQ key={faq.q} {...faq} />)}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-20 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(124,92,252,0.25) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-xl mx-auto">
          <img src="/logo.svg" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start your prayer journal today</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            Free, private, and available in 4 languages. Sign up in seconds with Google.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)', boxShadow: '0 0 40px rgba(124,92,252,0.45)' }}
          >
            Get started — it's free
          </button>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            "Pray without ceasing." — 1 Thessalonians 5:17
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t max-w-5xl mx-auto" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="w-6 h-6 rounded-md" />
            <span className="text-sm font-medium text-white">Pray For Me</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Built with faith · Open source · MIT License
          </p>
          <button
            onClick={onGetStarted}
            className="text-xs font-medium px-4 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(255,255,255,0.1)' }}
          >
            Sign in →
          </button>
        </div>
      </footer>

    </div>
  );
}
