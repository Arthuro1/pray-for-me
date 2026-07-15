// Lightweight skeleton placeholders shown while content loads, to avoid the
// layout jump and "flash of spinner" of a bare loader.

function Bar({ w = '100%', h = 12, className = '' }) {
  return <div className={`rounded ${className}`} style={{ width: w, height: h, background: 'var(--input-bg)' }} />;
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl animate-pulse" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <Bar w="40%" h={10} className="mb-3" />
      <Bar w="75%" h={14} className="mb-2" />
      <Bar w="55%" h={12} />
    </div>
  );
}

export default function PrayerListSkeleton({ count = 4 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
