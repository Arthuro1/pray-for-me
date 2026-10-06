import { useState } from 'react';
import { Loader2, Users, EyeOff, X } from 'lucide-react';
import SharePreview from './SharePreview';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { track, EVENTS } from '../lib/analytics';
import { Checkbox, Modal, PrimaryButton, SecondaryButton } from './shared/Primitives';
import { containsSensitiveContactDetails, safetyText } from '../lib/communitySafety';

// Modal for sharing a PERSONAL prayer to one or more groups. Owns its own share
// selection (which groups, anonymous) so PrayerDetail doesn't have to. Mounted
// only while open, so useState seeds from the prayer's current shares on each open.
//
// Sharing writes an independent copy of the prayer content into each group,
// ENCRYPTED under that group's key (see communityStore.setPrayerShares). Group
// members decrypt it locally; Qetoret stores only ciphertext. So the honest,
// calm framing is simply: "the members of this group will be able to read this"
// — no scary "unencrypted" warning, because the copy is not plaintext.
export default function PrayerShareModal({ prayer, groups, sharedGroups, authorName, userId, setPrayerShares, lang, onClose }) {
  const [shareGroupIds, setShareGroupIds] = useState(() => new Set(sharedGroups.map((g) => g.groupId)));
  const [shareAnon, setShareAnon] = useState(() => sharedGroups.some((g) => g.isAnonymous));
  const [sharing, setSharing] = useState(false);
  const [sensitiveAcknowledged, setSensitiveAcknowledged] = useState(false);


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
    <Modal labelledBy="prayer-share-title" onClose={onClose} size="sm">
      <div className="q-dialog__header">
        <div className="min-w-0">
          <h2 id="prayer-share-title" className="q-dialog__title">{t(lang, 'shareWithGroup')}</h2>
          <p className="q-meta mt-1 truncate">{prayer.title}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Calm, honest explanation of what sharing means — always shown, so no
          prayer is ever shared without the user understanding who can read it. */}
      <p className="share-note">
        <Users size={16} aria-hidden="true" />
        <span>{t(lang, 'shareGroupInfo')}</span>
      </p>

      {addingNewGroups && hasSensitiveDetails && (
        <div className="share-note share-note--caution block">
          <p className="mb-1">{safetyText(lang, 'sensitive')}</p>
          <Checkbox
            id="prayer-share-acknowledge"
            checked={sensitiveAcknowledged}
            onChange={(event) => setSensitiveAcknowledged(event.target.checked)}
            label={safetyText(lang, 'acknowledge')}
          />
        </div>
      )}

      <ul className="share-groups max-h-60 overflow-y-auto">
        {groups.map((g) => (
          <li key={g.id}>
            <Checkbox id={`prayer-share-${g.id}`} checked={shareGroupIds.has(g.id)} onChange={() => toggleShareGroup(g.id)} label={g.name} />
          </li>
        ))}
      </ul>
      <Checkbox id="prayer-share-anonymous" checked={shareAnon} onChange={(e) => setShareAnon(e.target.checked)} label={t(lang, 'anonymous')} />
      {/* When anonymous, be explicit that hiding the name does NOT hide the
          request text from group members. */}
      {shareAnon && (
        <p className="q-field__hint mb-3 flex gap-1.5">
          <EyeOff size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> {t(lang, 'shareAnonNote')}
        </p>
      )}
      {/* Live preview of the attribution group members will see — updates as
          the anonymous toggle changes, so nothing is shared unseen. Below it,
          the audience is NAMED and the update-sync behaviour stated plainly. */}
      <div className="mt-4">
        <SharePreview authorName={authorName} isAnonymous={shareAnon} title={prayer.title} lang={lang} />
        {shareGroupIds.size > 0 && (
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--q-text-secondary)' }}>
            {t(lang, 'sharePreviewAudience', {
              names: groups.filter((g) => shareGroupIds.has(g.id)).map((g) => g.name).join(', '),
            })}
          </p>
        )}
        {shareGroupIds.size > 0 && (
          <p className="q-meta mt-1">{t(lang, 'sharePreviewSync')}</p>
        )}
      </div>
      <div className="q-dialog__actions">
        <SecondaryButton onClick={onClose}>{t(lang, 'cancel')}</SecondaryButton>
        <PrimaryButton onClick={handleSave} disabled={sharing || (addingNewGroups && hasSensitiveDetails && !sensitiveAcknowledged)}>
          {sharing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : t(lang, 'save')}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
