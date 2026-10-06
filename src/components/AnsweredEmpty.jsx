import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import EmptyState from './shared/EmptyState';
import Encouragement from './shared/Encouragement';

// The Journal's "Answered" view before anything has been answered: an
// invitation back to Today and a word of encouragement — never a score.
// (Answered prayers themselves are ordinary Journal rows.)
export default function AnsweredEmpty({ lang }) {
  const navigate = useNavigate();
  return (
    <>
      <EmptyState
        title={t(lang, 'noAnsweredYet')}
        subtitle={t(lang, 'noAnsweredSub')}
        actionLabel={t(lang, 'today')}
        onAction={() => navigate('/')}
      />
      <Encouragement lang={lang} className="text-center mt-4" />
    </>
  );
}
