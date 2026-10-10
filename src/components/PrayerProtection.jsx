import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, Download, Fingerprint, KeyRound, Lock, ShieldCheck, Upload } from 'lucide-react';
import { t } from '../i18n';
import useVaultStore from '../store/vaultStore';
import {
  getProtectionStatus, enrollPasskeyRecovery, verifyPasskeyRecovery, recoverWithPasskey,
  generateEmergencyRecovery, verifyEmergencyRecovery, recoverWithEmergencyCode,
  enableDeviceUnlock, disableDeviceUnlock, unlockWithDevice, revokeRecoveryMethod,
} from '../lib/prayerProtection';
import { emergencyBackupText, readEmergencyBackupFile } from '../lib/emergencyBackupFile';
import { FILE_PREFIX } from '../lib/brand';
import { Input, PrimaryButton, SecondaryButton, QuietButton } from './shared/Primitives';
import ConfirmDialog from './shared/ConfirmDialog';
import VaultModal from './VaultModal';
import VaultMigrationStatus from './VaultMigrationStatus';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './PrayerProtection.css';

const enrollmentEnabled = () => import.meta.env.VITE_PRAYER_PROTECTION_ENABLED === 'true';
const methodLabel = (method, lang, methods = []) => {
  if (method.label) return method.label;
  const peers = methods.filter((item) => item.type === method.type);
  const name = t(lang, method.type === 'passkey' ? 'protectionPasskey' : 'protectionEmergency');
  return peers.length > 1 ? name + ' ' + (peers.findIndex((item) => item.id === method.id) + 1) : name;
};
const statusFailed = (health) => health?.ok === false || health?.error;
const canVerify = (method) => method.revision >= 1 && !!method.wrapper;

function protectionMessage(lang, status) {
  const key = {
    cancelled: 'protectionCancelled', unsupported: 'protectionUnsupported', prf_unavailable: 'protectionPrfUnavailable',
    offline: 'protectionOffline', wrong_code: 'protectionWrongRecovery',
    recovery_not_configured: 'protectionServiceSetup', origin_not_allowed: 'protectionWrongOrigin',
    authentication_required: 'protectionSignInAgain', unauthorized: 'protectionSignInAgain',
    no_proof: 'protectionIndependent', verification_required: 'protectionIndependent',
    sync_pending: 'protectionSyncPending', sync_failed: 'protectionSyncPending', unavailable: 'protectionUnavailable',
  }[status] || 'protectionUnavailable';
  return t(lang, key);
}

function BackupInput({ lang, code, onChange, disabled, onError }) {
  const fileId = useId();
  const current = useRef(true);
  useEffect(() => { current.current = true; return () => { current.current = false; }; }, []);
  return <div className="protection-backup-input">
    <Input type="password" autoComplete="off" spellCheck={false} value={code} disabled={disabled}
      onChange={(event) => onChange(event.target.value)} aria-label={t(lang, 'protectionEmergency')}
      placeholder={t(lang, 'protectionEmergency')} dir="ltr" />
    <label className={`secondary-button protection-upload${disabled ? ' protection-upload--disabled' : ''}`} htmlFor={fileId}>
      <Upload size={16} aria-hidden="true" /><span>{t(lang, 'protectionUploadCode')}</span>
      <input id={fileId} type="file" accept=".txt,text/plain" disabled={disabled} onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file) return;
        try { const saved = await readEmergencyBackupFile(file); if (current.current) onChange(saved); }
        catch { if (current.current) onError(t(lang, 'protectionCodeFileError')); }
      }} />
    </label>
  </div>;
}

function AccessSetupDialog({ lang, method, busy, message, onContinue, onClose, onUseCode }) {
  const titleId = useId();
  const ref = useFocusTrap(true, 'h2');
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!busy) onClose();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [busy, onClose]);
  return <div className="dialog-backdrop fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} className="q-dialog protection-dialog">
      <div className="protection-dialog__heading">
        <span className="icon-tile tone-plum"><Fingerprint size={20} aria-hidden="true" /></span>
        <h2 id={titleId} tabIndex={-1} className="q-section-title">{t(lang, method ? 'protectionVerifyMethod' : 'protectionSetupTitle')}</h2>
      </div>
      <p className="q-body-sm">{t(lang, method ? 'protectionOpenHint' : 'protectionSetupIntro')}</p>
      {!method && <ol className="protection-instructions">
        <li>{t(lang, 'protectionSetupChoose')}</li>
        <li>{t(lang, 'protectionSetupConfirm')}</li>
      </ol>}
      {message && <p role="alert" className="q-notice">{message}</p>}
      <PrimaryButton icon={Fingerprint} disabled={busy} aria-busy={busy} onClick={onContinue}>{t(lang, 'protectionSetupContinue')}</PrimaryButton>
      {onUseCode && <QuietButton disabled={busy} onClick={onUseCode}>{t(lang, 'protectionPreferCode')}</QuietButton>}
      <QuietButton disabled={busy} onClick={onClose}>{t(lang, 'cancel')}</QuietButton>
    </div>
  </div>;
}

function EmergencyCodeDialog({ lang, userId, existingMethod, onClose, onComplete, onVerified }) {
  const [result, setResult] = useState(existingMethod ? { method: existingMethod } : null);
  const [step, setStep] = useState(existingMethod ? 'check' : 'start');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const ref = useFocusTrap(true, 'h2');
  const current = useRef(true);
  useEffect(() => { current.current = true; return () => { current.current = false; }; }, []);
  useEffect(() => { ref.current?.querySelector('h2')?.focus(); }, [step, ref]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!busy) onClose();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [busy, onClose]);
  const generate = async () => {
    setBusy(true); setMessage('');
    try {
      const next = await generateEmergencyRecovery(userId);
      if (!current.current) return;
      if (next.ok && next.code) { setResult(next); setStep('save'); }
      else setMessage(protectionMessage(lang, next.status));
    } catch { if (current.current) setMessage(t(lang, 'protectionUnavailable')); }
    finally { if (current.current) setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setMessage('');
    try {
      const next = await verifyEmergencyRecovery(userId, result.method.id, code);
      if (!current.current) return;
      if (next.ok) {
        const confirmed = await onVerified(result.method.id);
        if (!current.current) return;
        if (confirmed === false) { setMessage(t(lang, 'protectionUnavailable')); return; }
        setCode(''); setResult({ method: result.method }); setStep('done');
      }
      else setMessage(protectionMessage(lang, next.status));
    } catch { if (current.current) setMessage(t(lang, 'protectionUnavailable')); }
    finally { if (current.current) setBusy(false); }
  };
  const download = () => {
    let url;
    try {
      url = URL.createObjectURL(new Blob([emergencyBackupText(userId, result.code, lang)], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = `${FILE_PREFIX}-recovery-${result.method.id.slice(0, 8)}.txt`;
      document.body.append(link); link.click(); link.remove();
    } catch { setMessage(t(lang, 'protectionSaveCode')); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 0); }
  };
  return <div className="dialog-backdrop fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="emergency-code-title" className="q-dialog protection-dialog">
      <div className="protection-dialog__heading"><span className="icon-tile tone-plum"><KeyRound size={20} aria-hidden="true" /></span>
        <h2 id="emergency-code-title" tabIndex={-1} className="q-section-title">{t(lang, step === 'done' ? 'protectionBackupDone' : 'protectionBackupTitle')}</h2>
      </div>
      {step === 'start' && <>
        <p className="q-body-sm">{t(lang, 'protectionBackupIntro')}</p>
        <PrimaryButton disabled={busy} aria-busy={busy} onClick={generate}>{t(lang, 'protectionAddEmergency')}</PrimaryButton>
      </>}
      {step === 'save' && <>
        <p className="section-label">{t(lang, 'protectionSaveStep')}</p>
        <p className="q-body-sm">{t(lang, 'protectionSaveCode')}</p>
        <div className="protection-code" dir="ltr"><code>{result.code}</code></div>
        <div className="protection-actions">
          <SecondaryButton icon={Download} onClick={download}>{t(lang, 'protectionDownloadCode')}</SecondaryButton>
          <QuietButton icon={Copy} onClick={async () => {
            try { await navigator.clipboard.writeText(result.code); setMessage(t(lang, 'vaultCodeCopied')); }
            catch { setMessage(t(lang, 'protectionSaveCode')); }
          }}>{t(lang, 'vaultCopyCode')}</QuietButton>
        </div>
        <PrimaryButton onClick={() => { setMessage(''); setStep('check'); }}>{t(lang, 'protectionCodeSaved')}</PrimaryButton>
      </>}
      {step === 'check' && <>
        <p className="section-label">{t(lang, 'protectionCheckStep')}</p>
        <p className="q-body-sm">{t(lang, 'protectionRepeatCode')}</p>
        <BackupInput key={userId} lang={lang} code={code} onChange={setCode} disabled={busy} onError={setMessage} />
        <PrimaryButton icon={Check} disabled={busy || !code.trim()} aria-busy={busy} onClick={verify}>{t(lang, 'protectionVerifyCode')}</PrimaryButton>
      </>}
      {step === 'done' && <>
        <span className="protection-success-icon"><Check size={26} aria-hidden="true" /></span>
        <p className="q-body-sm">{t(lang, 'protectionBackupDoneBody')}</p>
        <PrimaryButton onClick={onComplete}>{t(lang, 'doneBtn')}</PrimaryButton>
      </>}
      {step === 'check' && existingMethod && <QuietButton disabled={busy} onClick={() => { setResult(null); setCode(''); setMessage(''); setStep('start'); }}>{t(lang, 'protectionAddEmergency')}</QuietButton>}
      {message && <p role="status" className="q-notice">{message}</p>}
      {step !== 'done' && <QuietButton disabled={busy} onClick={onClose}>{t(lang, 'close')}</QuietButton>}
    </div>
  </div>;
}

export default function PrayerProtection({ userId, lang = 'fr', showTitle = true, onReady }) {
  const { initialized, unlocked, lock, recoverySync } = useVaultStore();
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [emergencyDialog, setEmergencyDialog] = useState(null);
  const [emergencyCode, setEmergencyCode] = useState('');
  const [emergencyId, setEmergencyId] = useState('');
  const [passkeyId, setPasskeyId] = useState('');
  const [backupPasskeyId, setBackupPasskeyId] = useState('');
  const [backupChecked, setBackupChecked] = useState(false);
  const [revoke, setRevoke] = useState(null);
  const [vaultMode, setVaultMode] = useState(null);
  const [setupDialog, setSetupDialog] = useState(null);
  const [backupDeferred, setBackupDeferred] = useState(false);
  const request = useRef(0);
  const mounted = useRef(true); const account = useRef(userId); account.current = userId;
  const titleId = useId();
  useEffect(() => {
    const generation = ++request.current;
    mounted.current = true;
    setHealth(null); setMessage(''); setEmergencyCode(''); setBackupChecked(false); setBusy(false);
    setEmergencyDialog(null); setVaultMode(null); setSetupDialog(null); setBackupDeferred(false); setRevoke(null); setEmergencyId(''); setPasskeyId(''); setBackupPasskeyId('');
    getProtectionStatus(userId).then((value) => { if (request.current === generation) setHealth(value); })
      .catch(() => { if (request.current === generation) setHealth({ methods: [], error: true }); });
    return () => { request.current += 1; mounted.current = false; };
  }, [userId]);
  const run = async (operation) => {
    if (!mounted.current || account.current !== userId) return;
    const generation = request.current;
    setBusy(true); setMessage('');
    try {
      const result = await operation();
      if (request.current !== generation) return;
      setMessage(result.ok ? '' : protectionMessage(lang, result.status));
      const next = await getProtectionStatus(userId);
      if (request.current !== generation) return;
      setHealth(next); useVaultStore.getState().refresh();
      if (result.ok && statusFailed(next)) setMessage(protectionMessage(lang, next.status));
      return { ...result, health: next };
    } catch { if (request.current === generation) setMessage(t(lang, 'protectionUnavailable')); }
    finally { if (request.current === generation) setBusy(false); }
  };
  const methods = (health?.methods || []).filter((method) => method.status !== 'revoked');
  const passkeys = methods.filter((method) => method.type === 'passkey' && method.status === 'active');
  const emergencies = methods.filter((method) => method.type === 'emergency-code' && method.status === 'active');
  const pendingPasskey = methods.find((method) => method.type === 'passkey' && method.status === 'pending' && canVerify(method));
  const selectedPasskey = passkeys.find((method) => method.id === passkeyId) || passkeys[0];
  const additionalPasskeys = passkeys.filter((method) => method.id !== selectedPasskey?.id);
  const backupPasskey = additionalPasskeys.find((method) => method.id === backupPasskeyId) || additionalPasskeys[0];
  const providerBackup = selectedPasskey?.backupState?.eligible === true && selectedPasskey.backupState.backedUp === true;
  const selectedEmergency = emergencies.find((method) => method.id === emergencyId) || emergencies[0];
  const protectedDevice = health?.deviceProtected;
  const pendingDevice = health?.deviceProtectionPending;
  const canEnroll = enrollmentEnabled();
  const active = methods.filter((method) => method.status === 'active');
  const hasLegacy = initialized || health?.legacy?.available;
  const checked = !!health && !statusFailed(health);
  const hasAccess = active.length > 0 && checked;
  const accessChecked = passkeys.some((method) => method.verifiedHere);
  const pendingEmergency = methods.find((method) => method.type === 'emergency-code' && method.status === 'pending' && canVerify(method));
  const setupAvailable = canEnroll && health?.capability?.canEnroll;
  const showBackupStep = hasAccess && accessChecked && !emergencies.length && !backupDeferred && canEnroll;
  const openBackup = () => { setMessage(''); setEmergencyDialog(pendingEmergency ? { method: pendingEmergency } : {}); };
  const openSetup = (method) => { setMessage(''); setSetupDialog({ method }); };
  const finish = () => { if (!hasAccess || busy) return; setBackupDeferred(true); onReady?.(); };
  const legacyActions = <>
    <p className="q-body-sm">{t(lang, 'protectionLegacyBody')}</p>
    <div className="protection-actions">
      {hasLegacy && !unlocked && <SecondaryButton icon={KeyRound} onClick={() => setVaultMode('unlock')}>{t(lang, 'protectionLegacyAccess')}</SecondaryButton>}
      {hasLegacy && unlocked && <>
        <SecondaryButton icon={KeyRound} onClick={() => setVaultMode('change')}>{t(lang, 'vaultChangePass')}</SecondaryButton>
        <QuietButton onClick={() => setVaultMode('rotate')}>{t(lang, 'vaultRotateCode')}</QuietButton>
      </>}
    </div>
    {recoverySync === 'pending' && active.length > 0 && <p className="q-notice">{t(lang, 'protectionSyncPending')}</p>}
  </>;
  return <section className="prayer-protection" aria-label={showTitle ? undefined : t(lang, 'protectionTitle')} aria-labelledby={showTitle ? titleId : undefined} aria-busy={busy || !health}>
    {showTitle && <h2 id={titleId} className="q-section-title">{t(lang, 'protectionTitle')}</h2>}
    <div className="protection-summary">
      <span className="icon-tile tone-teal"><ShieldCheck size={21} aria-hidden="true" /></span>
      <div><h3>{t(lang, 'protectionBody')}</h3></div>
      {unlocked && (hasLegacy || protectedDevice) && <QuietButton icon={Lock} disabled={busy} onClick={() => run(async () => {
        await lock(userId); return { ok: true };
      })}>{t(lang, 'vaultLockNow')}</QuietButton>}
    </div>
    {checked && !emergencies.length && !backupDeferred && setupAvailable && <ol className="protection-steps" aria-label={t(lang, 'protectionStep', { step: accessChecked ? 2 : 1, total: 2 })}>
      <li aria-current={!accessChecked ? 'step' : undefined} className={accessChecked ? 'is-complete' : 'is-current'}>
        <span aria-hidden="true">{accessChecked ? <Check size={14} /> : '1'}</span>{t(lang, 'protectionAccessStep')}
      </li>
      <li aria-current={accessChecked ? 'step' : undefined} className={accessChecked ? 'is-current' : ''}>
        <span aria-hidden="true">2</span>{t(lang, 'protectionBackupStep')}
      </li>
    </ol>}
    <div className="protection-card protection-card--main">
      {!health || !checked ? <>
        <p className="protection-status" role="status">{!health ? t(lang, 'protectionLoading') : protectionMessage(lang, health.status)}</p>
        {health && <QuietButton disabled={busy} onClick={() => run(async () => ({ ok: true }))}>{t(lang, 'protectionRetry')}</QuietButton>}
      </> : <>
        <div className="protection-card__heading">
          {hasAccess ? <Check size={21} aria-hidden="true" /> : <Fingerprint size={21} aria-hidden="true" />}
          <h3>{t(lang, hasAccess ? passkeys.length ? accessChecked ? 'protectionAccessReady' : 'protectionTestRecorded' : 'protectionBackupDone' : 'protectionRecovery')}</h3>
        </div>
        <p className="q-body-sm">{t(lang, hasAccess ? passkeys.length ? 'protectionAccessSavedBody' : 'protectionBackupDoneBody' : setupAvailable ? 'protectionPasskeyBody' : 'protectionSetupUnavailable')}</p>
        {hasAccess ? <>
          {accessChecked && <p className="protection-status protection-status--ready"><Check size={15} aria-hidden="true" />{t(lang, 'protectionAccessChecked')}</p>}
          {passkeys.length > 0 && !accessChecked && <PrimaryButton icon={Fingerprint} disabled={busy || !unlocked} onClick={() => openSetup(selectedPasskey)}>{t(lang, 'protectionVerifyMethod')}</PrimaryButton>}
          {emergencies.length > 0 && passkeys.length > 0 && <p className="protection-status"><Check size={15} aria-hidden="true" />{t(lang, 'protectionCodeVerified')}</p>}
          {onReady && !showBackupStep && <QuietButton disabled={busy} onClick={finish}>{t(lang, 'doneBtn')}</QuietButton>}
        </> : <>
          {setupAvailable && <>
            <PrimaryButton icon={Fingerprint} disabled={busy || !unlocked} onClick={() => openSetup(pendingPasskey)}>{t(lang, pendingPasskey ? 'protectionVerifyMethod' : 'protectionEnroll')}</PrimaryButton>
            <QuietButton disabled={busy || !unlocked} onClick={openBackup}>{t(lang, 'protectionPreferCode')}</QuietButton>
          </>}
          {canEnroll && !setupAvailable && <>
            <p className="protection-hint">{t(lang, 'protectionUnsupported')}</p>
            <PrimaryButton icon={Download} disabled={busy || !unlocked} onClick={openBackup}>{t(lang, 'protectionAddEmergency')}</PrimaryButton>
          </>}
          {!canEnroll && <p className="protection-hint">{t(lang, 'protectionLegacyFallback')}</p>}
          {hasLegacy && <p className="protection-status">{t(lang, health.legacy?.available || recoverySync === 'synced' ? 'protectionLegacyReady' : 'protectionSyncPending')}</p>}
          {hasLegacy && (!setupAvailable || !unlocked) && <SecondaryButton disabled={busy} icon={KeyRound} onClick={() => setVaultMode(unlocked ? 'change' : 'unlock')}>{t(lang, 'protectionLegacyAccess')}</SecondaryButton>}
        </>}
      </>}
    </div>
    {showBackupStep && <div className="protection-card protection-card--next">
      <p className="section-label">{t(lang, 'protectionStep', { step: 2, total: 2 })}</p>
      <div className="protection-card__heading"><Download size={20} aria-hidden="true" /><h3>{t(lang, 'protectionBackupRecommended')}</h3></div>
      <p className="q-body-sm">{t(lang, 'protectionBackupBody')}</p>
      <PrimaryButton disabled={busy} icon={Download} onClick={openBackup}>{t(lang, 'protectionAddEmergency')}</PrimaryButton>
      <QuietButton disabled={busy} onClick={finish}>{t(lang, 'protectionLater')}</QuietButton>
    </div>}
    <details className="protection-details">
      <summary>{t(lang, 'protectionOptions')}</summary>
      <div className="protection-options">
        {hasAccess && canEnroll && !passkeys.length && setupAvailable && <div className="protection-card">
          <div className="protection-card__heading"><Fingerprint size={20} aria-hidden="true" /><h3>{t(lang, 'protectionAccessStep')}</h3></div>
          <p className="q-body-sm">{t(lang, 'protectionPasskeyBody')}</p>
          <SecondaryButton disabled={busy || !checked || !unlocked} onClick={() => openSetup(pendingPasskey)}>{t(lang, pendingPasskey ? 'protectionVerifyMethod' : 'protectionEnroll')}</SecondaryButton>
        </div>}
        <div className="protection-card">
          <div className="protection-card__heading"><Download size={19} aria-hidden="true" /><h3>{t(lang, 'protectionBackupTitle')}</h3></div>
          <p className="q-body-sm">{t(lang, 'protectionBackupBody')}</p>
          {canEnroll && <SecondaryButton disabled={busy || !checked || !unlocked} onClick={openBackup}>{t(lang, 'protectionAddEmergency')}</SecondaryButton>}
        </div>
        <div className="protection-card">
          <div className="protection-card__heading"><Fingerprint size={20} aria-hidden="true" /><h3>{t(lang, 'protectionDeviceOptional')}</h3></div>
          <p className="protection-status">{t(lang, pendingDevice ? 'protectionNeedsVerification' : protectedDevice ? 'protectionDeviceOn' : 'protectionDeviceOff')}</p>
          <p className="q-body-sm">{t(lang, 'protectionDeviceBody')}</p>
          {protectedDevice || pendingDevice
            ? <SecondaryButton disabled={busy} onClick={() => run(() => disableDeviceUnlock(userId))}>{t(lang, 'protectionDisableDevice')}</SecondaryButton>
            : canEnroll && selectedPasskey ? <div className="protection-device-setup">
              {passkeys.length > 1 && <select className="q-input" aria-label={t(lang, 'protectionPasskey')} value={selectedPasskey.id} onChange={(event) => setPasskeyId(event.target.value)}>
                {passkeys.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang, methods)}</option>)}
              </select>}
              {!health.capability?.canProtectDevice && <p className="protection-hint">{t(lang, 'protectionDeviceUnsupported')}</p>}
              {providerBackup ? <p className="protection-hint">{t(lang, 'protectionProviderBackup')}</p> : <>
                <p className="q-body-sm">{t(lang, 'protectionAdditionalPasskeyBody')}</p>
                {backupPasskey
                  ? <select className="q-input" aria-label={t(lang, 'protectionAdditionalPasskey')} value={backupPasskey.id} onChange={(event) => setBackupPasskeyId(event.target.value)}>
                    {additionalPasskeys.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang, methods)}</option>)}
                  </select>
                  : <SecondaryButton icon={KeyRound} disabled={busy || !checked || !health.capability?.canEnroll} onClick={() => openSetup(pendingPasskey)}>{t(lang, 'protectionAddPasskey')}</SecondaryButton>}
              </>}
              {(selectedEmergency || health.legacy?.available || backupChecked) && <details className="protection-details">
                <summary>{t(lang, 'protectionMoreRecovery')}</summary>
                {backupChecked ? <p className="protection-status protection-status--ready"><Check size={15} aria-hidden="true" />{t(lang, 'protectionRecoveryReady')}</p> : <>
                  {(emergencies.length > 1 || (selectedEmergency && health.legacy?.available)) && <select className="q-input" aria-label={t(lang, 'protectionEmergency')} value={emergencyId || selectedEmergency?.id || 'legacy'} onChange={(event) => setEmergencyId(event.target.value)}>
                    {emergencies.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang, methods)}</option>)}
                    {health.legacy?.available && <option value="legacy">{t(lang, 'vaultRecoveryTitle')}</option>}
                  </select>}
                  <BackupInput key={userId} lang={lang} code={emergencyCode} onChange={setEmergencyCode} disabled={busy} onError={setMessage} />
                </>}
              </details>}
              <p className="protection-hint">{t(lang, 'protectionDevicePasskeyBody')}</p>
              <SecondaryButton icon={Fingerprint} disabled={busy || !checked || !health.capability?.canProtectDevice || (!providerBackup && !backupPasskey && !backupChecked && !emergencyCode.trim())} onClick={() => run(async () => {
                const selected = emergencyId === 'legacy' ? undefined : selectedEmergency?.id;
                const recovery = emergencyCode.trim() ? { emergencyCode, emergencyMethodId: selected }
                  : !providerBackup && backupPasskey ? { passkeyMethodId: backupPasskey.id } : {};
                const result = await enableDeviceUnlock(userId, selectedPasskey.id, recovery);
                if (result.ok) { setEmergencyCode(''); setBackupChecked(false); }
                else if (result.status === 'verification_required') setBackupChecked(false);
                return result;
              })}>{t(lang, 'protectionDeviceEnable')}</SecondaryButton>
            </div> : <p className="protection-hint">{t(lang, 'protectionDeviceSetupBody')}</p>}
        </div>
        {methods.length > 0 && <details className="protection-details protection-methods">
          <summary>{t(lang, 'protectionManageMethods')} <span className="protection-count">{methods.length}</span></summary>
          {canEnroll && passkeys.length > 0 && <SecondaryButton icon={KeyRound} disabled={busy || !checked || !health.capability?.canEnroll} onClick={() => openSetup(pendingPasskey)}>{t(lang, 'protectionEnroll')}</SecondaryButton>}
          <ul>{methods.map((method) => <li key={method.id}>
            <KeyRound size={17} aria-hidden="true" /><div className="protection-method__body"><strong>{methodLabel(method, lang, methods)}</strong>
              {method.status !== 'active' ? <p>{t(lang, 'protectionNeedsVerification')}</p> : Number.isFinite(Date.parse(method.createdAt)) && <p>{new Date(method.createdAt).toLocaleDateString(lang)}</p>}
            </div>
            <div className="protection-actions">
              {method.status !== 'active' && canVerify(method) && <QuietButton disabled={busy} onClick={() => method.type === 'passkey' ? openSetup(method) : setEmergencyDialog({ method })}>{t(lang, 'protectionVerifyMethod')}</QuietButton>}
              <QuietButton disabled={busy} aria-label={`${t(lang, 'protectionRemove')}: ${methodLabel(method, lang, methods)}`} onClick={() => setRevoke(method)}>{t(lang, 'protectionRemove')}</QuietButton>
            </div>
          </li>)}</ul>
        </details>}
        {hasLegacy && <details className="protection-details"><summary>{t(lang, 'protectionLegacySettings')}</summary>{legacyActions}</details>}
      </div>
    </details>
    {unlocked && <VaultMigrationStatus lang={lang} showComplete={false} />}
    {message && !setupDialog && <p role="status" className="q-notice">{message}</p>}
    {setupDialog && <AccessSetupDialog key={userId} lang={lang} method={setupDialog.method} busy={busy} message={message}
      onClose={() => { setSetupDialog(null); setMessage(''); }}
      onUseCode={canEnroll ? () => { setSetupDialog(null); openBackup(); } : undefined}
      onContinue={async () => {
        const result = await run(() => setupDialog.method
          ? verifyPasskeyRecovery(userId, setupDialog.method.id) : enrollPasskeyRecovery(userId));
        if (mounted.current && account.current === userId && result?.ok && !statusFailed(result.health)) { setSetupDialog(null); setBackupDeferred(false); }
      }} />}
    {emergencyDialog && <EmergencyCodeDialog key={userId} lang={lang} userId={userId} existingMethod={emergencyDialog.method} onClose={() => setEmergencyDialog(null)} onComplete={() => { setEmergencyDialog(null); if (checked && emergencyDialog.verifiedMethodId && emergencies.some((method) => method.id === emergencyDialog.verifiedMethodId)) onReady?.(); }} onVerified={async (methodId) => {
      if (!mounted.current || account.current !== userId) return false;
      const result = await run(async () => ({ ok: true }));
      if (!mounted.current || account.current !== userId || !result?.ok || statusFailed(result.health)
        || !result.health.methods?.some((method) => method.id === methodId && method.status === 'active')) return false;
      setEmergencyCode(''); setEmergencyId(methodId); setBackupChecked(true);
      setEmergencyDialog((dialog) => ({ ...dialog, verifiedMethodId: methodId }));
      return true;
    }} />}
    {vaultMode && <VaultModal lang={lang} userId={userId} initialMode={vaultMode} onUnlocked={() => {
      const vault = useVaultStore.getState();
      if (mounted.current && account.current === userId && vault.initialized && vault.recoverySync === 'synced') onReady?.();
    }} onClose={() => { setVaultMode(null); run(async () => ({ ok: true })); }} />}
    {revoke && <ConfirmDialog title={t(lang, 'protectionRemove')} message={t(lang, 'protectionRemoveConfirm')} confirmLabel={t(lang, 'protectionRemove')} cancelLabel={t(lang, 'cancel')} loading={busy} danger onCancel={() => setRevoke(null)} onConfirm={() => run(async () => {
      const result = await revokeRecoveryMethod(userId, revoke.id);
      if (result.ok) { setRevoke(null); setBackupChecked(false); }
      return result;
    })} />}
  </section>;
}

export function PrayerRecoveryChoices({ userId, lang = 'fr', onRecovered }) {
  const [health, setHealth] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [emergencyId, setEmergencyId] = useState('');
  const [passkeyId, setPasskeyId] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const generation = ++request.current;
    setHealth(null); setCode(''); setMessage(''); setBusy(false); setPasskeyId(''); setEmergencyId('');
    getProtectionStatus(userId).then((value) => { if (request.current === generation) setHealth(value); })
      .catch(() => { if (request.current === generation) setHealth({ methods: [], error: true }); });
    return () => { request.current += 1; };
  }, [userId]);
  const retry = async () => {
    const generation = request.current;
    setBusy(true); setMessage('');
    try {
      const value = await getProtectionStatus(userId);
      if (request.current === generation) setHealth(value);
    } catch {
      if (request.current === generation) setHealth({ methods: [], error: true });
    } finally { if (request.current === generation) setBusy(false); }
  };
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
  const methods = (health?.methods || []).filter((method) => method.status === 'active'
    || (method.type === 'passkey' && method.status === 'pending' && canVerify(method)));
  const passkeys = methods.filter((method) => method.type === 'passkey')
    .sort((first, second) => Number(first.status !== 'active') - Number(second.status !== 'active'));
  const passkey = passkeys.find((method) => method.id === passkeyId) || passkeys[0];
  const emergencies = methods.filter((method) => method.type === 'emergency-code' && method.status === 'active');
  const emergency = emergencies.find((method) => method.id === emergencyId) || emergencies[0];
  const localUnlock = health?.deviceUnlockAvailable;
  // The local credential and the server recovery entry open the same key.
  // Keep one primary action instead of listing the same passkey twice.
  const otherPasskeys = passkeys.filter((method) => !localUnlock || method.id !== health.localMethodId);
  if (!health) return <p role="status" className="q-body-sm">{t(lang, 'protectionLoading')}</p>;
  const backup = emergency && <div className="protection-recovery-backup">
    {emergencies.length > 1 && <select className="q-input" aria-label={t(lang, 'protectionCredentials')} value={emergency.id} onChange={(event) => setEmergencyId(event.target.value)}>
      {emergencies.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang, methods)}</option>)}
    </select>}
    <BackupInput key={userId} lang={lang} code={code} onChange={setCode} disabled={busy} onError={setMessage} />
    <SecondaryButton disabled={busy || !code.trim()} onClick={() => run(() => recoverWithEmergencyCode(userId, emergency.id, code))}>{t(lang, 'protectionRecoverCode')}</SecondaryButton>
  </div>;
  const passkeyAction = passkey && <>
    <PrimaryButton icon={Fingerprint} disabled={busy} onClick={() => run(() => recoverWithPasskey(userId, passkey.id))}>
      {t(lang, passkey.status === 'pending' ? 'protectionPendingPasskey' : 'protectionRecoverPasskey')}
    </PrimaryButton>
    {passkeys.length > 1 && <details className="protection-details">
      <summary>{t(lang, 'protectionCredentials')}</summary>
      <select className="q-input" aria-label={t(lang, 'protectionPasskey')} value={passkey.id} onChange={(event) => setPasskeyId(event.target.value)} disabled={busy}>
        {passkeys.map((method) => <option key={method.id} value={method.id}>{methodLabel(method, lang, methods)}</option>)}
      </select>
    </details>}
  </>;
  return <section className="protection-recovery" aria-label={t(lang, 'protectionChoose')} aria-busy={busy}>
    {localUnlock ? <PrimaryButton icon={Fingerprint} disabled={busy} onClick={() => run(() => unlockWithDevice(userId))}>{t(lang, 'protectionSetDevice')}</PrimaryButton> : passkeyAction}
    {(localUnlock || passkey) && <p className="protection-hint">{t(lang, 'protectionOpenHint')}</p>}
    {statusFailed(health) && <div className="protection-recovery-backup">
      <p role="status" className="q-notice">{protectionMessage(lang, health.status)}</p>
      <QuietButton disabled={busy} onClick={retry}>{t(lang, 'protectionRetry')}</QuietButton>
    </div>}
    {!statusFailed(health) && !localUnlock && !passkey && !emergency && <p className="q-body-sm">{t(lang, 'protectionNoPasskey')}</p>}
    {localUnlock && otherPasskeys.length > 0 && <details className="protection-details">
      <summary>{t(lang, 'protectionRecoverPasskey')}</summary>
      {otherPasskeys.map((method) => <SecondaryButton key={method.id} icon={KeyRound} disabled={busy} onClick={() => run(() => recoverWithPasskey(userId, method.id))}>{methodLabel(method, lang, methods)}</SecondaryButton>)}
    </details>}
    {localUnlock || passkey ? backup && <details className="protection-details"><summary>{t(lang, 'protectionMoreRecovery')}</summary>{backup}</details> : backup}
    {message && <p role="alert" className="q-notice">{message}</p>}
  </section>;
}
