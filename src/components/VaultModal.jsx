import { useState } from 'react';
import { Lock, Shield, KeyRound, Copy, Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import useVaultStore from '../store/vaultStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';

const MIN_PASSPHRASE = 8;

const inputStyle = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };

// A password field with a show/hide toggle.
function PassField({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none"
        style={inputStyle}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
        style={{ color: 'var(--text-3)' }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function PrimaryButton({ onClick, disabled, busy, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
      style={{ background: 'var(--accent)' }}
    >
      {busy ? <Loader2 size={15} className="animate-spin mx-auto" /> : children}
    </button>
  );
}

// Unified vault dialog. `initialMode`: 'setup' | 'unlock' | 'change'.
// onUnlocked fires once the vault becomes usable (created/unlocked/reset).
// `dismissable=false` turns it into a hard gate (no close button, no backdrop /
// Escape dismiss) — used to block the app until the vault is unlocked.
// `embedded=true` renders just the card (no fixed overlay/backdrop) so a host
// like VaultLockScreen can place it inside its own friendlier layout while still
// reusing the unlock + recovery-code logic here.
export default function VaultModal({ lang = 'fr', initialMode = 'unlock', onClose, onUnlocked, dismissable = true, embedded = false }) {
  const { createVault, setUpRecovery, unlock, resetPassphrase, changePassphrase, rotateRecoveryCode, unlocked } = useVaultStore();
  const [mode, setMode] = useState(initialMode); // setup | recovery | unlock | reset | change | rotate
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
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
    const rc = unlocked ? await setUpRecovery(pass) : await createVault(pass);
    setBusy(false);
    if (!rc) return setError(t(lang, 'errorGeneric'));
    setRecoveryCode(rc);
    setPass(''); setConfirm('');
    setMode('recovery');
  };

  const handleUnlock = async () => {
    setError('');
    setBusy(true);
    const ok = await unlock(pass);
    setBusy(false);
    if (!ok) return setError(t(lang, 'vaultWrongPass'));
    setPass('');
    done('vaultUnlockedToast');
  };

  const handleReset = async () => {
    setError('');
    if (pass.length < MIN_PASSPHRASE) return setError(t(lang, 'vaultPassTooShort'));
    setBusy(true);
    const ok = await resetPassphrase(code, pass);
    setBusy(false);
    if (!ok) return setError(t(lang, 'vaultWrongCode'));
    setPass(''); setCode('');
    done('vaultResetDoneToast');
  };

  const handleChange = async () => {
    setError('');
    if (pass.length < MIN_PASSPHRASE) return setError(t(lang, 'vaultPassTooShort'));
    setBusy(true);
    const ok = await changePassphrase(confirm, pass); // confirm holds the current passphrase
    setBusy(false);
    if (!ok) return setError(t(lang, 'vaultWrongPass'));
    setPass(''); setConfirm('');
    done('vaultChangedToast');
  };

  const handleRotate = async () => {
    setError('');
    setBusy(true);
    const rc = await rotateRecoveryCode();
    setBusy(false);
    if (!rc) return setError(t(lang, 'vaultWrongPass')); // locked or no vault
    setRecoveryCode(rc);
    setMode('recovery');
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
    reset: 'vaultResetTitle', change: 'vaultChangeTitle', rotate: 'vaultRotateTitle',
  }[mode];
  const Icon = mode === 'unlock' ? Lock
    : mode === 'recovery' || mode === 'reset' || mode === 'change' || mode === 'rotate' ? KeyRound
      : Shield;

  const card = (
    <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t(lang, titleKey)} className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Icon size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{t(lang, titleKey)}</h3>
          </div>
          {dismissable && <button onClick={onClose} aria-label={t(lang, 'close')}><X size={18} style={{ color: 'var(--text-3)' }} /></button>}
        </div>

        {/* ─── Setup ─── */}
        {mode === 'setup' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'vaultSetupIntro')}</p>
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultPassphrase')} autoFocus />
            <PassField value={confirm} onChange={setConfirm} placeholder={t(lang, 'vaultConfirmPassphrase')} />
            {error && <p className="text-xs" style={{ color: '#e53e3e' }}>{error}</p>}
            <PrimaryButton onClick={handleCreate} busy={busy} disabled={!pass || !confirm}>{t(lang, 'vaultCreate')}</PrimaryButton>
          </div>
        )}

        {/* ─── Recovery code (shown once) ─── */}
        {mode === 'recovery' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'vaultRecoveryIntro')}</p>
            <div className="rounded-xl p-3 flex items-center justify-between gap-2" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--accent-border)' }}>
              <code className="text-sm font-mono tracking-wider break-all" style={{ color: 'var(--text-1)' }}>{recoveryCode}</code>
              <button onClick={copyCode} aria-label={t(lang, 'vaultCopyCode')} className="shrink-0 p-1.5 rounded-lg" style={{ color: 'var(--accent)' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <PrimaryButton onClick={() => done()}>{t(lang, 'vaultRecoverySaved')}</PrimaryButton>
          </div>
        )}

        {/* ─── Unlock ─── */}
        {mode === 'unlock' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'vaultUnlockIntro')}</p>
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultPassphrase')} autoFocus />
            {error && <p className="text-xs" style={{ color: '#e53e3e' }}>{error}</p>}
            <PrimaryButton onClick={handleUnlock} busy={busy} disabled={!pass}>{t(lang, 'vaultUnlock')}</PrimaryButton>
            <button onClick={() => { setError(''); setMode('reset'); }} className="w-full text-center text-xs" style={{ color: 'var(--accent)' }}>
              {t(lang, 'vaultForgot')}
            </button>
          </div>
        )}

        {/* ─── Reset via recovery code ─── */}
        {mode === 'reset' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'vaultResetIntro')}</p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t(lang, 'vaultRecoveryCode')}
              autoFocus
              autoComplete="off"
              className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
              style={inputStyle}
            />
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultNewPassphrase')} />
            {error && <p className="text-xs" style={{ color: '#e53e3e' }}>{error}</p>}
            <PrimaryButton onClick={handleReset} busy={busy} disabled={!code || !pass}>{t(lang, 'vaultReset')}</PrimaryButton>
          </div>
        )}

        {/* ─── Change passphrase ─── */}
        {mode === 'change' && (
          <div className="space-y-3">
            <PassField value={confirm} onChange={setConfirm} placeholder={t(lang, 'vaultCurrentPassphrase')} autoFocus />
            <PassField value={pass} onChange={setPass} placeholder={t(lang, 'vaultNewPassphrase')} />
            {error && <p className="text-xs" style={{ color: '#e53e3e' }}>{error}</p>}
            <PrimaryButton onClick={handleChange} busy={busy} disabled={!pass || !confirm}>{t(lang, 'vaultChangeSave')}</PrimaryButton>
          </div>
        )}

        {/* ─── Rotate recovery code ─── */}
        {mode === 'rotate' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(lang, 'vaultRotateIntro')}</p>
            {error && <p className="text-xs" style={{ color: '#e53e3e' }}>{error}</p>}
            <PrimaryButton onClick={handleRotate} busy={busy}>{t(lang, 'vaultRotateGenerate')}</PrimaryButton>
          </div>
        )}
      </div>
  );

  if (embedded) return card;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={dismissable ? onClose : undefined}>
      {card}
    </div>
  );
}
