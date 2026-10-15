// The data behind one language's plan review page (`npm run build:plan-review`).
//
// For every plan with an overlay in that language: the English source beside
// the translation, field by field; the automated findings; and the
// fingerprints a returned review is pinned to (docs/PRAYER_PLAN_QUALITY.md).
// Tooling only, like planQualityData.js — never imported by the app.
import { flattenStrings } from './entries';
import { SOURCE_LOCALES, isOverlayField, locationOf, planFields } from './planChecks';
import {
  committedPlanQualityRecords, glossaryFor, overlayFor, overlayPairs, planQualityFingerprint, recordKey,
} from './planQualityData';
import {
  DEFAULT_QUALITY_THRESHOLDS, DIMENSION_CRITERIA, DIMENSION_GUIDE, QUALITY_DIMENSIONS, SCORE_SCALE, evaluateLocalizedPlan,
} from '../lib/planQuality';
import { TRADITIONS } from '../content/theologyProfiles';
import { LANGUAGES, isRtl } from '../i18n';

const FIELD_LABELS = {
  intro: 'Introduction',
  'biblical.text': 'The biblical story',
  completion: 'Completion',
  reflection: 'Reflection',
  selfPrompt: 'For yourself',
  spousePrompt: 'For your spouse',
  marriagePrompt: 'For your marriage',
  childPrompt: 'For your child',
  practice: 'Practice',
  conversationPrompt: 'Talk together',
  prayTogether: 'Pray together',
  safetyNote: 'Safety note',
  'discernment.reading': 'Reading',
  'discernment.prayer': 'Prayer',
  'discernment.listening': 'Listening',
  'discernment.deeper': 'Go deeper',
  'discernment.journalNote': 'Journal',
  'discernment.review': 'Review',
  'study.context': 'Context',
  'study.tension': 'Tension',
  'study.synthesis': 'Synthesis',
  'study.prayer': 'Prayer',
};

// 'days[2].withChildren.prompts[1]' → 'With children · Prayer prompt 2'.
export function fieldLabel(key) {
  const path = key.replace(/^days\[\d+\]\./, '');
  const prefix = path.startsWith('withChildren.') ? 'With children · ' : '';
  const field = path.replace(/^withChildren\./, '');
  const prompt = field.match(/^prompts\[(\d+)\]$/);
  if (prompt) return `${prefix}Prayer prompt ${Number(prompt[1]) + 1}`;
  const question = field.match(/^(?:study|discernment)\.questions\[(\d+)\]$/);
  if (question) return `${prefix}Question ${Number(question[1]) + 1}`;
  const role = field.match(/^roles\.(\w+)$/);
  if (role) return `${prefix}Optional reflection · ${role[1]}`;
  return `${prefix}${FIELD_LABELS[field] ?? field}`;
}

function sectionsOf(plan, lang, overlay) {
  const translated = flattenStrings(overlay || {});
  const general = [];
  const days = (plan.days || []).map((day, i) => ({
    number: i + 1, theme: day.theme?.[lang] ?? null, themeSource: day.theme?.en ?? '', ref: day.ref ?? null, fields: [],
  }));
  for (const [key, field] of Object.entries(planFields(plan))) {
    if (!isOverlayField(key)) continue;
    const row = {
      location: locationOf(key),
      label: fieldLabel(key),
      source: field.en ?? field.fr ?? '',
      sourceFr: field.fr ?? null,
      translation: translated[key === 'biblical.text' ? 'biblical' : key] ?? null,
    };
    const dayIndex = key.match(/^days\[(\d+)\]/)?.[1];
    if (dayIndex === undefined) general.push(row);
    else days[Number(dayIndex)].fields.push(row);
  }
  return { general, days: days.filter((day) => day.fields.length > 0) };
}

// Where a finding is, in words a reviewer reads: 'Day 4 · Reflection',
// 'All days · For yourself', 'Whole plan · holySpirit'.
function locationLabel(location, sections) {
  const general = sections.general.find((row) => row.location === location);
  if (general) return general.label;
  for (const day of sections.days) {
    const row = day.fields.find((field) => field.location === location);
    if (row) return `Day ${day.number} · ${row.label}`;
  }
  if (location.startsWith('days.')) return `All days · ${fieldLabel(`days[0].${location.slice(5)}`)}`;
  if (location.startsWith('plan.')) return `Whole plan · ${location.slice(5)}`;
  if (location === 'overlay') return 'Whole translation';
  return location.replace(/^day-(\d+)/, 'Day $1');
}

const REVIEW_SEVERITIES = new Set(['critical', 'error', 'warning']);

function planEntry(plan, lang, { records, locales, served }) {
  const overlay = overlayFor(plan.id, lang);
  const record = records[recordKey(lang, plan.id)];
  const result = evaluateLocalizedPlan(plan, lang, { records });
  const sections = sectionsOf(plan, lang, overlay);
  return {
    planId: plan.id,
    title: locales.target?.[plan.titleKey] || locales.en?.[plan.titleKey] || plan.id,
    titleSource: locales.en?.[plan.titleKey] || plan.id,
    served,
    recordStatus: record?.status ?? 'needs-review',
    reviewedBy: record?.status === 'human-reviewed' ? record.review?.reviewer?.name ?? null : null,
    verdict: result.status,
    fingerprint: planQualityFingerprint(plan, overlay),
    biblicalRef: plan.biblical?.ref ?? null,
    issues: result.issues
      .filter((issue) => REVIEW_SEVERITIES.has(issue.severity) && issue.category !== 'review' && !issue.accepted)
      .map(({ code, category, severity, location, message, excerpt }) => ({
        code, category, severity, location, where: locationLabel(location, sections), message, excerpt: excerpt ?? null,
      })),
    ...sections,
  };
}

// locales: { en, target } — the app's UI dictionaries, for plan titles.
export function buildReviewPacket(lang, { plans, overlayLanguages, locales = {}, records = committedPlanQualityRecords(), generatedAt = new Date().toISOString() }) {
  if (SOURCE_LOCALES.includes(lang)) throw new Error(`${lang} is authored source: it is reviewed through the plan sign-offs, not on a translation review page.`);
  const glossary = glossaryFor(lang);
  if (!glossary) throw new Error(`Unsupported language: ${lang}`);
  const byId = new Map(plans.map((plan) => [plan.id, plan]));
  const entries = overlayPairs()
    .filter((pair) => pair.lang === lang && byId.has(pair.planId))
    .map(({ planId }) => byId.get(planId))
    .map((plan) => planEntry(plan, lang, { records, locales, served: overlayLanguages(plan).includes(lang) }))
    .sort((a, b) => Number(b.served) - Number(a.served));
  return {
    kind: 'qetoret-plan-review-page',
    version: 1,
    lang,
    languageName: LANGUAGES.find((language) => language.code === lang)?.label ?? lang,
    rtl: isRtl(lang),
    generatedAt,
    scale: SCORE_SCALE,
    dimensions: QUALITY_DIMENSIONS.map((id) => ({
      id, label: DIMENSION_GUIDE[id].label, guide: DIMENSION_GUIDE[id].text, criteria: DIMENSION_CRITERIA[id],
      critical: DEFAULT_QUALITY_THRESHOLDS.criticalDimensions.includes(id),
    })),
    thresholds: DEFAULT_QUALITY_THRESHOLDS,
    traditions: TRADITIONS,
    glossary: {
      status: glossary.status,
      profile: glossary.profile,
      terms: Object.entries(glossary.terms).map(([concept, term]) => ({
        concept, preferred: term.preferred, allowed: term.allowed, avoid: term.avoid, example: term.example, note: term.note,
      })),
    },
    plans: entries,
  };
}
