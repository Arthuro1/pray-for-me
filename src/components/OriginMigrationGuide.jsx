import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useVaultStore from '../store/vaultStore';
import { Modal, Input, PrimaryButton, SecondaryButton } from './shared/Primitives';
import VaultModal from './VaultModal';
import { checkOriginMigrationReady, isMigrationVerificationCurrent, recheckOriginMigrationReady, NEW_APP_URL } from '../lib/originMigration';
import { originMigrationCopy } from '../lib/originMigrationCopy';
import { subscribeQueue } from '../lib/mutationQueue';

export default function OriginMigrationGuide({ lang = 'fr', onClose }) {
  const { user } = useAuthStore();
  const { initialized, unlocked } = useVaultStore();
  const { copy, lang: copyLang } = originMigrationCopy(lang);
  const [showSetup, setShowSetup] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const generation = useRef(0);
  const opening = useRef(false);

  useEffect(() => {
    const invalidate = () => {
      generation.current += 1;
      setResult((previous) => previous?.status === 'ready' ? { status: 'changed' } : null);
    };
    invalidate();
    const unsubscribe = subscribeQueue(invalidate);
    for (const event of ['online', 'offline', 'storage', 'focus']) window.addEventListener(event, invalidate);
    return () => {
      generation.current += 1;
      unsubscribe();
      for (const event of ['online', 'offline', 'storage', 'focus']) window.removeEventListener(event, invalidate);
    };
  }, [initialized, unlocked, user?.id, showSetup]);

  useEffect(() => {
    if (result?.status !== 'ready') return undefined;
    const timer = setTimeout(() => setResult({ status: 'changed' }), 60_000);
    return () => clearTimeout(timer);
  }, [result]);

  const verify = async (event) => {
    event.preventDefault();
    const attempt = ++generation.current;
    setChecking(true);
    setResult(null);
    const checked = await checkOriginMigrationReady(user?.id, passphrase);
    setPassphrase('');
    if (attempt === generation.current) setResult(checked);
    setChecking(false);
  };

  const openNewAddress = async (event) => {
    event.preventDefault();
    if (opening.current) return;
    if (!isMigrationVerificationCurrent(result, user?.id)) {
      setResult({ status: 'changed' });
      return;
    }
    // Reserve the new tab during the user's click so the browser does not
    // block navigation after the asynchronous local-draft check. Only a blank
    // trusted document opens until the check passes; immediately sever its
    // opener and forbid a referrer before navigating to the fixed address.
    let nextTab;
    opening.current = true;
    try {
      nextTab = window.open('about:blank', '_blank');
      if (!nextTab) { setResult({ status: 'popupBlocked' }); return; }
      nextTab.opener = null;
      const policy = nextTab.document.createElement('meta');
      policy.name = 'referrer';
      policy.content = 'no-referrer';
      nextTab.document.head.appendChild(policy);
      const checked = await recheckOriginMigrationReady(result, user?.id);
      if (checked.status !== 'ready' || nextTab.closed) {
        nextTab.close();
        setResult(checked.status === 'ready' ? { status: 'changed' } : checked);
        return;
      }
      nextTab.location.replace(NEW_APP_URL);
    } catch {
      nextTab?.close();
      setResult({ status: 'failed' });
    } finally {
      opening.current = false;
    }
  };

  // Replace the guide while recovery is being configured so focus and Escape
  // belong to a single modal. The host remains mounted even when setup changes
  // nudge eligibility or the vault's initialized state.
  if (showSetup) {
    return <VaultModal lang={lang} initialMode="setup" userId={user?.id} onClose={() => setShowSetup(false)} />;
  }

  return (
    <Modal label={copy.title} onClose={onClose} className="max-h-[88vh] overflow-y-auto">
      <div lang={copyLang} dir="ltr">
        <div className="q-dialog__header">
          <h2 className="q-dialog__title">{copy.title}</h2>
          <button type="button" className="icon-button" aria-label={copy.close} onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="grid gap-4">
          {copyLang !== lang && <p className="q-notice m-0">{copy.fallbackNotice}</p>}
          <p className="m-0 q-body-sm">{copy.intro}</p>
          <section>
            <h3 className="q-section-title">{copy.first}</h3>
            <p className="q-body-sm">{copy.setupBody}</p>
            {!initialized && <SecondaryButton disabled={!unlocked} onClick={() => setShowSetup(true)}>{copy.setup}</SecondaryButton>}
          </section>
          <form onSubmit={verify}>
            <h3 className="q-section-title">{copy.check}</h3>
            <p className="q-body-sm">{copy.checkBody}</p>
            <label className="q-body-sm" htmlFor="migration-passphrase">{copy.passphrase}</label>
            <Input id="migration-passphrase" type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} autoComplete="off" disabled={!initialized || checking} />
            <PrimaryButton type="submit" className="mt-3" disabled={!initialized || !unlocked || !passphrase || checking} aria-busy={checking || undefined}>
              {checking ? copy.checking : copy.verify}
            </PrimaryButton>
          </form>
          {result && <p role={result.status === 'ready' ? 'status' : 'alert'} className={`q-notice ${result.status === 'ready' ? '' : 'q-notice--error'}`}>{copy[result.status]}</p>}
          <section>
            <h3 className="q-section-title">{copy.next}</h3>
            <p className="q-body-sm">{copy.nextBody}</p>
            {result?.status === 'ready' && (
              <a className="secondary-button no-underline" href={NEW_APP_URL} target="_blank" rel="noopener noreferrer" onClick={openNewAddress}>
                {copy.continue} <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
            <p className="q-meta mt-3">{copy.reminder}</p>
          </section>
        </div>
      </div>
    </Modal>
  );
}
