import { Send, X, ShieldCheck } from 'lucide-react';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import usePrayerStore from '../store/prayerStore';
import { redactMany } from '../lib/aiRedaction';
import Switch from './shared/Switch';

// Shows the EXACT text that will be sent to the AI before the first AI request
// for a prayer, so nothing leaves the device unseen. The provider (self-hosted or
// Anthropic) is chosen server-side, so the copy stays provider-neutral. Enforces
// the minimum-data default (title always; description and latest update each
// opt-in). The preview is post-redaction — it
// renders precisely what will be transmitted (sensitive tokens already replaced
// by placeholders). Each field is labelled separately so "Description" never
// shows the title or an update by mistake.
export default function AiOutgoingPreview({ lang = 'en', title, description = '', update = '', onSend, onCancel }) {
  useEscapeKey(onCancel);
  const trapRef = useFocusTrap(true);
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
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" className="editorial-dialog w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{t(lang, 'aiPreviewTitle')}</h3>
          </div>
          <button className="phase-icon-button" onClick={onCancel} aria-label={t(lang, 'close')}><X size={18} /></button>
        </div>

        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiPreviewBody')}</p>

        <div className="rounded-xl p-3 mb-4 space-y-2" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiPreviewFieldTitle')}</p>
            <p className="text-sm break-words" style={{ color: 'var(--text-1)' }}>{outTitle}</p>
          </div>
          {sendDescription && hasDescription && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiPreviewFieldDescription')}</p>
              <p className="text-sm break-words whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{outDescription}</p>
            </div>
          )}
          {sendUpdate && hasUpdate && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiPreviewFieldUpdate')}</p>
              <p className="text-sm break-words whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{outUpdate}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          {hasDescription && (
            <div className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{includeDescriptionLabel}</span>
              <Switch checked={sendDescription} onChange={(v) => updateSettings({ aiSendDescription: v })} label={includeDescriptionLabel} />
            </div>
          )}
          {hasUpdate && (
            <div className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{includeUpdateLabel}</span>
              <Switch checked={sendUpdate} onChange={(v) => updateSettings({ aiSendUpdate: v })} label={includeUpdateLabel} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
          >
            {t(lang, 'cancel')}
          </button>
          <button
            onClick={onSend}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-1.5"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Send size={14} /> {t(lang, 'aiPreviewSend')}
          </button>
        </div>
      </div>
    </div>
  );
}
