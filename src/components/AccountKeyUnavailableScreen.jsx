import useAuthStore from '../store/authStore';
import AccountGate from './AccountGate';
import { PrimaryButton } from './shared/Primitives';
import { t } from '../i18n';

// Safe availability gate used when the app cannot verify whether encrypted
// server state already exists. Retrying is the only in-app recovery action: no
// key is generated or replaced while the answer is unknown.
export default function AccountKeyUnavailableScreen({ lang = 'fr', onRetry }) {
  const { signOut } = useAuthStore();

  return (
    <AccountGate
      lang={lang}
      title={t(lang, 'errorBoundaryTitle')}
      body={t(lang, 'errorBoundaryBody')}
      exitLabel={t(lang, 'signOut')}
      onExit={signOut}
    >
      <PrimaryButton onClick={onRetry} className="w-full">{t(lang, 'retry')}</PrimaryButton>
    </AccountGate>
  );
}
