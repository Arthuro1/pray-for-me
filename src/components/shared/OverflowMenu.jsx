import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { t } from '../../i18n';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// A reusable "⋮" overflow menu. Pass `items` as
//   [{ key, icon, label, onClick, danger?, hidden? }]
// Hidden items are dropped; a divider is inserted before the first `danger` item
// so destructive actions sit apart. Labelled rows (icon + text) are far more
// discoverable on touch than icon-only buttons with tooltips.
//
// The dropdown is rendered through a portal with `position: fixed`, anchored to
// the trigger's on-screen rect, so it is never clipped by a scrollable/overflow
// ancestor (e.g. a modal's `max-h … overflow-y-auto` member list) — the reason
// the last row's actions used to be cut off. It flips above the trigger when
// there isn't room below.
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

// `triggerRef` (optional) also receives the trigger button, so a host that
// opened a disclosure from one of these items can hand focus back to it.
export default function OverflowMenu({ lang, items = [], ariaLabel, triggerClassName, triggerStyle, iconColor = 'currentColor', align = 'right', triggerRef: externalTriggerRef }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const setTrigger = (node) => {
    triggerRef.current = node;
    if (externalTriggerRef) externalTriggerRef.current = node;
  };
  const menuRef = useRef(null);
  useEscapeKey(open ? () => setOpen(false) : null);

  // Measure the trigger + menu and place the fixed-position dropdown, flipping
  // above the trigger when the menu wouldn't fit below.
  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const r = trigger.getBoundingClientRect();
    const menuH = menu.offsetHeight;
    const menuW = menu.offsetWidth;
    const margin = 4;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < menuH + margin && r.top > spaceBelow;
    const top = openUp ? Math.max(margin, r.top - menuH - margin) : r.bottom + margin;
    let left = align === 'right' ? r.right - menuW : r.left;
    left = Math.min(Math.max(margin, left), window.innerWidth - menuW - margin);
    setCoords({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) { setCoords(null); return undefined; }
    place();
    const onScroll = () => setOpen(false);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  const visible = items.filter((it) => it && !it.hidden);
  if (visible.length === 0) return null;
  const firstDanger = visible.findIndex((it) => it.danger);

  return (
    <>
      <button
        ref={setTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel || t(lang, 'options')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName || 'flex items-center justify-center w-11 h-11 rounded-full focus-visible:ring-2'}
        style={triggerStyle}
      >
        <MoreVertical size={18} style={{ color: iconColor }} />
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 60 }} onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            role="menu"
            className="fixed rounded-xl overflow-hidden py-1 min-w-[190px]"
            style={{
              top: coords ? coords.top : -9999,
              left: coords ? coords.left : -9999,
              // Never let a long localized label make the menu wider than the
              // viewport — otherwise the horizontal clamp in place() can't keep
              // its right edge on-screen at 320px. (2 × the 4px place() margin.)
              maxWidth: 'calc(100vw - 8px)',
              visibility: coords ? 'visible' : 'hidden',
              zIndex: 61,
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
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
        </>,
        document.body,
      )}
    </>
  );
}
