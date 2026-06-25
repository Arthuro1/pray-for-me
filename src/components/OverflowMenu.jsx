import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';

// A reusable "⋮" overflow menu. Pass `items` as
//   [{ key, icon, label, onClick, danger?, hidden? }]
// Hidden items are dropped; a divider is inserted before the first `danger` item
// so destructive actions sit apart. Labelled rows (icon + text) are far more
// discoverable on touch than icon-only buttons with tooltips.
function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--input-bg)]"
      style={{ color: danger ? '#e53e3e' : 'var(--text-1)' }}
    >
      <Icon size={15} style={{ color: danger ? '#e53e3e' : 'var(--text-3)' }} /> {label}
    </button>
  );
}

export default function OverflowMenu({ lang, items = [], ariaLabel, triggerClassName, triggerStyle, iconColor = 'currentColor', align = 'right' }) {
  const [open, setOpen] = useState(false);
  useEscapeKey(open ? () => setOpen(false) : null);

  const visible = items.filter((it) => it && !it.hidden);
  if (visible.length === 0) return null;
  const firstDanger = visible.findIndex((it) => it.danger);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel || t(lang, 'options')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName || 'flex items-center justify-center w-9 h-9 rounded-full'}
        style={triggerStyle}
      >
        <MoreVertical size={18} style={{ color: iconColor }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1 z-50 rounded-xl overflow-hidden py-1 min-w-[190px]`}
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
          >
            {visible.map((it, i) => (
              <div key={it.key}>
                {it.danger && i === firstDanger && i > 0 && (
                  <div style={{ borderTop: '0.5px solid var(--border)', margin: '4px 0' }} />
                )}
                <MenuItem icon={it.icon} label={it.label} danger={it.danger} onClick={() => { setOpen(false); it.onClick(); }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
