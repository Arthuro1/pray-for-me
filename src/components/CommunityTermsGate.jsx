import { useState } from 'react';
import { BrandMark } from './shared/Brand';
import { PrimaryButton, QuietButton } from './shared/Primitives';
import { acceptTerms, hasAcceptedTerms } from '../lib/termsAcceptance';

const COPY = {
  en: {
    title: 'Before you continue',
    intro: 'Qetoret is a place for prayer and encouragement. Please read and accept our terms before using your account or sharing with others.',
    safety: 'Do not share illegal, hateful, harassing, sexually explicit or exploitative content, or information that endangers a child. Respect other people’s privacy. You can report shared content and block its author from the content menu.',
    terms: 'Terms of Use', privacy: 'Privacy Policy', deletion: 'Request account deletion',
    accept: 'I have read and accept the Terms of Use.',
    continue: 'Continue to Qetoret', signOut: 'Sign out',
  },
  fr: {
    title: 'Avant de continuer',
    intro: 'Qetoret est un lieu de prière et d’encouragement. Merci de lire et d’accepter nos conditions avant d’utiliser votre compte ou de partager avec d’autres.',
    safety: 'Ne partagez aucun contenu illégal, haineux, harcelant, sexuellement explicite ou exploitant une personne, ni aucune information mettant un enfant en danger. Respectez la vie privée d’autrui. Le menu d’un contenu partagé permet de le signaler et de bloquer son auteur.',
    terms: 'Conditions d’utilisation', privacy: 'Politique de confidentialité', deletion: 'Demander la suppression du compte',
    accept: 'J’ai lu et j’accepte les Conditions d’utilisation.',
    continue: 'Continuer dans Qetoret', signOut: 'Se déconnecter',
  },
};

// Mount outside every signed-in route and composer, including existing accounts
// and accounts created by Google or magic link. Private guest prayer stays open.
// The parent keys this component by user id so acceptance cannot cross accounts.
export default function CommunityTermsGate({ userId, lang, onSignOut, children }) {
  const [accepted, setAccepted] = useState(() => hasAcceptedTerms(userId));
  const [checked, setChecked] = useState(false);
  const copy = COPY[lang] || COPY.en;

  if (accepted) return children;

  const handleContinue = () => {
    if (!checked || !userId) return;
    acceptTerms(userId);
    setAccepted(true);
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6" style={{ background: 'var(--q-bg)' }}>
      <section aria-labelledby="terms-gate-title" className="w-full max-w-lg space-y-6">
        <BrandMark size={52} />
        <h1 id="terms-gate-title" className="q-dialog__title">{copy.title}</h1>
        <p style={{ color: 'var(--q-text-secondary)' }}>{copy.intro}</p>
        <p style={{ color: 'var(--q-text-secondary)' }}>{copy.safety}</p>
        <nav aria-label={copy.terms} className="flex flex-wrap gap-5">
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="underline">{copy.terms}</a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline">{copy.privacy}</a>
          <a href="/delete-account.html" target="_blank" rel="noopener noreferrer" className="underline">{copy.deletion}</a>
        </nav>
        <label className="flex items-start gap-3 py-3 cursor-pointer">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1" />
          <span>{copy.accept}</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={handleContinue} disabled={!checked || !userId}>{copy.continue}</PrimaryButton>
          <QuietButton onClick={onSignOut}>{copy.signOut}</QuietButton>
        </div>
      </section>
    </main>
  );
}
