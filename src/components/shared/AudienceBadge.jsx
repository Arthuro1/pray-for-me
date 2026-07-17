import { Lock, Users } from 'lucide-react';
import { t } from '../../i18n';
import { audienceLabel } from '../../lib/audience';

// Compact audience label — the same wording everywhere a prayer's audience is
// shown (form, saved confirmation, detail, share preview). Icon + text, never
// colour alone.
export default function AudienceBadge({ audience, lang, className = '' }) {
  if (!audience) return null;
  const { key, vars } = audienceLabel(audience);
  const shared = audience.kind === 'group' || audience.kind === 'groups' || audience.kind === 'fromGroup';
  const Icon = shared ? Users : Lock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${className}`}
      style={shared
        ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }
        : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
    >
      <Icon size={11} aria-hidden="true" /> {t(lang, key, vars)}
    </span>
  );
}
