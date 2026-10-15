// The native-reviewer workflow end to end: the review page's data, the page
// itself (run in jsdom), the file it downloads, and the import that turns that
// file into plan-quality records. See docs/PRAYER_PLAN_QUALITY.md.
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildReviewPacket, fieldLabel } from './planReviewPacket';
import { overlayPairs, planQualityFingerprint, overlayFor } from './planQualityData';
import { PLANS } from '../content/prayerPlans';
import { overlayLanguages } from '../content/plans/translations';
import { reviewProblems } from '../lib/planQuality';
import { renderReviewPage } from '../../scripts/content-quality/planReviewHtml.mjs';
import { parsePlanReviewFile, planReviewRecords } from '../../scripts/content-quality/planReviewImport.mjs';

const REPOSITORY_TIMEOUT = 60_000;
const byId = (id) => PLANS.find((plan) => plan.id === id);
const fingerprintOf = (planId, lang) => planQualityFingerprint(byId(planId), overlayFor(planId, lang));
const quality = { pairs: overlayPairs(), fingerprintOf, reviewProblems, evidence: 'docs/plan-reviews/test.json' };
const packet = buildReviewPacket('de', { plans: PLANS, overlayLanguages, locales: {}, generatedAt: '2026-10-12T00:00:00.000Z' });

const scores = { linguistic: 4, christianLanguage: 4, prayerAuthenticity: 5, theology: 5, pastoralSafety: 5, editorial: 4 };
const reviewer = { name: 'Native reviewer', reviewedAt: '2026-10-12', nativeSpeaker: true, christianReview: true };
const reviewFile = (reviews) => ({ kind: 'qetoret-plan-review', version: 1, lang: 'de', reviewer, terminologyNotes: '', reviews });
const entry = (planId, extra = {}) => ({ planId, ...fingerprintOf(planId, 'de'), scores, acceptedIssues: [], suggestions: [], notes: '', ...extra });

describe('the review page data', () => {
  it('covers every plan with a translation in the language, served ones first', () => {
    expect(packet.plans.map((p) => p.planId).sort()).toEqual(['covenant21', 'discernment28', 'marriage30', 'preparing21']);
    expect(packet.plans.at(-1)).toMatchObject({ planId: 'marriage30', served: false });
    expect(packet.dimensions.map((d) => d.label)).toContain('Pastoral safety');
  }, REPOSITORY_TIMEOUT);

  it('pins each plan to the exact translation shown', () => {
    for (const plan of packet.plans) expect(plan.fingerprint).toEqual(fingerprintOf(plan.planId, 'de'));
  });

  it('shows the English source beside the translation, and marks what falls back', () => {
    const covenant = packet.plans.find((p) => p.planId === 'covenant21');
    const reflection = covenant.days[0].fields.find((f) => f.location === 'day-1.reflection');
    expect(reflection.source).toMatch(/kingdom/i);
    expect(reflection.translation).toMatch(/Reich/);
    expect(covenant.days[0]).toMatchObject({ number: 1, ref: expect.any(String) });
  });

  it('labels findings in words a reviewer reads', () => {
    const preparing = packet.plans.find((p) => p.planId === 'preparing21');
    expect(preparing.issues[0]).toMatchObject({ code: 'TERM_INCONSISTENCY', where: 'Whole plan · forgiveness' });
    const marriage = packet.plans.find((p) => p.planId === 'marriage30');
    expect(marriage.issues.map((i) => i.where)).toContain('All days · Reflection');
  });

  it('names fields', () => {
    expect(fieldLabel('days[3].prompts[1]')).toBe('Prayer prompt 2');
    expect(fieldLabel('days[0].withChildren.childPrompt')).toBe('With children · For your child');
    expect(fieldLabel('days[0].discernment.questions[0]')).toBe('Question 1');
    expect(fieldLabel('biblical.text')).toBe('The biblical story');
  });

  it('is only built for translated languages', () => {
    expect(() => buildReviewPacket('fr', { plans: PLANS, overlayLanguages })).toThrow(/authored source/);
  });
});

describe('importing a review file', () => {
  it('records a complete, current review as the reviewer wrote it', () => {
    const accepted = [{ code: 'TERM_INCONSISTENCY', location: 'plan.forgiveness', reason: 'Deliberate here.' }];
    const result = planReviewRecords(parsePlanReviewFile(reviewFile([entry('preparing21', { acceptedIssues: accepted })])), quality);
    expect(result.recorded).toEqual(['preparing21']);
    expect(result.records['de/preparing21']).toMatchObject({
      status: 'human-reviewed', evidence: 'docs/plan-reviews/test.json',
      review: { ...scores, reviewer, acceptedIssues: accepted },
    });
  });

  it('refuses a review of text that has changed since the page was built', () => {
    const stale = entry('preparing21', { overlayHash: 'c'.repeat(64) });
    expect(planReviewRecords(reviewFile([stale]), quality).rejected[0].reason).toMatch(/changed/);
  });

  it('refuses an incomplete review and keeps suggestions-only entries apart', () => {
    const anonymous = { ...reviewFile([entry('preparing21')]), reviewer: { ...reviewer, nativeSpeaker: false } };
    expect(planReviewRecords(anonymous, quality).rejected[0].reason).toMatch(/nativeSpeaker/);
    const partial = planReviewRecords(reviewFile([entry('marriage30', { scores: null })]), quality);
    expect(partial).toMatchObject({ recorded: [], unscored: ['marriage30'] });
    expect(planReviewRecords(reviewFile([entry('fast3')]), quality).rejected[0].reason).toMatch(/no de translation/);
  });

  it('rejects files that are not review files', () => {
    expect(() => parsePlanReviewFile({ kind: 'other' })).toThrow(/Not a Qetoret plan review/);
    expect(() => parsePlanReviewFile({ ...reviewFile([{ planId: 'x' }]) })).toThrow(/Malformed/);
    expect(() => parsePlanReviewFile({ ...reviewFile([]), lang: 'en' })).toThrow(/language/);
  });
});

describe('the review page in a browser', () => {
  it('sets right-to-left direction on Arabic and Persian translations', () => {
    const arabic = buildReviewPacket('ar', { plans: PLANS, overlayLanguages, generatedAt: '2026-10-12T00:00:00.000Z' });
    const { document } = new JSDOM(renderReviewPage(arabic), { runScripts: 'dangerously', url: 'http://localhost/ar.html' }).window;
    const translation = document.querySelector('.translation');
    expect(translation.getAttribute('dir')).toBe('rtl');
    expect(translation.getAttribute('lang')).toBe('ar');
    expect(document.querySelector('.source').getAttribute('dir')).toBeNull();
  }, REPOSITORY_TIMEOUT);

  it('never lets packet text break out of its script tag', () => {
    const html = renderReviewPage({ ...packet, languageName: '</script><script>alert(1)</script>' });
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });

  it('turns a reviewer’s answers into a file the import accepts', () => {
    const dom = new JSDOM(renderReviewPage(packet), { runScripts: 'dangerously', url: 'http://localhost/review.html' });
    const { window } = dom;
    const { document } = window;
    let downloaded = null;
    window.Blob = class { constructor(parts) { downloaded = parts.join(''); } };
    window.URL.createObjectURL = () => 'blob:review';
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = () => {};
    const type = (input, value) => { input.value = value; input.dispatchEvent(new window.Event('input')); };

    type(document.querySelector('input[type=text]'), 'Native reviewer');
    type(document.querySelector('input[type=date]'), '2026-10-12');
    const download = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Download my review');
    download.click();
    expect(document.querySelector('.message').textContent).toMatch(/Confirm both statements/);
    expect(downloaded).toBeNull();

    [...document.querySelectorAll('.card .check input')].slice(0, 2).forEach((box) => box.click());
    const plan = document.getElementById('plan-preparing21');
    for (const fieldset of plan.querySelectorAll('.scores fieldset')) {
      const radios = fieldset.querySelectorAll('input[type=radio]');
      radios[scores[radios[0].name.split('-').pop()]].click();
    }
    const finding = plan.querySelector('.finding');
    finding.querySelector('input[type=checkbox]').click();
    type(finding.querySelector('input[type=text]'), 'Deliberate here.');
    type(plan.querySelector('.suggest textarea'), 'Ein besserer Satz.');
    download.click();

    const file = parsePlanReviewFile(JSON.parse(downloaded));
    expect(file.reviewer).toEqual(reviewer);
    expect(file.reviews).toHaveLength(1);
    expect(file.reviews[0].suggestions).toEqual([{ location: 'intro', text: 'Ein besserer Satz.' }]);
    const result = planReviewRecords(file, quality);
    expect(result.recorded).toEqual(['preparing21']);
    expect(result.records['de/preparing21'].review.acceptedIssues).toEqual([{ code: 'TERM_INCONSISTENCY', location: 'plan.forgiveness', reason: 'Deliberate here.' }]);
    expect(document.querySelector('.status').textContent).toBe('Scored: 1 of 4 plans');
  }, REPOSITORY_TIMEOUT);
});
