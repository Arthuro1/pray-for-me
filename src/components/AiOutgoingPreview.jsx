import { Send, X } from 'lucide-react';
import { t } from '../i18n';
import usePrayerStore from '../store/prayerStore';
import { redactMany } from '../lib/aiRedaction';
import Switch from './shared/Switch';
import { Modal, PrimaryButton, SecondaryButton } from './shared/Primitives';

// Shows the EXACT text that will be sent to the AI before the first AI request
// for a prayer, so nothing leaves the device unseen. The provider (self-hosted or
// Anthropic) is chosen server-side, so the copy stays provider-neutral. Enforces
// the minimum-data default (title always; description and latest update each
// opt-in). The preview is post-redaction — it
// renders precisely what will be transmitted (sensitive tokens already replaced
// by placeholders). Each field is labelled separately so "Description" never
// shows the title or an update by mistake.
export default function AiOutgoingPreview({ lang = 'en', title, description = '', update = '', onSend, onCancel }) {
  const settings = usePrayerStore((s) => s.settings);
  const updateSettings = usePrayerStore((s) => s.updateSettings);

  const sendDescription = !!settings.aiSendDescription;
  const sendUpdate = !!settings.aiSendUpdate;
  const hasDescription = !!(description && description.trim());
  const hasUpdate = !!(update && update.trim());

  // Exactly what will be transmitted (title always; description and update only if
  // opted in), after sensitive-token redaction.
  const { texts } = redactMany(
    [title, sendDescription ? description : '', sendUpdate ? update : ''],
  );
  const outTitle = texts[0];
  const outDescription = texts[1];
  const outUpdate = texts[2];

  const includeDescriptionLabel = t(lang, 'aiPreviewIncludeDescription');
  const includeUpdateLabel = t(lang, 'aiPreviewIncludeUpdate');

  return (
    <Modal label={t(lang, 'aiPreviewTitle')} onClose={onCancel} size="sm">
      <div className="q-dialog__header">
        <div className="min-w-0">
          <h2 className="q-dialog__title">{t(lang, 'aiPreviewTitle')}</h2>
          <p className="q-meta mt-2">{t(lang, 'aiPreviewBody')}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Exactly what leaves the device, redacted, before anything is sent. */}
      <dl className="ai-outgoing">
        <div>
          <dt className="section-label">{t(lang, 'aiPreviewFieldTitle')}</dt>
          <dd className="ai-outgoing__value">{outTitle}</dd>
        </div>
        {sendDescription && hasDescription && (
          <div>
            <dt className="section-label">{t(lang, 'aiPreviewFieldDescription')}</dt>
            <dd className="ai-outgoing__value ai-outgoing__value--long">{outDescription}</dd>
          </div>
        )}
        {sendUpdate && hasUpdate && (
          <div>
            <dt className="section-label">{t(lang, 'aiPreviewFieldUpdate')}</dt>
            <dd className="ai-outgoing__value ai-outgoing__value--long">{outUpdate}</dd>
          </div>
        )}
      </dl>

      {hasDescription && (
        <div className="settings-row">
          <div className="settings-row__main">
            <p className="settings-row__label">{includeDescriptionLabel}</p>
            <Switch checked={sendDescription} onChange={(v) => updateSettings({ aiSendDescription: v })} label={includeDescriptionLabel} />
          </div>
        </div>
      )}
      {hasUpdate && (
        <div className="settings-row">
          <div className="settings-row__main">
            <p className="settings-row__label">{includeUpdateLabel}</p>
            <Switch checked={sendUpdate} onChange={(v) => updateSettings({ aiSendUpdate: v })} label={includeUpdateLabel} />
          </div>
        </div>
      )}

      <div className="q-dialog__actions">
        <SecondaryButton onClick={onCancel}>{t(lang, 'cancel')}</SecondaryButton>
        <PrimaryButton icon={Send} iconSize={16} onClick={onSend}>{t(lang, 'aiPreviewSend')}</PrimaryButton>
      </div>
    </Modal>
  );
}
