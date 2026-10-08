import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PAUL_CIRCLE_APPROVAL, PAUL_CIRCLE_DEEP_APPROVALS, PAUL_CIRCLE_DEEP_LOCALES,
  PAUL_CIRCLE_FILE_SHA256, PAUL_CIRCLE_IDS, PAUL_CIRCLE_SIGNOFF,
  PAUL_CIRCLE_TRANSLATION_APPROVALS, PAUL_CIRCLE_TRANSLATION_LOCALES,
} from './paulCircles20261008';
import {
  CIRCLE_DEEP_REVIEWS, CIRCLE_REVIEW_HISTORY, CIRCLE_TRANSLATION_REVIEWS,
} from '../intercessionCircles/review';
import { canShowCircleDeep, isCircleDeepReviewed, isCircleTranslationDraft } from '../../lib/circleReview';
import { CIRCLES } from '../../lib/circles';
import { LANG_CODES } from '../../i18n';

describe('Paul’s explicit 2026-10-08 circle publication approval', () => {
  it('records the human instruction without asserting a native-language or independent audit', () => {
    expect(PAUL_CIRCLE_APPROVAL).toMatchObject({
      approvalId: 'paul-circles-2026-10-08', reviewer: 'Paul', reviewedAt: '2026-10-08',
      scope: 'current-presentation-only', nativeLanguageReview: false, independentAudit: false,
      provenance: {
        source: 'explicit-human-instruction-in-project-conversation',
        instruction: 'approve all that needed human review and sign with Paul',
        recordedBy: 'Codex',
      },
    });
    expect(PAUL_CIRCLE_SIGNOFF.approvalBasis).toBe('explicit-human-publication-approval');
  });

  it('publishes exactly the seven current deep layers with theology, safety and EN/FR sign-offs', () => {
    expect(PAUL_CIRCLE_IDS).toEqual(CIRCLES);
    expect(PAUL_CIRCLE_DEEP_LOCALES).toEqual(['en', 'fr']);
    expect(Object.keys(PAUL_CIRCLE_DEEP_APPROVALS)).toEqual(PAUL_CIRCLE_IDS);
    for (const circle of PAUL_CIRCLE_IDS) {
      const review = CIRCLE_DEEP_REVIEWS[circle];
      expect(review).toBe(PAUL_CIRCLE_DEEP_APPROVALS[circle]);
      expect(review.theology).toBe(PAUL_CIRCLE_SIGNOFF);
      expect(review.safety).toBe(PAUL_CIRCLE_SIGNOFF);
      expect(Object.keys(review.locales)).toEqual(['en', 'fr']);
      expect(isCircleDeepReviewed(review), circle).toBe(true);
      expect(canShowCircleDeep(circle, { preview: false }), circle).toBe(true);
      expect(isCircleDeepReviewed({ ...review, safety: null })).toBe(false);
    }
    expect(PAUL_CIRCLE_DEEP_APPROVALS.futureCircle).toBeUndefined();
    expect(canShowCircleDeep('futureCircle', { preview: false })).toBe(false);
  });

  it('approves the fourteen current machine-drafted presentations without inventing native review', () => {
    const expected = LANG_CODES.filter((lang) => !['en', 'fr'].includes(lang));
    expect([...PAUL_CIRCLE_TRANSLATION_LOCALES].sort()).toEqual([...expected].sort());
    expect(Object.keys(PAUL_CIRCLE_TRANSLATION_APPROVALS)).toEqual(PAUL_CIRCLE_TRANSLATION_LOCALES);
    for (const lang of PAUL_CIRCLE_TRANSLATION_LOCALES) {
      const review = CIRCLE_TRANSLATION_REVIEWS[lang];
      expect(review).toBe(PAUL_CIRCLE_TRANSLATION_APPROVALS[lang]);
      expect(review).toMatchObject({
        reviewer: 'Paul', reviewedAt: '2026-10-08',
        scope: 'current-machine-drafted-presentation', draftedWith: 'ai-assisted',
        nativeLanguageReview: false, approvalId: PAUL_CIRCLE_APPROVAL.approvalId,
      });
      expect(isCircleTranslationDraft(lang), lang).toBe(false);
    }
    expect(PAUL_CIRCLE_TRANSLATION_APPROVALS.it).toBeUndefined();
    expect(isCircleTranslationDraft('it')).toBe(true);
  });

  it('preserves all earlier pending and machine-draft records as superseded history', () => {
    expect(CIRCLE_REVIEW_HISTORY).toHaveLength(1);
    const history = CIRCLE_REVIEW_HISTORY[0];
    expect(history.supersededBy).toBe(PAUL_CIRCLE_APPROVAL.approvalId);
    expect(Object.keys(history.deepReviews)).toEqual(CIRCLES);
    for (const review of Object.values(history.deepReviews)) {
      expect(review).toEqual({ status: 'pending', theology: null, safety: null, locales: {} });
    }
    expect(Object.keys(history.translationReviews)).toEqual(PAUL_CIRCLE_TRANSLATION_LOCALES);
    for (const review of Object.values(history.translationReviews)) {
      expect(review).toEqual({ status: 'machine-draft', reviewer: null, reviewedAt: null });
    }
  });

  it('binds approval to the current twenty-one content files rather than future edited text', () => {
    const files = [
      ...PAUL_CIRCLE_IDS.map((circle) => `deep/${circle}.js`),
      ...PAUL_CIRCLE_TRANSLATION_LOCALES.map((lang) => `translations/${lang}.json`),
    ];
    expect(Object.keys(PAUL_CIRCLE_FILE_SHA256)).toEqual(files);
    for (const file of files) {
      const text = readFileSync(new URL(`../intercessionCircles/${file}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
      expect(createHash('sha256').update(text, 'utf8').digest('hex'), file).toBe(PAUL_CIRCLE_FILE_SHA256[file]);
    }
  });
});
