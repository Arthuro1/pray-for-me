import { ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { t } from '../i18n';
import { APP_NAME } from '../lib/brand';
import { BrandMark } from './shared/Brand';
import { QuietButton } from './shared/Primitives';

// The one layout for the full-screen gates around the encryption key — a
// locked vault, a key missing on this device, a state that can't be checked
// yet: the mark, what happened, why the prayers are still safe, the way
// forward, and always a way out at the bottom.
export default function AccountGate({ lang, title, body, reassure, exitLabel, onExit, children }) {
  const { user } = useAuthStore();

  return (
    <div className="account-gate">
      <div className="account-gate__inner">
        <BrandMark size={44} title={APP_NAME} />
        <h1 className="account-gate__title">{title}</h1>
        <p className="account-gate__body">{body}</p>
        {reassure && (
          <p className="account-gate__reassure">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>{reassure}</span>
          </p>
        )}

        <div className="account-gate__action">{children}</div>

        <div className="account-gate__exit">
          {user?.email && <p className="q-meta">{t(lang, 'vaultLockedSignedInAs', { email: user.email })}</p>}
          <QuietButton onClick={onExit}>{exitLabel}</QuietButton>
        </div>
      </div>
    </div>
  );
}
