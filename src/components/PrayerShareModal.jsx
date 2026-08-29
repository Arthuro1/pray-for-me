import { useState } from 'react';
import { Loader2, Users, EyeOff } from 'lucide-react';
import SharePreview from './SharePreview';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { track, EVENTS } from '../lib/analytics';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { containsSensitiveContactDetails, safetyText } from '../lib/communitySafety';

// Modal for sharing a PERSONAL prayer to one or more groups. Owns its own share
// selection (which groups, anonymous) so PrayerDetail doesn't have to. Mounted
// only while open, so useState seeds from the prayer's current shares on each open.
//
// Sharing writes an independent copy of the prayer content into each group,
// ENCRYPTED under that group's key (see communityStore.setPrayerShares). Group
// members decrypt it locally; Praystead stores only ciphertext. So the honest,
// calm framing is simply: "the members of this group will be able to read this"
// — no scary "unencrypted" warning, because the copy is not plaintext.
export default function PrayerShareModal({ prayer, groups, sharedGroups, authorName, userId, setPrayerShares, lang, onClose }) {
  const [shareGroupIds, setShareGroupIds] = useState(() => new Set(sharedGroups.map((g) => g.groupId)));
  const [shareAnon, setShareAnon] = useState(() => sharedGroups.some((g) => g.isAnonymous));
  const [sharing, setSharing] = useState(false);
  const [sensitiveAcknowledged, setSensitiveAcknowledged] = useState(false);

  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);

  const alreadySharedIds = new Set(sharedGroups.map((g) => g.groupId));
  const addingNewGroups = [...shareGroupIds].some((id) => !alreadySharedIds.has(id));
  const hasSensitiveDetails = containsSensitiveContactDetails([prayer.title, prayer.description, prayer.testimony]);

  const toggleShareGroup = (groupId) => {
    setShareGroupIds((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const handleSave = async () => {
    if (sharing || (addingNewGroups && hasSensitiveDetails && !sensitiveAcknowledged)) return;
    const isNewShare = addingNewGroups; // capture before the modal unmounts
    setSharing(true);
    const res = await setPrayerShares({ prayer, groupIds: [...shareGroupIds], userId, authorName, isAnonymous: shareAnon });
    setSharing(false);
    if (res?.error) { toast.error(t(lang, 'errorGeneric')); return; }
    // Content-free: only that a prayer was shared to a group (not what it says).
    // Skip when the save only removed groups so telemetry reflects real shares.
    if (isNewShare) track(EVENTS.PRAYER_SHARED, { channel: 'group' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t(lang, 'shareWithGroup')} className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>{t(lang, 'shareWithGroup')}</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{prayer.title}</p>

        {/* Calm, honest explanation of what sharing means — always shown, so no
            prayer is ever shared without the user understanding who can read it. */}
        <div className="rounded-xl p-3 mb-4 flex gap-2.5" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <Users size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'shareGroupInfo')}</p>
        </div>

        {addingNewGroups && hasSensitiveDetails && (
          <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--danger-soft)', border: '0.5px solid var(--danger)' }}>
            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-2)' }}>{safetyText(lang, 'sensitive')}</p>
            <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-2)' }}>
              <input type="checkbox" checked={sensitiveAcknowledged} onChange={(event) => setSensitiveAcknowledged(event.target.checked)} className="rounded mt-0.5" />
              <span>{safetyText(lang, 'acknowledge')}</span>
            </label>
          </div>
        )}

        <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
          {groups.map((g) => {
            const checked = shareGroupIds.has(g.id);
            return (
              <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                <input type="checkbox" checked={checked} onChange={() => toggleShareGroup(g.id)} className="rounded" />
                <span className="text-sm" style={{ color: 'var(--text-1)' }}>{g.name}</span>
              </label>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer" style={{ color: 'var(--text-2)' }}>
          <input type="checkbox" checked={shareAnon} onChange={(e) => setShareAnon(e.target.checked)} className="rounded" />
          {t(lang, 'anonymous')}
        </label>
        {/* When anonymous, be explicit that hiding the name does NOT hide the
            request text from group members. */}
        {shareAnon && (
          <p className="text-xs leading-relaxed mb-3 flex gap-1.5" style={{ color: 'var(--text-3)' }}>
            <EyeOff size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {t(lang, 'shareAnonNote')}
          </p>
        )}
        {/* Live preview of the attribution group members will see — updates as
            the anonymous toggle changes, so nothing is shared unseen. Below it,
            the audience is NAMED and the update-sync behaviour stated plainly. */}
        <div className="mb-4">
          <SharePreview authorName={authorName} isAnonymous={shareAnon} title={prayer.title} lang={lang} />
          {shareGroupIds.size > 0 && (
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-2)' }}>
              {t(lang, 'sharePreviewAudience', {
                names: groups.filter((g) => shareGroupIds.has(g.id)).map((g) => g.name).join(', '),
              })}
            </p>
          )}
          {shareGroupIds.size > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'sharePreviewSync')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}>
            {t(lang, 'cancel')}
          </button>
          <button onClick={handleSave} disabled={sharing || (addingNewGroups && hasSensitiveDetails && !sensitiveAcknowledged)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent)' }}>
            {sharing ? <Loader2 size={14} className="animate-spin mx-auto" /> : t(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
}
