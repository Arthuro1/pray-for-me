import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useTranslationStore from '../store/translationStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore, { followUpWhenLabel } from '../store/followUpStore';
import PrayerListSkeleton from '../components/shared/Skeleton';
import PrayerListItem from '../components/PrayerListItem';
import SwipeableRow from '../components/shared/SwipeableRow';
import EmptyState from '../components/shared/EmptyState';
import AnsweredGallery from '../components/AnsweredGallery';
import Avatar from '../components/shared/Avatar';
import { Search, SlidersHorizontal, Plus, X, Users, ArrowLeft, Bell, ChevronRight, HandHeart, Check } from 'lucide-react';
import { t } from '../i18n';
import { useSuppressFab } from '../store/layoutStore';
import { getAuthorName } from '../utils/user';
import { prayerPriority } from '../utils/prayer';
import { weeklyRecap } from '../utils/recap';
import { peopleFromPrayers, peopleViewAvailable, personSession } from '../lib/people';
import { usePrayerActions } from '../hooks/usePrayerActions';
import { todayKey } from '../lib/prayedLog';
import PrayerSession from '../components/PrayerSession';
import { PageHeader, SegmentedControl } from '../components/shared/Primitives';

// The Journal: every request and its history, in two simple segments — Active
// and Answered. Search hides behind an icon, the category filter only exists
// once categories do, and an optional People view (for anyone praying over
// many people by name — pastors, intercessors) appears only when the data
// makes it useful. The count line shows ONLY while filters narrow the list
// ("N results"); the segments already carry the real totals.
export default function PrayersTab({ onAdd }) {
  const navigate = useNavigate();
  const { prayers, categories, settings, loading, completions, markPrayedOn } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, categories: s.categories, settings: s.settings, loading: s.loading, completions: s.completions, markPrayedOn: s.markPrayedOn }))
  );
  const { tr } = useTranslationStore();
  const { user } = useAuthStore();
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const fetchPrayerShares = useCommunityStore((s) => s.fetchPrayerShares);
  const followUps = useFollowUpStore((s) => s.followUps);
  const lang = settings.language || 'fr';
  const { swipeActions } = usePrayerActions(lang);
  const location = useLocation();

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id]);
  // Opened from a shortcut (e.g. the /answered redirect) with a preset segment.
  const [segment, setSegment] = useState(location.state?.filter === 'answered' ? 'answered' : 'active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  // Search is folded behind an icon; its text (and the category filter) survive
  // segment switches so coming back to Active resumes exactly where Grace was.
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // People view: an OPTIONAL lens over the same prayers, grouped by who
  // they're for. Only offered when enough person data exists.
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  // Snapshot of a person-scoped session, fixed when it starts — completions
  // recorded mid-session must not reshuffle the walk.
  const [personSessionPrayers, setPersonSessionPrayers] = useState(null);

  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const recap = weeklyRecap(prayers, new Date());
  const peopleAvailable = peopleViewAvailable(prayers);
  const people = peopleOpen ? peopleFromPrayers(prayers, followUps) : [];

  const SEGMENTS = [
    { id: 'active', label: t(lang, 'active'), count: activeCount },
    { id: 'answered', label: t(lang, 'answered'), count: answeredCount },
  ];

  const filtersActive = !!search || categoryFilter !== 'all';

  const filtered = prayers.filter((p) => {
    if (p.status !== 'active') return false;
    if (categoryFilter !== 'all') {
      const pCatIds = (p.prayer_categories || []).map((pc) => pc.category_id);
      if (!pCatIds.includes(categoryFilter)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q) && !(p.person_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const orderById = Object.fromEntries(categories.map((c, i) => [c.id, i]));
  const sorted = [...filtered].sort((a, b) => {
    const byPin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    if (byPin !== 0) return byPin;
    return prayerPriority(a, orderById) - prayerPriority(b, orderById);
  });

  // Truly empty (no active prayers at all) → the empty state carries the one
  // prominent Add CTA and the floating button hides. A FILTERED zero keeps the
  // FAB and offers "Clear filters" instead — never a nudge to add more.
  const trulyEmpty = activeCount === 0;
  useSuppressFab(segment === 'active' && !peopleOpen && trulyEmpty);

  const clearFilters = () => { setSearch(''); setSearchOpen(false); setCategoryFilter('all'); setShowFilters(false); };

  const renderPrayer = (prayer) => (
    <SwipeableRow key={prayer.id} actions={swipeActions(prayer)}>
      <PrayerListItem
        prayer={prayer}
        categories={categories}
        lang={lang}
        tr={tr}
        shares={prayerShares[prayer.id]}
        currentUserName={getAuthorName(user)}
        onClick={() => navigate(`/prayers/${prayer.id}`)}
      />
    </SwipeableRow>
  );

  // ── People view (only reachable when the toggle is shown) ────────────────
  const personDetail = selectedPerson
    ? people.find((p) => p.name.toLowerCase() === selectedPerson.toLowerCase())
    : null;

  return (
    <div className="phase-page">
      <div className="phase-page__shell journal-page-header">
        <PageHeader eyebrow={t(lang, 'prayers')} title={t(lang, 'journal')} />
        <div>

        {/* ONE segmented control carries the counts (no separate stat cards),
            with search, the category filter and — when useful — the People
            lens folded behind small icons. */}
        <div className="journal-toolbar">
          <SegmentedControl
            label={t(lang, 'journal')}
            value={peopleOpen ? 'people' : segment}
            options={SEGMENTS.map((s) => ({ value: s.id, label: `${s.label} ${s.count}` }))}
            onChange={(value) => { setSegment(value); setPeopleOpen(false); setSelectedPerson(null); }}
          />
          {peopleAvailable && (
            <button
              onClick={() => { setPeopleOpen((v) => !v); setSelectedPerson(null); }}
              aria-pressed={peopleOpen}
              aria-label={t(lang, 'peopleView')}
              title={t(lang, 'peopleView')}
              className="phase-icon-button shrink-0"
              style={peopleOpen ? { background: 'var(--plum)', color: '#fff', borderColor: 'var(--plum)' } : undefined}
            >
              <Users size={16} />
            </button>
          )}
          {segment === 'active' && !peopleOpen && (
            <>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-expanded={searchOpen || !!search}
                aria-label={t(lang, 'search')}
                className="phase-icon-button shrink-0"
              >
                <Search size={16} />
              </button>
              {categories.length > 0 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  aria-label={t(lang, 'allCategories')}
                  className="phase-icon-button shrink-0"
                >
                  <SlidersHorizontal size={16} />
                </button>
              )}
            </>
          )}
        </div>

        {/* The search field only takes space once asked for; text is preserved
            while it (or the segment) is toggled. */}
        {segment === 'active' && !peopleOpen && (searchOpen || !!search) && (
          <div className="journal-search">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)', insetInlineStart: '0.9rem' }} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'search')}
              aria-label={t(lang, 'search')}
              className="w-full text-sm focus:outline-none"
            />
            {!!search && (
              <button
                onClick={() => { setSearch(''); setSearchOpen(false); }}
                aria-label={t(lang, 'close')}
                className="absolute top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center"
                style={{ color: 'var(--text-3)', insetInlineEnd: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="phase-content pt-5 max-w-2xl">
        {peopleOpen ? (
          personDetail ? (
            // ── One person's related prayers — not a separate profile page ──
            <>
              {personSessionPrayers && personSessionPrayers.length > 0 && (
                <PrayerSession
                  prayers={personSessionPrayers}
                  categories={categories}
                  lang={lang}
                  tr={tr}
                  onClose={() => setPersonSessionPrayers(null)}
                  onPrayed={(id) => markPrayedOn(id, todayKey())}
                />
              )}
              <button
                onClick={() => setSelectedPerson(null)}
                className="flex items-center gap-2 min-h-[44px] text-sm font-medium mb-2"
                style={{ color: 'var(--accent)' }}
              >
                <ArrowLeft size={15} /> {t(lang, 'peopleView')}
              </button>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={personDetail.name} size={40} />
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{personDetail.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {personDetail.activeCount} {t(lang, 'active2')} · {personDetail.answeredCount} {t(lang, 'answered2')}
                  </p>
                </div>
              </div>

              {/* ONE contextual action: pray for this person now, over their
                  active prayers not yet prayed today. Same session, same
                  per-prayer completion log as Today — leaving midway keeps
                  progress and reopening resumes with the first unfinished. */}
              {(() => {
                const { active, remaining } = personSession(personDetail, completions, todayKey());
                if (active.length === 0) return null;
                if (remaining.length === 0) {
                  return (
                    <div className="flex items-center gap-3 rounded-2xl px-4 py-1 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
                      <p className="flex-1 min-h-[44px] flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }} role="status">
                        <Check size={15} aria-hidden="true" /> {t(lang, 'personPrayedToday', { name: personDetail.name })}
                      </p>
                      <button
                        onClick={() => setPersonSessionPrayers(active)}
                        className="min-h-[44px] shrink-0 text-xs font-medium px-3 rounded-xl"
                        style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                      >
                        {t(lang, 'prayAgainBtn')}
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => setPersonSessionPrayers(remaining)}
                    className="primary-button w-full flex items-center justify-center gap-2 px-5 mb-4 text-sm font-semibold text-white"
                  >
                    <HandHeart size={16} aria-hidden="true" />
                    {t(lang, 'prayForPerson', { name: personDetail.name, n: remaining.length })}
                  </button>
                );
              })()}

              <div className="flex flex-col gap-3 pb-6">
                {[...personDetail.prayers]
                  .sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1))
                  .map(renderPrayer)}
              </div>
            </>
          ) : (
            // ── People overview: name, open requests, latest news, follow-up ──
            <div className="flex flex-col gap-3 pb-6">
              {people.map((person) => (
                <button
                  key={person.name.toLowerCase()}
                  onClick={() => setSelectedPerson(person.name)}
                  className="phase-card journal-person-card w-full text-left p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={person.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{person.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {person.activeCount} {t(lang, 'active2')} · {person.answeredCount} {t(lang, 'answered2')}
                      </p>
                    </div>
                    <ChevronRight size={15} className="shrink-0 opacity-50" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
                  </div>
                  {person.latestUpdate?.text && (
                    <p className="text-xs mt-2 line-clamp-1" style={{ color: 'var(--text-2)' }}>
                      {tr(person.latestUpdate.text, lang)}
                    </p>
                  )}
                  {person.nextFollowUp && (
                    <p className="text-xs mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      <Bell size={10} aria-hidden="true" /> {t(lang, 'followUpNext', { date: followUpWhenLabel(person.nextFollowUp, lang) })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )
        ) : segment === 'answered' ? (
          <>
            {/* Quiet context, not a statistic card — only when there is
                something to give thanks for. */}
            {recap.answered > 0 && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                {t(lang, 'answeredThisWeek', { n: recap.answered })}
              </p>
            )}
            <AnsweredGallery />
          </>
        ) : (
          <>
            {showFilters && categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
                  style={categoryFilter === 'all' ? { background: 'var(--plum)', color: '#fff' } : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                >
                  {t(lang, 'allCategories')}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium"
                    style={categoryFilter === c.id ? { backgroundColor: c.color, color: '#fff' } : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                  >
                    {c.emoji} {tr(c.name, lang)}
                  </button>
                ))}
              </div>
            )}

            {/* The segments already state the totals — a count line appears
                only while filters narrow the list, as a result label. */}
            {filtersActive && !(loading && prayers.length === 0) && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }} role="status">
                {t(lang, 'resultsCount', { n: sorted.length })}
              </p>
            )}

            {loading && prayers.length === 0 ? (
              <PrayerListSkeleton count={5} />
            ) : sorted.length === 0 ? (
              trulyEmpty ? (
                <EmptyState
                  emoji="🙏"
                  title={t(lang, 'noPrayersFound')}
                  subtitle={t(lang, 'noPrayersFoundSub')}
                  actionLabel={onAdd ? t(lang, 'emptyAddManual') : undefined}
                  actionIcon={Plus}
                  onAction={onAdd}
                />
              ) : (
                // Prayers exist but the filters hide them — offer to clear the
                // filters, never to add another prayer.
                <div className="text-center py-12">
                  <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>{t(lang, 'noMatch')}</p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                  >
                    <X size={14} /> {t(lang, 'clearFiltersBtn')}
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                {sorted.map(renderPrayer)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
