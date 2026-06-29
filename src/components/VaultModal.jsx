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
export default function VaultModal({ lang = 'fr', initialMode = 'unlock', onClose, onUnlocked }) {
  const { createVault, unlock, resetPassphrase, changePassphrase } = useVaultStore();
  const [mode, setMode] = useState(initialMode); // setup | recovery | unlock | reset | change
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEscapeKey(onClose);
  const trapRef = useFocusTrap();

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
    const rc = await createVault(pass);
    setBusy(false);
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
    reset: 'vaultResetTitle', change: 'vaultChangeTitle',
  }[mode];
  const Icon = mode === 'unlock' ? Lock : mode === 'recovery' ? KeyRound : mode === 'reset' || mode === 'change' ? KeyRound : Shield;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div ref={trapRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t(lang, titleKey)} className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Icon size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{t(lang, titleKey)}</h3>
          </div>
          <button onClick={onClose} aria-label={t(lang, 'close')}><X size={18} style={{ color: 'var(--text-3)' }} /></button>
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
      </div>
    </div>
  );
}
