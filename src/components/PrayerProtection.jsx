import { useEffect, useRef, useState } from 'react';
import { Fingerprint, KeyRound, Shield } from 'lucide-react';
import { t } from '../i18n';
import useVaultStore from '../store/vaultStore';
import {
  getProtectionStatus, enrollPasskeyRecovery, recoverWithPasskey,
  generateEmergencyRecovery, verifyEmergencyRecovery, recoverWithEmergencyCode,
  enableDeviceUnlock, disableDeviceUnlock, unlockWithDevice, revokeRecoveryMethod,
} from '../lib/prayerProtection';
import { Input, PrimaryButton, SecondaryButton, QuietButton } from './shared/Primitives';
import ConfirmDialog from './shared/ConfirmDialog';
import { useFocusTrap } from '../hooks/useFocusTrap';

const enrollmentEnabled = () => import.meta.env.VITE_PRAYER_PROTECTION_ENABLED === 'true';

function methodLabel(method, lang) {
  const name = method.label || t(lang, method.type === 'passkey' ? 'protectionPasskey' : 'protectionEmergency');
  const created = Date.parse(method.createdAt);
  return Number.isFinite(created) ? `${name} · ${new Date(created).toLocaleString(lang)}` : name;
}

function protectionMessage(lang, status) {
  const key = {
    cancelled: 'protectionCancelled', unsupported: 'protectionUnsupported', prf_unavailable: 'protectionUnsupported',
    offline: 'protectionOffline', wrong_code: 'protectionWrongRecovery',
    no_proof: 'protectionIndependent', verification_required: 'protectionIndependent',
    sync_pending: 'protectionSyncPending', sync_failed: 'protectionSyncPending', unavailable: 'protectionUnavailable',
  }[status] || 'protectionUnavailable';
  return t(lang, key);
}

function EmergencyCodeDialog({ lang, userId, onClose, onVerified }) {
  const [result, setResult] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const ref = useFocusTrap();
  // Generating a code is an explicit click, never a mount effect that React
  // StrictMode or a retry could execute twice and strand an undisplayed secret.
  useEffect(() => {
    // This dialog can sit inside the recovery nudge's modal. Capture Escape so
    // its parent cannot close and discard a code while generation is pending.
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!busy) onClose();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [busy, onClose]);
  const generate = async () => {
    setBusy(true); setMessage('');
    try {
      const next = await generateEmergencyRecovery(userId);
      if (next.ok && next.code) setResult(next);
      else setMessage(protectionMessage(lang, next.status));
    } catch { setMessage(t(lang, 'protectionUnavailable')); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setMessage('');
    try {
      const next = await verifyEmergencyRecovery(userId, result.method.id, code);
      if (next.ok) { setCode(''); onVerified(code, result.method.id); }
      else setMessage(protectionMessage(lang, next.status));
    } catch { setMessage(t(lang, 'protectionUnavailable')); }
    finally { setBusy(false); }
  };
  return (
    <div className="dialog-backdrop fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="emergency-code-title" className="q-dialog vault-card">
        <h2 id="emergency-code-title" className="q-section-title">{t(lang, 'protectionEmergency')}</h2>
        <p className="q-body-sm">{t(lang, 'protectionSaveCode')}</p>
        {result ? <>
          <div className="vault-code" dir="ltr"><code className="break-all select-all">{result.code}</code></div>
          <SecondaryButton onClick={async () => {
            try { await navigator.clipboard.writeText(result.code); setMessage(t(lang, 'vaultCodeCopied')); }
            catch { setMessage(t(lang, 'protectionSaveCode')); }
          }}>{t(lang, 'vaultCopyCode')}</SecondaryButton>
          <p className="q-body-sm">{t(lang, 'protectionRepeatCode')}</p>
          <Input type="password" autoComplete="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} aria-label={t(lang, 'protectionEmergency')} dir="ltr" />
          <PrimaryButton disabled={busy || !code} aria-busy={busy} onClick={verify}>{t(lang, 'protectionVerifyCode')}</PrimaryButton>
        </> : <PrimaryButton disabled={busy} aria-busy={busy} onClick={generate}>{t(lang, 'protectionAddEmergency')}</PrimaryButton>}
        {message && <p role="alert" className="q-notice">{message}</p>}
        <QuietButton disabled={busy} onClick={onClose}>{t(lang, 'close')}</QuietButton>
      </div>
    </div>
  );
}

// Credential labels are account-owned metadata, not claims about physical devices.
// Keep existing recovery controls available when enrollment flags are disabled.
export default function PrayerProtection({ userId, lang = 'fr', onPrivacy }) {
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyCode, setEmergencyCode] = useState('');
  const [emergencyId, setEmergencyId] = useState('');
  const [passkeyId, setPasskeyId] = useState('');
  const [revoke, setRevoke] = useState(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let current = true;
    getProtectionStatus(userId).then((value) => { if (current) setHealth(value); }).catch(() => { if (current) setHealth({ methods: [], error: true }); });
    return () => { current = false; mounted.current = false; };
  }, [userId]);
  const run = async (operation, success = 'protectionReady') => {
    setBusy(true); setMessage('');
    try {
      const result = await operation();
      if (!mounted.current) return;
      setMessage(result.ok ? t(lang, success) : protectionMessage(lang, result.status));
      setHealth(await getProtectionStatus(userId));
      useVaultStore.getState().refresh();
    } catch { if (mounted.current) setMessage(t(lang, 'protectionUnavailable')); }
    finally { if (mounted.current) setBusy(false); }
  };
  const methods = (health?.methods || []).filter((method) => method.status !== 'revoked');
  const passkeys = methods.filter((method) => method.type === 'passkey' && method.status === 'active');
  const emergencies = methods.filter((method) => method.type === 'emergency-code' && method.status === 'active');
  const protectedDevice = health?.deviceProtected;
  const pendingDevice = health?.deviceProtectionPending;
  const canEnroll = enrollmentEnabled();
  const recoveryStatus = methods.some((method) => method.status === 'active' && method.verifiedHere) ? 'protectionTestedHere'
    : methods.some((method) => method.status === 'active') ? 'protectionTestRecorded' : 'protectionNeedsSetup';
  if (!canEnroll && !protectedDevice && !pendingDevice && methods.length === 0) return null;
  return (
    <section className="settings-group" aria-labelledby="prayer-protection-title" aria-busy={busy || !health}>
      <h2 id="prayer-protection-title" className="q-section-title">{t(lang, 'protectionTitle')}</h2>
      <p className="settings-group__sub">{t(lang, 'protectionBody')}</p>
      <h3 className="section-label">{t(lang, 'protectionRecovery')}</h3>
      <p role="status" className="q-body-sm">{!health || health.error ? t(lang, 'protectionUnavailable') : t(lang, recoveryStatus)}</p>
      <p className="q-body-sm">{t(lang, 'protectionSameDevice')}</p>
      {canEnroll && <div className="settings-actions">
        <SecondaryButton icon={KeyRound} disabled={busy || !health?.capability?.canEnroll} onClick={() => run(() => enrollPasskeyRecovery(userId))}>{t(lang, 'protectionEnroll')}</SecondaryButton>
        <SecondaryButton disabled={busy} onClick={() => setShowEmergency(true)}>{t(lang, 'protectionAddEmergency')}</SecondaryButton>
      </div>}
      {canEnroll && health?.capability && !health.capability.canEnroll && <p className="q-body-sm">{t(lang, 'protectionUnsupported')}</p>}
      <h3 className="section-label mt-5">{t(lang, 'protectionDevice')}</h3>
      <p className="q-body-sm">{t(lang, pendingDevice ? 'protectionNeedsVerification' : protectedDevice ? 'protectionDeviceOn' : 'protectionDeviceOff')}</p>
      <p className="q-body-sm">{t(lang, 'protectionDeviceBody')}</p>
      {canEnroll && health?.capability?.canEnroll && !health.capability.canProtectDevice && <p className="q-body-sm">{t(lang, 'protectionDeviceUnsupported')}</p>}
      {protectedDevice || pendingDevice ? <SecondaryButton disabled={busy} onClick={() => run(() => disableDeviceUnlock(userId))}>{t(lang, 'protectionDisableDevice')}</SecondaryButton> : canEnroll && passkeys.length > 0 && <>
        <p className="q-body-sm">{t(lang, 'protectionIndependent')}</p>
        <select className="q-input" aria-label={t(lang, 'protectionPasskey')} value={passkeyId || passkeys[0].id} onChange={(e) => setPasskeyId(e.target.value)}>
          {passkeys.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang)}</option>)}
        </select>
        {emergencies.length > 0 && <select className="q-input" aria-label={t(lang, 'protectionEmergency')} value={emergencyId || emergencies[0].id} onChange={(e) => setEmergencyId(e.target.value)}>
          {emergencies.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang)}</option>)}
          {health?.legacy?.available && <option value="legacy">{t(lang, 'vaultRecoveryTitle')}</option>}
        </select>}
        <Input type="password" autoComplete="off" spellCheck={false} value={emergencyCode} onChange={(e) => setEmergencyCode(e.target.value)} aria-label={t(lang, 'protectionEmergency')} placeholder={t(lang, 'protectionEmergency')} dir="ltr" />
        <SecondaryButton icon={Fingerprint} disabled={busy || !health?.capability?.canProtectDevice} onClick={() => run(async () => {
          const selected = emergencyId || emergencies[0]?.id;
          const result = await enableDeviceUnlock(userId, passkeyId || passkeys[0].id, { emergencyCode,
            emergencyMethodId: selected === 'legacy' ? undefined : selected });
          if (result.ok) setEmergencyCode('');
          return result;
        })}>{t(lang, 'protectionSetDevice')}</SecondaryButton>
      </>}
      {methods.length > 0 && <>
        <h3 className="section-label mt-5">{t(lang, 'protectionCredentials')}</h3>
        <ul className="list-none p-0">
          {methods.map((method) => <li key={method.id} className="py-3 border-b border-current/10">
            <span>{methodLabel(method, lang)}</span>
            <p className="q-body-sm">{t(lang, method.status === 'active' ? method.verifiedHere ? 'protectionTestedHere' : 'protectionTestRecorded' : 'protectionNeedsVerification')}</p>
            <QuietButton disabled={busy} aria-label={`${t(lang, 'protectionRemove')}: ${methodLabel(method, lang)}`} onClick={() => setRevoke(method)}>{t(lang, 'protectionRemove')}</QuietButton>
          </li>)}
        </ul>
      </>}
      {message && <p role="status" className="q-notice">{message}</p>}
      {onPrivacy && <QuietButton icon={Shield} onClick={onPrivacy}>{t(lang, 'privacyCenterTitle')}</QuietButton>}
      {showEmergency && <EmergencyCodeDialog lang={lang} userId={userId} onClose={() => setShowEmergency(false)} onVerified={(code, methodId) => {
        setEmergencyCode(code); setEmergencyId(methodId); setShowEmergency(false);
        run(async () => ({ ok: true }));
      }} />}
      {revoke && <ConfirmDialog title={t(lang, 'protectionRemove')} message={t(lang, 'protectionRemoveConfirm')} confirmLabel={t(lang, 'protectionRemove')} cancelLabel={t(lang, 'cancel')} loading={busy} danger onCancel={() => setRevoke(null)} onConfirm={() => run(async () => {
        const result = await revokeRecoveryMethod(userId, revoke.id);
        if (result.ok) setRevoke(null);
        return result;
      })} />}
    </section>
  );
}

export function PrayerRecoveryChoices({ userId, lang = 'fr', onRecovered }) {
  const [health, setHealth] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [emergencyId, setEmergencyId] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const generation = ++request.current;
    getProtectionStatus(userId).then((value) => { if (request.current === generation) setHealth(value); }).catch(() => { if (request.current === generation) setHealth({ methods: [] }); });
    return () => { request.current += 1; };
  }, [userId]);
  const run = async (operation) => {
    const generation = request.current;
    setBusy(true); setMessage('');
    try {
      const result = await operation();
      if (request.current !== generation) return;
      if (result.ok) { setCode(''); useVaultStore.getState().refresh(); onRecovered?.(); }
      else setMessage(protectionMessage(lang, result.status));
    } catch { if (request.current === generation) setMessage(t(lang, 'protectionUnavailable')); }
    finally { if (request.current === generation) setBusy(false); }
  };
  const methods = (health?.methods || []).filter((method) => method.status === 'active');
  const emergencies = methods.filter((method) => method.type === 'emergency-code');
  const emergency = emergencies.find((method) => method.id === emergencyId) || emergencies[0];
  const localUnlock = health?.deviceUnlockAvailable || health?.deviceProtected || health?.deviceProtectionPending;
  if (!localUnlock && methods.length === 0) return null;
  return (
    <section className="mb-5" aria-label={t(lang, 'protectionChoose')} aria-busy={busy}>
      <p className="q-body-sm">{t(lang, 'protectionChoose')}</p>
      {localUnlock && <PrimaryButton icon={Fingerprint} disabled={busy} onClick={() => run(() => unlockWithDevice(userId))}>{t(lang, 'protectionSetDevice')}</PrimaryButton>}
      {methods.filter((method) => method.type === 'passkey').map((method) => <SecondaryButton key={method.id} icon={KeyRound} disabled={busy} onClick={() => run(() => recoverWithPasskey(userId, method.id))}>{methodLabel(method, lang)}</SecondaryButton>)}
      {emergency && <div className="grid gap-3 mt-4">
        {emergencies.length > 1 && <select className="q-input" aria-label={t(lang, 'protectionCredentials')} value={emergency.id} onChange={(e) => setEmergencyId(e.target.value)}>
          {emergencies.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang)}</option>)}
        </select>}
        <Input type="password" autoComplete="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} aria-label={t(lang, 'protectionEmergency')} placeholder={t(lang, 'protectionEmergency')} dir="ltr" />
        <SecondaryButton disabled={busy || !code} onClick={() => run(() => recoverWithEmergencyCode(userId, emergency.id, code))}>{t(lang, 'protectionEmergency')}</SecondaryButton>
      </div>}
      {message && <p role="alert" className="q-notice">{message}</p>}
    </section>
  );
}
