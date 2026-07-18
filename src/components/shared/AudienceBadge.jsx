import { Lock, Users, ShieldCheck } from 'lucide-react';
import { t } from '../../i18n';
import { audienceLabel, protectionLabel } from '../../lib/audience';

// Compact audience label — the same wording everywhere a prayer's audience is
// shown (form, saved confirmation, detail, share preview). Icon + text, never
// colour alone. AUDIENCE (who can read it) is the primary pill; PROTECTION
// (encrypted at rest) is a smaller, quieter secondary status beside it —
// encryption is never presented as a different audience.
export default function AudienceBadge({ audience, protection = null, lang, className = '' }) {
  if (!audience) return null;
  const { key, vars } = audienceLabel(audience);
  const shared = audience.kind === 'group' || audience.kind === 'groups' || audience.kind === 'fromGroup';
  const Icon = shared ? Users : Lock;
  const prot = protectionLabel(protection);
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
        style={shared
          ? { background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }
          : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
      >
        <Icon size={11} aria-hidden="true" /> {t(lang, key, vars)}
      </span>
      {prot && (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'transparent', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}
        >
          <ShieldCheck size={10} aria-hidden="true" /> {t(lang, prot.key)}
        </span>
      )}
    </span>
  );
}
