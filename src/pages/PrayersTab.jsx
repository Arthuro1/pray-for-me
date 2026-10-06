import { useState, useEffect, useMemo } from 'react';
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
import AnsweredEmpty from '../components/AnsweredEmpty';
import JournalFilters from '../components/JournalFilters';
import { Search, SlidersHorizontal, Plus, X, Users, ArrowLeft, Bell, ChevronRight, Check } from 'lucide-react';
import { t, tp } from '../i18n';
import { useSuppressFab } from '../store/layoutStore';
import { prayerPriority } from '../utils/prayer';
import { weeklyRecap } from '../utils/recap';
import { peopleFromPrayers, peopleViewAvailable, personSession } from '../lib/people';
import { usePrayerActions } from '../hooks/usePrayerActions';
import { todayKey } from '../lib/prayedLog';
import PrayerSession from '../components/PrayerSession';
import { PrimaryButton, QuietButton, SecondaryButton, SegmentedControl } from '../components/shared/Primitives';
import {
  EMPTY_JOURNAL_FILTERS,
  filterJournalPrayers,
  journalFilterOptions,
  journalFiltersActive,
} from '../lib/journalSearch';
import {
  JOURNAL_HINTS,
  journalToolsUseful,
  markJournalHintSeen,
  nextJournalHint,
  readJournalHints,
} from '../lib/journalHints';
import { useContextualNudgeSlot } from '../components/shared/contextualNudge';
import { isCircle } from '../lib/circles';
import { tendCandidates } from '../lib/carried';
import TendAltar from '../components/TendAltar';

// The Journal: every request and its history, in two simple segments — Active
// and Answered. Search and useful retrieval filters stay quiet, and an optional
// People view (for anyone praying over many people by name — pastors,
// intercessors) appears only when the data makes it useful.
//
// Quiet is not the same as hidden. The tools carry short labels wherever there
// is room for them, they stop living behind the search toggle once the list is
// long enough to need them, each is introduced once in words at the moment it
// becomes useful, and an active filter says so plainly with one tap to undo it.
// The count line shows ONLY while filters narrow the list ("N results"); the
// segments already carry the real totals.
// Filtering is a state you can get stuck in: the list looks short and nothing
// explains why. So while anything narrows it, the Journal says so in words and
// keeps one tap to undo it — not only on the empty result, where it is already
// too late to be reassuring.
function FilterStatus({ lang, count, label, onClear }) {
  return (
    <div className="journal-filter-status">
      <p className="q-meta" role="status">
        <span>{t(lang, 'filtersOnLabel')}</span>
        <span aria-hidden="true"> · </span>
        <span>{label}</span>
      </p>
      {/* A filtered-to-nothing list has its own, larger "Clear filters" below —
          two of them side by side would only make the way out harder to see. */}
      {count > 0 && (
        <QuietButton onClick={onClear} icon={X} iconSize={14}>
          {t(lang, 'clearFiltersBtn')}
        </QuietButton>
      )}
    </div>
  );
}

export default function PrayersTab({ onAdd }) {
  const navigate = useNavigate();
  const { prayers, categories, settings, loading, completions, markPrayedOn, updatePrayer } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, categories: s.categories, settings: s.settings, loading: s.loading, completions: s.completions, markPrayedOn: s.markPrayedOn, updatePrayer: s.updatePrayer }))
  );
  const { tr } = useTranslationStore();
  const { user } = useAuthStore();
  const prayerShares = useCommunityStore((s) => s.prayerShares);
  const fetchPrayerShares = useCommunityStore((s) => s.fetchPrayerShares);
  const followUps = useFollowUpStore((s) => s.followUps);
  const lang = settings.language || 'fr';
  const { swipeActions } = usePrayerActions(lang);
  const location = useLocation();

  useEffect(() => { if (user?.id) fetchPrayerShares(user.id); }, [user?.id, fetchPrayerShares]);
  // Opened from a shortcut (e.g. the /answered redirect) with a preset segment.
  const [segment, setSegment] = useState(location.state?.filter === 'answered' ? 'answered' : 'active');
  // Opened from a circle on Today ("On your altar") with that circle preset.
  const [tending, setTending] = useState(false);
  // Recomputed when the review closes, so the prayers just tended drop out.
  const tendList = useMemo(() => tendCandidates(prayers, completions), [prayers, completions, tending]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_JOURNAL_FILTERS,
    ...(isCircle(location.state?.circle) ? { circle: location.state.circle } : {}),
  }));
  // Search is folded behind an icon; its text and filters survive segment
  // switches so coming back to Active resumes exactly where Grace was.
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
  // One-time, dismissible introductions to the Journal's own tools (see
  // lib/journalHints.js). Held in state so dismissing one takes effect at once.
  const [hintsSeen, setHintsSeen] = useState(() => readJournalHints().seen);

  const activeCount = prayers.filter((p) => p.status === 'active').length;
  const answeredCount = prayers.filter((p) => p.status === 'answered').length;
  const latestAnsweredPrayer = useMemo(
    () => prayers
      .filter((p) => p.status === 'answered')
      .sort((a, b) => new Date(b.answered_at || b.updated_at || 0) - new Date(a.answered_at || a.updated_at || 0))[0] || null,
    [prayers]
  );
  const recap = weeklyRecap(prayers, new Date());
  const peopleAvailable = peopleViewAvailable(prayers);
  const people = peopleOpen ? peopleFromPrayers(prayers, followUps) : [];
  const filterOptions = useMemo(
    () => journalFilterOptions(prayers, prayerShares),
    [prayers, prayerShares]
  );

  const SEGMENTS = [
    { id: 'active', label: t(lang, 'active'), count: activeCount },
    { id: 'answered', label: t(lang, 'answered'), count: answeredCount },
  ];

  const normalizedSearch = search.trim();
  const structuredFiltersActive = journalFiltersActive(filters, segment);
  const filtersActive = !!normalizedSearch || structuredFiltersActive;
  const filteredEntries = useMemo(
    () => filterJournalPrayers({
      prayers,
      status: segment,
      query: normalizedSearch,
      filters,
      prayerShares,
      translate: (text) => tr(text, lang),
    }),
    [prayers, segment, normalizedSearch, filters, prayerShares, tr, lang]
  );

  const orderById = Object.fromEntries(categories.map((c, i) => [c.id, i]));
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const byPin = (b.prayer.pinned ? 1 : 0) - (a.prayer.pinned ? 1 : 0);
    if (byPin !== 0) return byPin;
    return prayerPriority(a.prayer, orderById) - prayerPriority(b.prayer, orderById);
  });
  const searchMatches = Object.fromEntries(filteredEntries.map(({ prayer, match }) => [prayer.id, match]));
  const hasFilterControls = (
    categories.length > 0
    || filterOptions.people.length > 0
    || filterOptions.groups.length > 0
    || filterOptions.hasPlans
    || filterOptions.circles.length > 0
    || (segment === 'answered' && answeredCount > 0)
  );
  const resultsLabel = (count) => count === 1
    ? `1 ${t(lang, 'prayer')}`
    : t(lang, 'resultsCount', { n: count });

  // Once the list is long enough to need them, the retrieval tools stop hiding
  // behind the search toggle — a filter nobody can reach without first opening
  // search is a filter nobody finds.
  const toolsUseful = journalToolsUseful(prayers);
  // People has its own, stronger signal (several people prayed for by name), so
  // it never waits on the list-length threshold.
  const utilityPanelOpen = searchOpen || !!search || peopleOpen
    || peopleAvailable || (toolsUseful && hasFilterControls);
  const hint = nextJournalHint({
    prayers,
    peopleOpen,
    toolsInUse: filtersActive || searchOpen || showFilters,
    seen: hintsSeen,
  });
  const { visible: hintVisible, complete: completeHint } = useContextualNudgeSlot('journal-hint', !!hint, 40);
  const dismissHint = (which) => setHintsSeen(markJournalHintSeen(which).seen);

  // Truly empty (no active prayers at all) → the empty state carries the one
  // prominent Add CTA and the floating button hides. A FILTERED zero keeps the
  // FAB and offers "Clear filters" instead — never a nudge to add more.
  const trulyEmpty = activeCount === 0;
  useSuppressFab(true);

  const clearFilters = () => {
    setSearch('');
    setSearchOpen(false);
    setFilters({ ...EMPTY_JOURNAL_FILTERS });
    setShowFilters(false);
  };

  const renderPrayer = (prayer, match = searchMatches[prayer.id]) => (
    <SwipeableRow
      key={prayer.id}
      actions={swipeActions(prayer)}
      className="journal__swipe-row"
    >
      <PrayerListItem
        prayer={prayer}
        lang={lang}
        tr={tr}
        shares={prayerShares[prayer.id]}
        searchMatch={normalizedSearch ? match : null}
        variant="journal"
        onClick={() => navigate(`/prayers/${prayer.id}`)}
      />
    </SwipeableRow>
  );

  // ── People view (only reachable when the toggle is shown) ────────────────
  const personDetail = selectedPerson
    ? people.find((p) => p.name.toLowerCase() === selectedPerson.toLowerCase())
    : null;

  return (
    <div className="phase-page journal">
      <div className="phase-page__shell journal__header">
        <div className="journal__title-row">
          <h1 className="page-header__title">{t(lang, 'journal')}</h1>
          <span className="journal__actions">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((value) => !value);
                if (peopleOpen) setPeopleOpen(false);
              }}
              aria-expanded={searchOpen || !!search}
              aria-label={t(lang, 'search')}
              title={t(lang, 'searchLabel')}
              className="icon-button pressable"
            >
              <Search size={20} aria-hidden="true" />
            </button>
            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                aria-label={t(lang, 'emptyAddManual')}
                title={t(lang, 'emptyAddManual')}
                className="icon-button pressable"
              >
                <Plus size={22} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>

        {/* ONE segmented control carries the counts (no separate stat cards),
            with search, the category filter and — when useful — the People
            lens folded behind small labelled tools. */}
        <div className="journal__toolbar">
          <SegmentedControl
            label={t(lang, 'journal')}
            value={peopleOpen ? 'people' : segment}
            options={SEGMENTS.map((s) => ({
              value: s.id,
              label: (
                <span>
                  <span aria-hidden="true">{s.label}</span>
                  <span className="sr-only">{`${s.label} ${s.count}`}</span>
                </span>
              ),
            }))}
            onChange={(value) => { setSegment(value); setPeopleOpen(false); setSelectedPerson(null); }}
          />
        </div>

        {/* The search field only takes space once asked for; text is preserved
            while it (or the segment) is toggled. */}
        {utilityPanelOpen && (
          <div className="journal__tools">
            {!peopleOpen && (searchOpen || !!search) && (
              <div className="journal-search">
                <Search size={16} aria-hidden="true" className="journal-search__icon" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(lang, 'search')}
                  aria-label={t(lang, 'search')}
                  className="q-input"
                />
                {!!search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setSearchOpen(false); }}
                    aria-label={t(lang, 'close')}
                    className="journal-search__clear icon-button"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
            <div className="journal__tool-row">
              {peopleAvailable && (
                <button
                  type="button"
                  onClick={() => { setPeopleOpen((value) => !value); setSelectedPerson(null); }}
                  aria-pressed={peopleOpen}
                  aria-label={t(lang, 'peopleView')}
                  title={t(lang, 'peopleView')}
                  className="journal__tool pressable"
                >
                  <Users size={16} aria-hidden="true" />
                  <span aria-hidden="true">{t(lang, 'peopleView')}</span>
                </button>
              )}
              {!peopleOpen && (hasFilterControls || toolsUseful) && (
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  aria-haspopup="dialog"
                  // Screen readers hear the state, not just the name — the plum
                  // fill alone would say nothing to them.
                  aria-label={structuredFiltersActive
                    ? `${t(lang, 'journalFilters')} — ${t(lang, 'filtersOnLabel')}`
                    : t(lang, 'journalFilters')}
                  title={t(lang, 'journalFilters')}
                  aria-pressed={structuredFiltersActive}
                  className="journal__tool pressable"
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  <span aria-hidden="true">{t(lang, 'journalFilters')}</span>
                </button>
              )}
              {peopleOpen && (
                <QuietButton onClick={() => setPeopleOpen(false)} icon={ArrowLeft} iconSize={16} className="-ms-3">
                  {t(lang, 'peopleView')}
                </QuietButton>
              )}
            </div>
          </div>
        )}
        {/* One quiet introduction, once, to the tool that has just become
            useful — dismissible, and never shown again after that. */}
        {hintVisible && (
          <div className="journal__hint" role="status">
            <p className="min-w-0 flex-1 text-sm leading-relaxed" style={{ color: 'var(--q-text-secondary)' }}>
              {t(lang, hint === JOURNAL_HINTS.PEOPLE ? 'journalPeopleHint' : 'journalDiscoverHint')}
            </p>
            {hint === JOURNAL_HINTS.PEOPLE && (
              <button
                type="button"
                onClick={() => {
                  dismissHint(JOURNAL_HINTS.PEOPLE);
                  completeHint();
                  setPeopleOpen(true);
                  setSelectedPerson(null);
                }}
                className="quiet-button pressable shrink-0"
              >
                {t(lang, 'journalPeopleHintCta')}
              </button>
            )}
            <button
              type="button"
              onClick={() => { dismissHint(hint); completeHint(); }}
              className="quiet-button pressable shrink-0"
              style={{ color: 'var(--q-text-tertiary)' }}
            >
              {t(lang, 'hintDismiss')}
            </button>
          </div>
        )}
        {/* Tend your altar — offered only when some prayers have quietly rested
            a while; never a count of failures, never in the way. */}
        {!peopleOpen && segment === 'active' && tendList.length > 0 && (
          <button type="button" onClick={() => setTending(true)} className="journal__tend pressable">
            <span className="journal__tend-title">{t(lang, 'tendTitle')}</span>
            <span className="q-meta">{tp(lang, 'tendEntry', tendList.length)}</span>
            <ChevronRight size={16} className="rtl-mirror shrink-0" aria-hidden="true" />
          </button>
        )}
        {tending && (
          <TendAltar
            prayers={tendList}
            completions={completions}
            lang={lang}
            tr={tr}
            onRelease={(prayer) => updatePrayer(prayer.id, { schedule: { type: 'none' } })}
            onClose={() => setTending(false)}
          />
        )}
        {!peopleOpen && showFilters && (hasFilterControls || toolsUseful) && (
          <JournalFilters
            segment={segment}
            filters={filters}
            categories={categories}
            people={filterOptions.people}
            groups={filterOptions.groups}
            hasPersonal={filterOptions.hasPersonal}
            hasPlans={filterOptions.hasPlans}
            circles={filterOptions.circles}
            lang={lang}
            tr={tr}
            active={structuredFiltersActive}
            onChange={setFilters}
            onClear={() => setFilters({ ...EMPTY_JOURNAL_FILTERS })}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>

      <div className="phase-content journal__content">
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
              <QuietButton onClick={() => setSelectedPerson(null)} icon={ArrowLeft} iconSize={16} className="-ms-3 mb-2">
                {t(lang, 'peopleView')}
              </QuietButton>
              <div className="mb-5">
                <h2 className="q-section-title">{personDetail.name}</h2>
                <p className="q-meta mt-1">
                  {personDetail.activeCount} {t(lang, 'active2')} · {personDetail.answeredCount} {t(lang, 'answered2')}
                </p>
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
                    <div className="mb-4 flex items-center gap-3">
                      <p className="flex min-h-[44px] flex-1 items-center gap-2 text-sm" style={{ color: 'var(--q-text-secondary)' }} role="status">
                        <Check size={15} aria-hidden="true" /> {t(lang, 'personPrayedToday', { name: personDetail.name })}
                      </p>
                      <QuietButton onClick={() => setPersonSessionPrayers(active)}>
                        {t(lang, 'prayAgainBtn')}
                      </QuietButton>
                    </div>
                  );
                }
                return (
                  <PrimaryButton onClick={() => setPersonSessionPrayers(remaining)} className="mb-4 w-full">
                    {t(lang, 'prayForPerson', { name: personDetail.name, n: remaining.length })}
                  </PrimaryButton>
                );
              })()}

              <div className="journal__list pb-6">
                {[...personDetail.prayers]
                  .sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1))
                  .map(renderPrayer)}
              </div>
            </>
          ) : (
            // ── People overview: name, open requests, latest news, follow-up ──
            <div className="journal__list pb-6">
              {people.map((person) => (
                <button
                  key={person.name.toLowerCase()}
                  type="button"
                  onClick={() => setSelectedPerson(person.name)}
                  className="prayer-row journal-person-card pressable"
                >
                  <span className="min-w-0">
                    <span className="prayer-row__title">{person.name}</span>
                    {person.latestUpdate?.text && (
                      <span className="prayer-row__context line-clamp-1">{tr(person.latestUpdate.text, lang)}</span>
                    )}
                    <span className="prayer-row__meta">
                      <span>{person.activeCount} {t(lang, 'active2')} · {person.answeredCount} {t(lang, 'answered2')}</span>
                      {person.nextFollowUp && (
                        <span className="inline-flex items-center gap-1" style={{ color: 'var(--q-royal-text)' }}>
                          <Bell size={12} aria-hidden="true" /> {t(lang, 'followUpNext', { date: followUpWhenLabel(person.nextFollowUp, lang) })}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight size={16} className="rtl-mirror shrink-0" style={{ color: 'var(--q-text-tertiary)' }} aria-hidden="true" />
                </button>
              ))}
            </div>
          )
        ) : segment === 'answered' ? (
          <>
            {/* Quiet context, not a statistic card — only when there is
                something to give thanks for. */}
            {!filtersActive && recap.answered > 0 && (
              <p className="q-meta mb-2">
                {t(lang, 'answeredThisWeek', { n: recap.answered })}
              </p>
            )}
            {filtersActive && answeredCount > 0 && (
              <FilterStatus lang={lang} count={filteredEntries.length} label={resultsLabel(filteredEntries.length)} onClear={clearFilters} />
            )}
            {answeredCount === 0 && !filtersActive ? (
              <AnsweredEmpty lang={lang} />
            ) : filtersActive && answeredCount > 0 && filteredEntries.length === 0 ? (
              <div className="journal__no-match">
                <p className="mb-4 text-sm" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'noMatch')}</p>
                <SecondaryButton onClick={clearFilters} icon={X} iconSize={16}>{t(lang, 'clearFiltersBtn')}</SecondaryButton>
              </div>
            ) : (
              <div className="journal__list">
                {filteredEntries.map(({ prayer, match }) => renderPrayer(prayer, match))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* The segments already state the totals — a count line appears
                only while filters narrow the list, as a result label. */}
            {filtersActive && !(loading && prayers.length === 0) && (
              <FilterStatus lang={lang} count={sortedEntries.length} label={resultsLabel(sortedEntries.length)} onClear={clearFilters} />
            )}

            {loading && prayers.length === 0 ? (
              <PrayerListSkeleton count={5} />
            ) : sortedEntries.length === 0 ? (
              trulyEmpty ? (
                <EmptyState
                  title={t(lang, 'noPrayersFound')}
                  subtitle={t(lang, 'noPrayersFoundSub')}
                  actionLabel={onAdd ? t(lang, 'emptyAddManual') : undefined}
                  actionIcon={Plus}
                  onAction={onAdd}
                />
              ) : (
                // Prayers exist but the filters hide them — offer to clear the
                // filters, never to add another prayer.
                <div className="journal__no-match">
                  <p className="mb-4 text-sm" style={{ color: 'var(--q-text-secondary)' }}>{t(lang, 'noMatch')}</p>
                  <SecondaryButton onClick={clearFilters} icon={X} iconSize={16}>{t(lang, 'clearFiltersBtn')}</SecondaryButton>
                </div>
              )
            ) : (
              <div className="journal__list">
                {sortedEntries.map(({ prayer, match }) => renderPrayer(prayer, match))}
                {!filtersActive && latestAnsweredPrayer && renderPrayer(latestAnsweredPrayer)}
              </div>
            )}
            {onAdd && sortedEntries.length > 0 && (
              <QuietButton onClick={onAdd} icon={Plus} className="journal__add">
                {t(lang, 'emptyAddManual')}
              </QuietButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}
