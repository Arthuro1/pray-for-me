import { useState } from 'react';
import { Copy, Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Input, PrimaryButton, QuietButton } from './shared/Primitives';

const MIN_PASSPHRASE = 8;

// A passphrase field with a show/hide toggle. The placeholder doubles as the
// field's name for screen readers; the toggle says which field it reveals.
function PassField({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="q-input-wrap">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className="q-input--with-action"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={placeholder}
        aria-pressed={show}
        className="icon-button q-input-wrap__action"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}

// The one action of each step. While it works, a spinner sits beside the label.
function SubmitButton({ onClick, disabled, busy, children }) {
  return (
    <PrimaryButton onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} className="w-full">
      {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </PrimaryButton>
  );
}

const ErrorNote = ({ children }) => <p role="alert" className="q-notice q-notice--error">{children}</p>;

// Unified vault dialog. `initialMode`: 'setup' | 'unlock' | 'change'.
// onUnlocked fires once the vault becomes usable (created/unlocked/reset).
// `dismissable=false` turns it into a hard gate (no close button, no backdrop /
// Escape dismiss) — used to block the app until the vault is unlocked.
// `embedded=true` renders just the card (no fixed overlay/backdrop) so a host
// like VaultLockScreen can place it inside its own friendlier layout while still
// reusing the unlock + recovery-code logic here.
export default function VaultModal({ lang = 'fr', initialMode = 'unlock', onClose, onUnlocked, dismissable = true, embedded = false, userId }) {
  const { createVault, setUpRecovery, unlock, resetPassphrase, changePassphrase, rotateRecoveryCode, syncRecovery, unlocked } = useVaultStore();
  const [mode, setMode] = useState(initialMode); // setup | recovery | unlock | reset | change | rotate
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  // False when the wrapped record didn't reach the server: the code works here,
  // but no other device can use it until this one syncs (which it retries on the
  // next launch). Saying nothing would promise cross-device recovery we haven't got.
  const [codeSynced, setCodeSynced] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEscapeKey(dismissable ? onClose : () => {});
  // As an overlay modal, trap focus in the card; when embedded in a full-page
  // host (VaultLockScreen), don't — the host has its own controls (e.g. sign out)
  // that keyboard users must still be able to reach.
  const trapRef = useFocusTrap(!embedded);

  const done = (msgKey) => {
    if (msgKey) toast.success(t(lang, msgKey));
    onUnlocked?.();
    onClose?.();
  };

  const handleCreate = async () => {
    setError('');
    if (pass.length < MIN_PASSPHRASE) return setError(t(lang, 'vaultPassTooShort'));
    if (pass !== confirm) return setError(t(lang, 'vaultPassMismatch'));
    setBusy(true);
    // If a key is already in memory (the default auto-provisioned state), wrap
    // THAT key under the passphrase — never mint a new one, which would orphan
    // every prayer already encrypted under the current key. createVault is only
    // for the (rare) case where no key exists yet.
    try {
      const { code: rc, synced } = unlocked ? await setUpRecovery(pass) : await createVault(pass);
      if (!rc) return setError(t(lang, 'errorGeneric'));
      setRecoveryCode(rc);
      setCodeSynced(synced);
      setPass(''); setConfirm('');
      setMode('recovery');
    } catch {
      setError(t(lang, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    setError('');
    setBusy(true);
    try {
      const ok = await unlock(pass, userId);
      if (!ok) return setError(t(lang, 'vaultWrongPass'));
      setPass('');
      done('vaultUnlockedToast');
    } catch {
      setError(t(lang, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError('');
    if (pass.length < MIN_PASSPHRASE) return setError(t(lang, 'vaultPassTooShort'));
    setBusy(true);
    try {
      const ok = await resetPassphrase(code, pass, userId);
      if (!ok) return setError(t(lang, 'vaultWrongCode'));
      setPass(''); setCode('');
      if (useVaultStore.getState().recoverySync === 'pending') { setMode('sync'); return; }
      done('vaultResetDoneToast');
    } catch {
      setError(t(lang, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async () => {
    setError('');
    if (pass.length < MIN_PASSPHRASE) return setError(t(lang, 'vaultPassTooShort'));
    setBusy(true);
    try {
      const ok = await changePassphrase(confirm, pass, userId); // confirm holds the current passphrase
      if (!ok) return setError(t(lang, 'vaultWrongPass'));
      setPass(''); setConfirm('');
      if (useVaultStore.getState().recoverySync === 'pending') { setMode('sync'); return; }
      done('vaultChangedToast');
    } catch {
      setError(t(lang, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = async () => {
    setError('');
    setBusy(true);
    try {
      const { code: rc, synced } = await rotateRecoveryCode();
      if (!rc) return setError(t(lang, 'vaultWrongPass')); // locked or no vault
      setRecoveryCode(rc);
      setCodeSynced(synced);
      setMode('recovery');
    } catch {
      setError(t(lang, 'errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      toast.success(t(lang, 'vaultCodeCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the code is visible to copy manually */ }
  };

  const titleKey = {
    setup: 'vaultSetupTitle', recovery: 'vaultRecoveryTitle', unlock: 'vaultUnlockTitle',
    reset: 'vaultResetTitle', change: 'vaultChangeTitle', rotate: 'vaultRotateTitle', sync: 'protectionRecovery',
  }[mode];

  const card = (
    <div
      ref={trapRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, titleKey)}
      className={embedded ? 'vault-card vault-card--embedded' : 'q-dialog vault-card'}
      onClick={(e) => e.stopPropagation()}
    >
        {/* Embedded in a gate that already names and explains itself, the card
            starts straight at the field. */}
        {!embedded && (
          <div className="q-dialog__header">
            <h2 className="q-dialog__title">{t(lang, titleKey)}</h2>
            {dismissable && <button type="button" className="icon-button pressable -me-2 -mt-2 shrink-0" onClick={onClose} aria-label={t(lang, 'close')}><X size={18} aria-hidden="true" /></button>}
          </div>
        )}

        {/* ─── Setup ─── */}
        {mode === 'setup' && (
          <div className="vault-card__step">
            <p className="vault-card__intro">{t(lang, 'vaultSetupIntro')}</p>
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultPassphrase')} autoFocus />
            <PassField value={confirm} onChange={setConfirm} placeholder={t(lang, 'vaultConfirmPassphrase')} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <SubmitButton onClick={handleCreate} busy={busy} disabled={!pass || !confirm}>{t(lang, 'vaultCreate')}</SubmitButton>
          </div>
        )}

        {/* ─── Recovery code (shown once) ─── */}
        {mode === 'recovery' && (
          <div className="vault-card__step">
            <p className="vault-card__intro">{t(lang, 'vaultRecoveryIntro')}</p>
            <div className="vault-code">
              <code>{recoveryCode}</code>
              <button type="button" onClick={copyCode} aria-label={t(lang, 'vaultCopyCode')} className="icon-button pressable">
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              </button>
            </div>
            {!codeSynced && <>
              <ErrorNote>{t(lang, 'vaultCodeNotSynced')}</ErrorNote>
              <SubmitButton busy={busy} onClick={async () => {
                setBusy(true);
                try { setCodeSynced(await syncRecovery()); } finally { setBusy(false); }
              }}>{t(lang, 'retry')}</SubmitButton>
            </>}
            <SubmitButton onClick={() => done()}>{t(lang, 'vaultRecoverySaved')}</SubmitButton>
          </div>
        )}

        {mode === 'sync' && <div className="vault-card__step">
          <ErrorNote>{t(lang, 'protectionSyncPending')}</ErrorNote>
          <SubmitButton busy={busy} onClick={async () => {
            setBusy(true);
            try { if (await syncRecovery()) done(); } finally { setBusy(false); }
          }}>{t(lang, 'retry')}</SubmitButton>
        </div>}

        {/* ─── Unlock ─── */}
        {mode === 'unlock' && (
          <div className="vault-card__step">
            {!embedded && <p className="vault-card__intro">{t(lang, 'vaultUnlockIntro')}</p>}
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultPassphrase')} autoFocus />
            {error && <ErrorNote>{error}</ErrorNote>}
            <SubmitButton onClick={handleUnlock} busy={busy} disabled={!pass}>{t(lang, 'vaultUnlock')}</SubmitButton>
            <QuietButton onClick={() => { setError(''); setMode('reset'); }} className="w-full">
              {t(lang, 'vaultForgot')}
            </QuietButton>
          </div>
        )}

        {/* ─── Reset via recovery code ─── */}
        {mode === 'reset' && (
          <div className="vault-card__step">
            <p className="vault-card__intro">{t(lang, 'vaultResetIntro')}</p>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t(lang, 'vaultRecoveryCode')}
              aria-label={t(lang, 'vaultRecoveryCode')}
              autoFocus
              autoComplete="off"
              className="q-input--code"
            />
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultNewPassphrase')} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <SubmitButton onClick={handleReset} busy={busy} disabled={!code || !pass}>{t(lang, 'vaultReset')}</SubmitButton>
          </div>
        )}

        {/* ─── Change passphrase ─── */}
        {mode === 'change' && (
          <div className="vault-card__step">
            <PassField value={confirm} onChange={setConfirm} placeholder={t(lang, 'vaultCurrentPassphrase')} autoFocus />
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultNewPassphrase')} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <SubmitButton onClick={handleChange} busy={busy} disabled={!pass || !confirm}>{t(lang, 'vaultChangeSave')}</SubmitButton>
          </div>
        )}

        {/* ─── Rotate recovery code ─── */}
        {mode === 'rotate' && (
          <div className="vault-card__step">
            <p className="vault-card__intro">{t(lang, 'vaultRotateIntro')}</p>
            {error && <ErrorNote>{error}</ErrorNote>}
            <SubmitButton onClick={handleRotate} busy={busy}>{t(lang, 'vaultRotateGenerate')}</SubmitButton>
          </div>
        )}
      </div>
  );

  if (embedded) return card;

  return (
    <div className="dialog-backdrop fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" onClick={dismissable ? onClose : undefined}>
      {card}
    </div>
  );
}
