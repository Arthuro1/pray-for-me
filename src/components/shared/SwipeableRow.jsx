import { useRef, useState } from 'react';

// Reveals quick-action buttons when the row is swiped left (touch only). A tap
// still passes through to the child's onClick; a horizontal swipe is captured
// so it never navigates. On desktop (no touch) it's an inert pass-through.
const ACTION_W = 74; // px revealed per action

export default function SwipeableRow({ actions = [], children }) {
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const swiped = useRef(false);
  const axis = useRef(null);

  if (actions.length === 0) return children;
  const reveal = actions.length * ACTION_W;
  const close = () => { setOpen(false); setDx(0); };

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiped.current = false;
    axis.current = null;
    setDragging(true);
  };
  const onTouchMove = (e) => {
    const mdx = e.touches[0].clientX - startX.current;
    const mdy = e.touches[0].clientY - startY.current;
    if (!axis.current) {
      if (Math.abs(mdx) < 6 && Math.abs(mdy) < 6) return;
      axis.current = Math.abs(mdx) > Math.abs(mdy) ? 'h' : 'v';
    }
    if (axis.current !== 'h') return; // vertical → let the page scroll
    swiped.current = true;
    const next = Math.max(-reveal - 24, Math.min(0, (open ? -reveal : 0) + mdx));
    setDx(next);
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (axis.current !== 'h') return;
    const shouldOpen = dx < -reveal / 2;
    setOpen(shouldOpen);
    setDx(shouldOpen ? -reveal : 0);
  };
  // Swallow the click that follows a swipe, and let a tap close an open row.
  const onClickCapture = (e) => {
    if (swiped.current || open) {
      e.preventDefault();
      e.stopPropagation();
      if (open) close();
      swiped.current = false;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => { a.onClick(); close(); }}
              className="flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-white leading-tight text-center"
              style={{ width: ACTION_W, background: a.bg }}
            >
              <Icon size={17} />
              {a.label}
            </button>
          );
        })}
      </div>
      <div
        onClickCapture={onClickCapture}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform 0.2s ease', position: 'relative' }}
      >
        {children}
      </div>
    </div>
  );
}
