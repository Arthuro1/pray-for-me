import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Lock,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { t } from '../i18n';
import { faithfulnessPassage } from '../lib/prayerMovements';
import {
  faithfulnessMonths,
  faithfulnessShareText,
  prayerSelectionId,
  testimonySelectionId,
} from '../lib/faithfulnessRecap';
import { toast } from '../store/toastStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import VerseAccordion from './VerseAccordion';
import { PrimaryButton, QuietButton } from './shared/Primitives';

const monthLabel = (date, lang) => (
  new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(date)
);

export default function FaithfulnessRecap({ prayers, lang, tr }) {
  const months = useMemo(() => faithfulnessMonths(prayers), [prayers]);
  const [open, setOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [step, setStep] = useState('reflection');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const close = () => setOpen(false);
  useEscapeKey(open ? close : null);
  const trapRef = useFocusTrap(open);

  if (months.length === 0) return null;

  const latestMonth = months[0];
  const selectedMonth = months.find((month) => month.key === selectedMonthKey) || latestMonth;
  const selectedMonthLabel = monthLabel(selectedMonth.date, lang);
  const faithfulnessRef = faithfulnessPassage(lang);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareText = faithfulnessShareText({
    month: selectedMonth,
    selectedIds,
    heading: t(lang, 'faithfulnessShareHeading', { month: selectedMonthLabel }),
    translate: (text) => tr(text, lang),
  });

  const openReflection = () => {
    setSelectedMonthKey(latestMonth.key);
    setStep('reflection');
    setSelectedIds(new Set());
    setOpen(true);
  };

  const chooseMonth = (key) => {
    setSelectedMonthKey(key);
    setStep('reflection');
    setSelectedIds(new Set());
  };

  const beginShareSelection = () => {
    // Privacy default: every visit to the sharing flow starts empty, even if a
    // selection was made earlier in this open reflection.
    setSelectedIds(new Set());
    setStep('select');
  };

  const toggleSelected = (id) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const share = async () => {
    if (!shareText) return;
    try {
      if (canNativeShare) {
        await navigator.share({
          title: t(lang, 'faithfulnessRecapTitle'),
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success(t(lang, 'faithfulnessCopied'));
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error(t(lang, 'errorGeneric'));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openReflection}
        className="mb-4 flex min-h-11 w-full items-center gap-3 rounded-2xl p-4 text-start"
        style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--surface)', color: 'var(--accent)' }}
        >
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {t(lang, 'faithfulnessRecapTitle')}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {t(lang, 'faithfulnessRecapOpen', { month: monthLabel(latestMonth.date, lang) })}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 rtl:rotate-180" style={{ color: 'var(--accent)' }} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{ background: 'rgba(24, 16, 32, 0.52)' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            ref={trapRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={t(lang, 'faithfulnessRecapTitle')}
            className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              {step !== 'reflection' && (
                <button
                  type="button"
                  onClick={() => setStep(step === 'preview' ? 'select' : 'reflection')}
                  aria-label={t(lang, 'backBtn')}
                  className="phase-icon-button shrink-0"
                >
                  <ArrowLeft size={17} className="rtl:rotate-180" aria-hidden="true" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                  {step === 'preview' ? t(lang, 'faithfulnessPreviewTitle') : t(lang, 'faithfulnessRecapTitle')}
                </h2>
                <p className="truncate text-xs capitalize" style={{ color: 'var(--text-3)' }}>{selectedMonthLabel}</p>
              </div>
              <button type="button" onClick={close} aria-label={t(lang, 'close')} className="phase-icon-button shrink-0">
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {step !== 'preview' && months.length > 1 && (
                <label className="mb-4 grid gap-1.5 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                  {t(lang, 'monthView')}
                  <select
                    value={selectedMonth.key}
                    onChange={(event) => chooseMonth(event.target.value)}
                    className="min-h-11 w-full rounded-xl px-3 text-sm capitalize"
                    style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                  >
                    {months.map((month) => (
                      <option key={month.key} value={month.key}>{monthLabel(month.date, lang)}</option>
                    ))}
                  </select>
                </label>
              )}

              {step === 'reflection' && (
                <>
                  <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {t(lang, 'faithfulnessRecapIntro', { month: selectedMonthLabel })}
                  </p>
                  <div className="mb-5 flex gap-2.5 rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
                    <Lock size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {t(lang, 'faithfulnessRecapPrivate')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedMonth.prayers.map(({ prayer, answeredDate, testimonies }) => (
                      <article
                        key={prayer.id}
                        className="rounded-2xl p-4"
                        style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderInlineStart: '3px solid var(--success)' }}
                      >
                        <p className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>
                          {new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(answeredDate)}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{tr(prayer.title, lang)}</h3>
                        {testimonies.map((testimony, index) => (
                          <p key={testimony.id || index} className="mt-2 text-sm italic leading-relaxed" style={{ color: 'var(--text-2)' }}>
                            “{tr(testimony.content, lang)}”
                          </p>
                        ))}
                      </article>
                    ))}
                  </div>

                  {faithfulnessRef && (
                    <VerseAccordion reference={faithfulnessRef} lang={lang} className="mt-4">
                      {({ toggle }) => (
                        <button
                          type="button"
                          onClick={toggle}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                        >
                          <span className="text-sm font-medium">{faithfulnessRef}</span>
                          <span className="text-xs">{t(lang, 'readFullPassage')}</span>
                        </button>
                      )}
                    </VerseAccordion>
                  )}

                  <QuietButton icon={Share2} onClick={beginShareSelection} className="mt-5 w-full">
                    {t(lang, 'faithfulnessPrepareShare')}
                  </QuietButton>
                </>
              )}

              {step === 'select' && (
                <>
                  <div className="mb-4 flex gap-2.5 rounded-xl p-3" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
                    <Lock size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {t(lang, 'faithfulnessShareNote')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedMonth.prayers.map(({ prayer, testimonies }) => (
                      <fieldset key={prayer.id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '0.5px solid var(--border)' }}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(prayerSelectionId(prayer.id))}
                            onChange={() => toggleSelected(prayerSelectionId(prayer.id))}
                            className="h-4 w-4 rounded"
                          />
                          <span>{tr(prayer.title, lang)}</span>
                        </label>
                        {testimonies.map((testimony, index) => {
                          const id = testimonySelectionId(prayer.id, testimony.id, index);
                          return (
                            <label key={id} className="mt-2 flex cursor-pointer items-start gap-3 border-t pt-3 text-sm" style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(id)}
                                onChange={() => toggleSelected(id)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded"
                              />
                              <span className="italic leading-relaxed">“{tr(testimony.content, lang)}”</span>
                            </label>
                          );
                        })}
                      </fieldset>
                    ))}
                  </div>

                  <PrimaryButton
                    onClick={() => setStep('preview')}
                    disabled={!shareText}
                    className="mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t(lang, 'faithfulnessPreviewAction')}
                  </PrimaryButton>
                </>
              )}

              {step === 'preview' && (
                <>
                  <div
                    className="whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed"
                    style={{ background: 'var(--card)', color: 'var(--text-1)', border: '0.5px solid var(--border)' }}
                  >
                    {shareText}
                  </div>
                  <PrimaryButton icon={canNativeShare ? Share2 : Copy} onClick={share} className="mt-5 w-full">
                    {t(lang, canNativeShare ? 'faithfulnessShareAction' : 'faithfulnessCopyAction')}
                  </PrimaryButton>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
