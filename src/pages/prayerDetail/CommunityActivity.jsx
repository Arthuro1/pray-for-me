import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useCommunityStore from '../../store/communityStore';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import CommunityUpdates from '../../components/CommunityUpdates';
import CommunityTestimonies from '../../components/CommunityTestimonies';
import UpdateComposer from '../../components/rich/UpdateComposer';
import AnonymousToggle from '../../components/AnonymousToggle';
import { QuietButton } from '../../components/shared/Primitives';

// One titled entry flow — a small label, a serif question, a line on what it
// is for, then the field — exactly as on a personal prayer.
function EntryFlow({ id, label, sacred = false, title, body, children, onCancel, lang }) {
  return (
    <div id={id} className="prayer-activity-panel entry-flow">
      <p className={`section-label ${sacred ? 'section-label--sacred' : ''}`}>{label}</p>
      <h2 className="entry-flow__title">{title}</h2>
      {body && <p className="entry-flow__body">{body}</p>}
      {children}
      <QuietButton onClick={onCancel} className="mt-2 w-full" style={{ color: 'var(--q-text-secondary)' }}>
        {t(lang, 'cancel')}
      </QuietButton>
    </div>
  );
}

// What happens around a community prayer below its ways to pray: the words
// members have written, its testimonies, and the one flow the reader opened
// from the action row (a word, marking it answered, or a testimony). Nothing
// stands open by itself: a flow unfolds when asked for and folds away once
// sent or cancelled.
export default function CommunityActivity({
  communityPrayer, lang, user, authorName, loc, flow, onCloseFlow,
  isAnswered, canManage, isAdmin, avatarFor,
  updates, loadingUpdates, onSendWord, onDeleteWord, onEditWord,
  testimonies, onConfirmAnswered, onResume,
}) {
  const [anonymous, setAnonymous] = useState(false);
  const { addTestimony, deleteCommunityTestimony, editCommunityTestimony } = useCommunityStore(
    useShallow((s) => ({
      addTestimony: s.addTestimony,
      deleteCommunityTestimony: s.deleteCommunityTestimony,
      editCommunityTestimony: s.editCommunityTestimony,
    }))
  );

  const close = () => { setAnonymous(false); onCloseFlow(); };

  const sendWord = async (text, attachments) => {
    const sent = await onSendWord(text, attachments, anonymous);
    if (sent !== false) close();
    return sent;
  };

  const confirmAnswered = async (text, attachments) => {
    const done = await onConfirmAnswered(text, attachments);
    if (done !== false) close();
    return done;
  };

  const postTestimony = async (text, attachments) => {
    const result = await addTestimony({
      groupId: communityPrayer.group_id, userId: user.id, authorName, content: text,
      isAnonymous: anonymous, communityPrayerId: communityPrayer.id, contentLanguage: lang, attachments,
    });
    if (result?.error) {
      toast.error(t(lang, 'errorGeneric'));
      return false;
    }
    close();
    return true;
  };

  // Whole-testimony delete (author or group admin). The store drops it from the
  // testimonies list; CommunityTestimonies handles the author-only media cleanup.
  const deleteTestimony = async (testimonyId) => {
    const res = await deleteCommunityTestimony(testimonyId);
    if (res?.error) toast.error(t(lang, 'errorGeneric'));
  };

  // Author-only text edit; the store patches the list and reverts on error.
  const editTestimony = async (testimonyId, content) => {
    const testimony = testimonies.find((tm) => tm.id === testimonyId);
    if (!testimony) return false;
    const res = await editCommunityTestimony(testimony, content);
    if (res?.error) {
      toast.error(t(lang, 'errorGeneric'));
      return false;
    }
    return true;
  };

  return (
    <>
      <CommunityUpdates
        updates={updates}
        loading={loadingUpdates}
        loc={loc}
        lang={lang}
        userId={user?.id}
        isAdmin={isAdmin}
        avatarFor={avatarFor}
        onDelete={onDeleteWord}
        onEdit={onEditWord}
      />

      {flow === 'word' && !isAnswered && (
        <EntryFlow
          id="pd-word"
          label={t(lang, 'updateFlowLabel')}
          title={t(lang, 'groupWordTitle')}
          body={t(lang, 'groupWordBody')}
          onCancel={close}
          lang={lang}
        >
          <UpdateComposer lang={lang} rows={2} autoFocus placeholder={t(lang, 'newUpdate')} onSend={sendWord} />
          <AnonymousToggle checked={anonymous} onChange={setAnonymous} lang={lang} className="mt-3" />
        </EntryFlow>
      )}

      <CommunityTestimonies
        items={testimonies}
        loc={loc}
        lang={lang}
        userId={user?.id}
        isAdmin={isAdmin}
        onDelete={deleteTestimony}
        onEdit={editTestimony}
      />

      {/* The person testifies; the app only records. It asks what happened —
          it never declares on its own that God answered. The testimony is
          optional: allowEmpty keeps Confirm available with nothing written. */}
      {flow === 'answer' && canManage && !isAnswered && (
        <EntryFlow
          id="pd-answer"
          label={t(lang, 'rememberLabel')}
          sacred
          title={t(lang, 'answerWhatHappened')}
          body={t(lang, 'answerHowGodWorked')}
          onCancel={close}
          lang={lang}
        >
          <UpdateComposer
            lang={lang}
            rows={1}
            autoFocus
            allowEmpty
            placeholder={`${t(lang, 'recordTestimony')}…`}
            sendLabel={t(lang, 'confirm')}
            onSend={confirmAnswered}
          />
        </EntryFlow>
      )}

      {flow === 'testimony' && !canManage && (
        <EntryFlow
          id="pd-testimony"
          label={t(lang, 'rememberLabel')}
          sacred
          title={t(lang, 'postTestimony')}
          body={t(lang, 'groupTestimonyBody')}
          onCancel={close}
          lang={lang}
        >
          <UpdateComposer
            lang={lang}
            rows={3}
            autoFocus
            placeholder={`${t(lang, 'testimony')}…`}
            sendLabel={t(lang, 'postTestimony')}
            onSend={postTestimony}
          />
          <AnonymousToggle checked={anonymous} onChange={setAnonymous} lang={lang} className="mt-3" />
        </EntryFlow>
      )}

      {/* An answered request's only remaining state action — reopening it. */}
      {isAnswered && canManage && (
        <div className="flex gap-3 pb-6 pt-2">
          <QuietButton onClick={onResume} title={t(lang, 'tipResume')} className="-ms-3">
            {t(lang, 'resumePrayer')}
          </QuietButton>
        </div>
      )}
    </>
  );
}
