import { User } from 'lucide-react';

// Deterministic, pleasant palette derived from the name so each person keeps a
// stable colour without storing anything.
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#0ea5e9'];

function colorFor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Avatar({ name = '?', size = 32, anonymous = false }) {
  const dim = { width: size, height: size };
  if (anonymous) {
    return (
      <div className="rounded-full flex items-center justify-center shrink-0"
        style={{ ...dim, background: 'var(--input-bg)', color: 'var(--text-3)' }}>
        <User size={size * 0.55} />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
      style={{ ...dim, background: colorFor(name), fontSize: size * 0.4 }}>
      {initials(name)}
    </div>
  );
}
