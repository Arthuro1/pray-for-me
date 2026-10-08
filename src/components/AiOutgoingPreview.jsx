import { useId } from 'react';
import { Send, ShieldCheck, X } from 'lucide-react';
import { t } from '../i18n';
import usePrayerStore from '../store/prayerStore';
import { preparePrayerAiInput, selectPrayerAiInput } from '../lib/aiPrayerInput';
import Switch from './shared/Switch';
import { Modal, PrimaryButton, SecondaryButton } from './shared/Primitives';
import './AiOutgoingPreview.css';

// Review each explicit prayer AI request. Send captures the selected fields so
// settings changed during an async request cannot alter the approved text.
export default function AiOutgoingPreview({ lang = 'en', title, description = '', update = '', onSend, onCancel }) {
  const settings = usePrayerStore((s) => s.settings);
  const updateSettings = usePrayerStore((s) => s.updateSettings);
  const headingId = useId();
  const sendDescription = !!settings.aiSendDescription;
  const sendUpdate = !!settings.aiSendUpdate;
  const hasDescription = typeof description === 'string' && !!description.trim();
  const hasUpdate = typeof update === 'string' && !!update.trim();
  const selectedInput = selectPrayerAiInput({ title, description, update }, settings);
  const outgoing = preparePrayerAiInput(selectedInput);
  const includeDescriptionLabel = t(lang, 'aiPreviewIncludeDescription');
  const includeUpdateLabel = t(lang, 'aiPreviewIncludeUpdate');

  return (
    <Modal labelledBy={headingId} onClose={onCancel} className="ai-preview" size="lg">
      <div className="ai-preview__content" lang={lang} dir={lang === 'ar' || lang === 'fa' ? 'rtl' : 'ltr'}>
        <div className="q-dialog__header ai-preview__header">
          <span className="ai-preview__emblem" aria-hidden="true"><ShieldCheck size={23} strokeWidth={1.65} /></span>
          <h2 id={headingId} className="q-dialog__title">{t(lang, 'aiPreviewTitle')}</h2>
          <button type="button" onClick={onCancel} aria-label={t(lang, 'close')} className="icon-button pressable ai-preview__close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ai-preview__body" role="region" aria-label={t(lang, 'aiPreviewTitle')} tabIndex={0}>
          <p className="ai-preview__intro">{t(lang, 'aiPreviewBody')}</p>
          {(hasDescription || hasUpdate) && (
            <div className="ai-preview__options">
              {hasDescription && (
                <div className="ai-preview__option" data-included={sendDescription}>
                  <p>{includeDescriptionLabel}</p>
                  <Switch checked={sendDescription} onChange={(v) => updateSettings({ aiSendDescription: v })} label={includeDescriptionLabel} />
                </div>
              )}
              {hasUpdate && (
                <div className="ai-preview__option" data-included={sendUpdate}>
                  <p>{includeUpdateLabel}</p>
                  <Switch checked={sendUpdate} onChange={(v) => updateSettings({ aiSendUpdate: v })} label={includeUpdateLabel} />
                </div>
              )}
            </div>
          )}

          {outgoing.shortened && <p className="ai-preview__notice" role="status">{t(lang, 'aiPreviewShortened')}</p>}

          {/* Literal outgoing text preserves formatting without interpreting
              Markdown or HTML, which could conceal part of the sent input. */}
          <dl className="ai-preview__fields">
            <div className="ai-preview__field ai-preview__field--title">
              <dt className="section-label">{t(lang, 'aiPreviewFieldTitle')}</dt>
              <dd>{outgoing.title}</dd>
            </div>
            {outgoing.description && (
              <div className="ai-preview__field">
                <dt className="section-label">{t(lang, 'aiPreviewFieldDescription')}</dt>
                <dd>{outgoing.description}</dd>
              </div>
            )}
            {outgoing.update && (
              <div className="ai-preview__field">
                <dt className="section-label">{t(lang, 'aiPreviewFieldUpdate')}</dt>
                <dd>{outgoing.update}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="q-dialog__actions ai-preview__actions">
          <SecondaryButton onClick={onCancel}>{t(lang, 'cancel')}</SecondaryButton>
          <PrimaryButton icon={Send} iconSize={16} onClick={() => onSend(selectedInput)}>{t(lang, 'aiPreviewSend')}</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
