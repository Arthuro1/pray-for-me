import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import Avatar from './Avatar';
import AnonymousToggle from './AnonymousToggle';
import EmptyState from './EmptyState';
import { communityAuthor } from '../utils/user';
import { timeAgo } from '../utils/date';
import { t } from '../i18n';

// Member updates on a community prayer — encouragements, verses, words. The list
// lives in the parent (which also feeds it to the translation toggle); posting a
// word is delegated through onSend so the parent stays the source of truth.
export default function CommunityUpdates({ updates, loading, loc, lang, userId, onSend }) {
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(text.trim(), anon);
    setText('');
    setSending(false);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'memberUpdates')}</p>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} /></div>
      ) : updates.length === 0 ? (
        <EmptyState compact emoji="💬" title={t(lang, 'beFirst')} />
      ) : (
        <div className="space-y-3 mb-3">
          {updates.map((u) => (
            <div key={u.id} className="flex gap-2.5">
              <Avatar name={u.is_anonymous ? '?' : u.author_name} size={28} anonymous={u.is_anonymous} />
              <div className="min-w-0">
                <p className="text-xs mb-0.5 font-medium" style={{ color: 'var(--text-3)' }}>
                  {communityAuthor(u, userId, lang)}{' · '}{timeAgo(u.created_at, lang)}
                </p>
                {u._locked ? (
                  <p className="text-sm italic leading-snug" style={{ color: 'var(--text-3)' }}>{t(lang, 'updateSyncing')}</p>
                ) : (
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{loc(u.text)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, 'wordPlaceholder')}
          className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
          style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={!text.trim() || sending} aria-label={t(lang, 'addWord')} className="rounded-xl px-4 flex items-center justify-center text-white text-sm font-medium disabled:opacity-40" style={{ background: 'var(--accent)' }}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
      <AnonymousToggle checked={anon} onChange={setAnon} lang={lang} className="mt-2" />
    </div>
  );
}
