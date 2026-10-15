# Prayer-plan content quality

One question decides whether plan prose is good enough to serve:

> **Would a faithful Christian native speaker naturally write or pray it this way?**

A sentence can be grammatically correct, semantically accurate and
understandable, and still fail, because it sounds foreign, secular, artificial
or theologically unnatural. "Correct translation" is not the target.

**AI can find risks and propose wording. A native Christian reviewer is the
final authority on linguistic and cultural naturalness.** Nothing in this
framework can approve content on its own.

---

## Where things live

| File | Role |
|---|---|
| `src/lib/planQuality.js` | The model: dimensions, issue codes, thresholds, scoring, verdict, `evaluateLocalizedPlan()` / `evaluatePlanQuality()` |
| `src/content-quality/planChecks.js` | Automated detectors. They report facts, never verdicts |
| `src/content-quality/plan-rules/<locale>.json` | Per-locale detection patterns: God claims, safety, self-help, address forms, negation, calques |
| `src/content-quality/glossary/<locale>.json` | Per-locale Christian terminology **profile** and terms (shared with the copy audit and the AI glossary) |
| `src/content/theologyProfiles.js` | Theological/audience profile vocabulary; every plan declares `theologyProfile` |
| `src/content-quality/review-status.json` → `planQuality` | One record per plan × overlay language: status, fingerprints, native review |
| `src/content-quality/plan-quality-baseline.json` | Existing findings (not approvals), so CI fails only on new ones |
| `scripts/content-quality/planQualityAudit.mjs` | The plan part of `npm run check:content` |
| `src/content/plans/planQualityGate.test.js` | The publication gate on real content |
| `src/lib/planReview.js` | Plan release gate (unchanged) + `hasNativeReviewEvidence()` |
| `src/content-quality/planReviewPacket.js`, `scripts/content-quality/planReview{Html,Client,Import}.*`, `scripts/{build,import}-plan-review.mjs` | The review page for native reviewers and the import of their files |
| `docs/plan-reviews/` | Reviewers' returned files, archived unchanged as evidence |

`planQuality.js`, `planChecks.js` and `planQualityData.js` are tooling. They
eager-load every overlay and hash with `node:crypto`, and a guard test keeps
them out of the app bundle. At runtime a plan still serves an overlay only in
the languages its `proseTranslations` lists. **CI proves that every listed
language has a serving basis.**

---

## The publication pipeline

```
valid plan
  → translation integrity          automated   (integrity errors block)
  → linguistic quality             automated risks + human score
  → Christian language quality     automated risks + human score
  → theological review             automated risks + human score + plan sign-off
  → pastoral safety                automated risks + human score + plan sign-off
  → native Christian review        human only  (review-status.json → planQuality)
  → all required locale sign-offs  human only  (plan.review, isPlanReviewed)
  → production
```

`evaluateLocalizedPlan()` returns these as `stages`. Preview and development
behaviour (`?planPreview=1`, dev builds) are unchanged.

Two facts are always kept apart:

- **automatically valid**: no unaccepted blocking finding (`automated.valid`);
- **approved**: a named native Christian reviewer scored it, the scores meet
  the thresholds, and no unaccepted finding caps a dimension below them.

An overlay is **served** (`servingBasis`) only when it is approved
(`native-reviewed`) or appears on the closed legacy list
(`legacy-owner-approved`, see *Migration*). English and French are the authored
source (`authored-source`) and are governed by the plan's own sign-offs.

---

## Quality dimensions

Each dimension is scored 0–5 on its own. A reviewer can score a dimension as a
single number, or by criteria (the mean is used). Criteria names are fixed
(`DIMENSION_CRITERIA`), so a typo cannot silently drop a criterion.

| Dimension | Criteria | Critical |
|---|---|---|
| `linguistic` | grammar, naturalness, idiomaticity, flow, vocabulary, punctuation, register, literalness (no English constructions) | |
| `christianLanguage` | terminology, prayerRegister, biblicalVocabulary, theologicalPrecision, consistency | ✔ |
| `prayerAuthenticity` | addressesGod, godCentered, reverence, prayerForms | |
| `theology` | biblicalFidelity (Scripture → idea → reflection → prayer → response), doctrinalAccuracy, audienceFit, godClaims | ✔ |
| `pastoralSafety` | guarantees, shame, abuseSafety, careReferral, discernment | ✔ |
| `editorial` | clarity, concision, consistency, repetition, readability | |

### The 0–5 scale

| Score | Meaning |
|---|---|
| 5 | Indistinguishable from excellent native Christian writing or prayer |
| 4 | Very natural; minor stylistic imperfections |
| 3 | Understandable but noticeably translated (or theologically loose) |
| 2 | Awkward or literal in several places; or a real theological/pastoral weakness |
| 1 | Seriously unnatural, or a serious theological/pastoral problem |
| 0 | Broken or unusable |

A translation can be grammatically perfect (linguistic 5) and still score 2 for
Christian language, for example when "answered prayer" becomes the
secular-sounding *beantwortetes Gebet* instead of *erhörtes Gebet*.

---

## Publication thresholds (no simple average)

```js
DEFAULT_QUALITY_THRESHOLDS = {
  minimumOverall: 4,        // mean of the six dimensions
  preferredOverall: 4.5,    // reported as meetsPreferred
  minimumDimension: 4,      // every CRITICAL dimension
  floorDimension: 3,        // every other dimension
  criticalDimensions: ['theology', 'pastoralSafety', 'christianLanguage'],
}
```

Thresholds are configurable per call (`options.thresholds`). Serious failures
cannot be averaged away:

- **Ceilings.** An unaccepted automated finding caps its dimension: critical → 1,
  error → 3, warning → 4. A critical safety finding caps `pastoralSafety` at 1
  however well a reviewer scored it. Findings never raise a score.
- **Hard rejection.** Any unaccepted *critical* finding, or any integrity error,
  rejects the locale whatever the scores.
- **Critical dimensions.** 5, 5, 5, 5, 3, 5 averages 4.67 and is still rejected,
  because pastoral safety is below 4.

`status` is `approved`, `needs-review` (no valid human review yet) or `rejected`.

---

## Issue codes

Codes are stable. CI baselines and tooling key on them: **never rename a code**.
Retire it and add a new one. The full list with category and severity is
`ISSUE_CODES` in `src/lib/planQuality.js`. In summary:

| Category | Codes |
|---|---|
| integrity | `OVERLAY_MALFORMED`, `OVERLAY_DAY_COUNT`, `OVERLAY_PROMPT_COUNT`, `OVERLAY_STRUCTURAL_FIELD`, `OVERLAY_UNKNOWN_FIELD`, `OVERLAY_FIELD_NOT_IN_SOURCE`, `SCRIPTURE_REFERENCE_INVENTED`, `SCRIPTURE_TEXT_SUSPECTED`, `PLACEHOLDER_MISMATCH`, `UNTRANSLATED_COPY`, `MISSING_TRANSLATION` |
| linguistic | `ENGLISH_FRAGMENT`, `MIXED_SCRIPT`, `SCRIPT_MISMATCH`, `MT_ARTIFACT`, `LITERAL_CALQUE` |
| editorial | `WRONG_REPEAT`, `TEMPLATE_FRAME` |
| christianLanguage | `TERM_AVOIDED`, `TERM_INCONSISTENCY`, `SELF_HELP_LANGUAGE` |
| prayerAuthenticity | `PRAYER_NOT_ADDRESSED_TO_GOD`, `PROMPTS_NOT_GOD_CENTERED` (info), `COACHING_TONE` |
| theology | `GOD_SPEAKS_FOR_READER`, `GUARANTEED_OUTCOME`, `PRAYER_TECHNIQUE`, `CERTAINTY_CLAIM`, `UNDECLARED_THEOLOGY_PROFILE`, `INVALID_THEOLOGY_PROFILE`, `UNDECLARED_DISPUTED_TOPIC`, `CHARISMATIC_CONFLICT`, `TRADITION_CONFLICT` |
| pastoralSafety | `GUARANTEED_HEALING`, `GUARANTEED_MARRIAGE`, `PROSPERITY_PROMISE`, `FAITH_DEFICIT_BLAME`, `SUFFERING_BLAME`, `SHAME_LANGUAGE`, `ABUSE_ENDANGERMENT`, `CARE_REPLACEMENT`, `COERCIVE_CONFRONTATION`, `SPIRITUAL_MANIPULATION` |
| review | `REVIEW_STALE`, `REVIEW_INCOMPLETE`, `SOURCE_CHANGED_SINCE_REVIEW` (they decide whether a record counts; they never block content) |

Each issue carries a `location` such as `day-4.reflection`, `day-2.prompts[1]`,
`biblical`, `plan.holySpirit` or `plan.theologyProfile`.

---

## God claims: `biblical-only`

Every plan speaks of God the same way: **Scripture teaches, Christian hope
trusts, prayer asks, and the app never speaks for God.** This is one policy
for all plans, enforced through issue metadata rather than a keyword list:

- `GOD_SPEAKS_FOR_READER`: "God is telling you…", "God told you…". Always
  flagged; no qualifier can excuse it.
- `GUARANTEED_OUTCOME`, `CERTAINTY_CLAIM`: "God will definitely give you this",
  "God has chosen your spouse", "This suffering happened because…". These are
  **qualifiable**: inside a sentence framed as prayer, hope, possibility or
  what Scripture teaches ("We pray that God will…", "Scripture promises…"),
  they drop to info.
- `PRAYER_TECHNIQUE`: "If you pray correctly, God will…". Never qualifiable.

Detectors also read **negation**: "it never asks anyone to submit to abuse" is a
safeguard, not the harm. Where the verb comes last (ja, ko, hi, fa, am) negation
is read on both sides (`negationScope`). Scripture inside quotation marks is
ignored, because it carries the Bible's authority, not ours. Qualified and
negated matches stay visible to reviewers as info.

## Pastoral safety

Flagged for rejection: guaranteed healing, guaranteed marriage, guaranteed
financial blessing, "if you had enough faith", suffering as hidden sin, shame
about sexuality, reckless advice about abuse (staying, submitting, confronting
alone, not reporting), replacing medical or mental-health care, coercive
confrontation, and spiritual manipulation. These rules **add to** the guardrails
each plan already enforces in its own tests (no promised spouse in `preparing21`,
non-diagnostic deliverance in `freedom30`, no promised birth outcome in
`unborn21`, the role-reflection limits, purity as honour rather than shame).
None of those were relaxed.

---

## Terminology profiles

Each `glossary/<locale>.json` now carries a **profile**:

```json
"profile": {
  "region": "DE",
  "christianRegister": "modern-protestant (freikirchlich)",
  "prayerRegister": "conversational-reverent",
  "readerAddress": "du",
  "godAddress": "du (kleingeschrieben)",
  "notes": ["…"],
  "regions": { "de-CH": { "notes": ["Schweizer Hochdeutsch schreibt ss statt ß."] } }
}
```

and terms for 25 concepts (`preferred`, `allowed`, `avoid`, `example`, `note`).
The eight added for plans are sanctification, calling, surrender,
abidingInChrist, worship, confession, forgiveness and prayer. Terms map a
**Christian concept to its natural Christian expression**, not an English word
to a literal one. The `allowed` list exists because no language has exactly one
correct Christian formulation.

`regions` holds regional notes (e.g. German in Switzerland) for a future
regional edition. Plans are served per language today, so regional overrides
are documentation until a regional locale exists.

### Consistency (`variants`)

`TERM_INCONSISTENCY` fires when **competing** renderings of one concept appear in
the same plan: *Saint-Esprit* / *Esprit saint*, 圣灵 / 圣神, *покаяние*
(repentance) / *раскаяние* (remorse), *maombi* / *sala*. Only concepts with a
`variants` list are checked, and `variants` lists competitors, not synonyms.
Patterns are stems (`покаяни\p{L}*`), so grammatical inflection (*покаяние*,
*покаяния*, *Umkehr*, *umkehren*) never counts as drift. When two renderings
really belong in one plan, the reviewer accepts the issue with a reason.

### Adding or changing terminology

1. Edit `src/content-quality/glossary/<locale>.json`. A new concept must exist in
   all 16 files (`check:content` validates completeness and the profile).
2. Run `npx vitest run api/aiGlossary.test.js -u`, then **redeploy the API**:
   the AI prompts carry the same glossary.
3. Run `npm run check:content`. A new `avoid` term may surface existing wording
   as a new finding. Fix it, or review it and run `-- --write-baseline`.
4. Leave `status: "draft"` until a named native reviewer approves the file
   (`status: "human-approved"`, `reviewer`, `reviewedAt`).

Detection patterns live in `plan-rules/<locale>.json` (regular expressions,
matched case-insensitively). Every file is an AI draft: `am` is low-confidence
and the others need a native reviewer. Adding a pattern can surface existing
findings in the same way.

---

## Theological and audience profiles

Every plan declares `theologyProfile` (`src/content/theologyProfiles.js`):

```js
theologyProfile: theologyProfile({ audience: 'women', disputedTopics: ['gender-roles', 'spiritual-gifts'] }),
// → { tradition: 'pentecostal-charismatic', audience: 'women', charismatic: true, disputedTopics: [...] }
```

- `tradition`: `pentecostal-charismatic` (the editorial default, see
  `docs/content/STYLE_GUIDE.md`), `broad-evangelical`, `catholic`, `orthodox`.
- `audience`: `general-christian`, `seekers`, `singles`, `engaged`, `married`,
  `parents`, `men`, `women`. A life-stage plan must match its `lifeStage`.
- `disputedTopics`: `gender-roles`, `deliverance`, `spiritual-gifts`,
  `hearing-god`, `divine-healing`, `sexual-ethics`, `divorce-remarriage`.

Profiles make assumptions explicit; they never rewrite content toward one
tradition. Checks run on the authored EN/FR source:
`UNDECLARED_DISPUTED_TOPIC` (e.g. "pray in tongues" without `spiritual-gifts`),
`CHARISMATIC_CONFLICT` (charismatic practice in a plan declared
`charismatic: false`), `TRADITION_CONFLICT` (e.g. the rosary in a Protestant
profile). The markers name ministry practice ("generational curse", "speak in
tongues"), never ordinary biblical words ("deliverance", "spiritual gifts",
"demons" in a Gospel narrative).

The 2026-10-12 backfill (all 27 plans) was inferred from content and is for the
owner to review:

| Plans | Profile beyond the default |
|---|---|
| preparing21 | singles · gender-roles |
| discernment28 | singles · hearing-god |
| covenant21 / marriage30 | engaged / married · gender-roles |
| freedom30 | deliverance |
| holySpirit21 | spiritual-gifts, hearing-god |
| upperRoom10 | spiritual-gifts |
| manOfGod21 / womanOfGod21 | men / women · gender-roles (+ spiritual-gifts for womanOfGod21) |
| children21 | parents |
| all others | general-christian, no disputed topic |

---

## Automated vs human responsibilities

| Automated (CI) | Human (native Christian reviewer, plan owner) |
|---|---|
| Structure, counts, placeholders, unknown fields | Naturalness, idiom, register |
| Scripture stays in the source; no invented ranges | Whether Scripture is used meaningfully, not decoratively |
| Untranslated English, wrong script, artifacts, known calques | Literal-English constructions nobody listed |
| Glossary avoid terms, competing renderings | Whether a term is how Christians in that language actually speak |
| God-claim and safety **patterns** | Theological fidelity, unsupported doctrine, contradictions with the passage |
| Prayer never addresses God; coaching tone | Whether it sounds like a real prayer |
| Repetition and templating | Clarity, concision, flow |
| Records pinned to the exact text (hashes) | The scores, accepted issues and sign-off itself |

Pattern detection is a safety net with false negatives. A clean automated result
proves nothing about meaning.

---

## Examples

| | Avoid | Natural Christian wording |
|---|---|---|
| de | *beantwortetes Gebet*, *Gebetsanfrage* | *erhörtes Gebet*, *Gebetsanliegen* |
| fr | *Saint-Esprit* on one day and *Esprit saint* on another | one rendering throughout |
| fr | *Ça fait du sens.* | *Cela a du sens.* |
| sw | *ombi la maombi* (calque) | *hitaji la maombi* |
| fa | «نماز می‌خوانی» (Islamic ritual prayer) | «دعا می‌کنی» |
| zh | 祷告 and 祈祷 mixed in one plan | 祷告 throughout |
| any | "Become the best version of yourself." | "Lord, make me more like Christ." |
| any | "God is telling you to marry her." | "Scripture calls us to seek wisdom: ask God for it, and talk with mature believers." |
| any | "Today I will choose positivity." (presented as a prayer) | "Father, help me choose trust today." |
| any | "If you had enough faith, you would be healed." | "We bring our longing for healing to God and trust him with the outcome." |

---

## How a language is approved

Only a named human writes a review. An AI never writes or edits one, and never
records a status beyond `needs-review`. Reviewers never touch JSON: they use a
review page.

1. **Build the page.** `npm run build:plan-review -- --lang de` writes
   `reports/plan-review/de.html` (`--all` builds every translated language).
   It is one self-contained file. It works offline, makes no requests, and
   includes the hidden overlays the app does not show yet.
2. **Send it to a native Christian reviewer** (email, chat, USB stick).
   Opening it in any browser, they see:
   - every plan day by day, English beside their language (French on request);
   - the automatic findings, highlighted in the text;
   - the draft terminology for their language;
   - the 0–5 scale with what each area means.

   For each plan they can accept a finding with a reason, suggest better wording
   for any passage, and score the six areas. Their work is saved in their
   browser until they click **Download my review**.
3. **Import their file.** Run
   `npm run import:plan-review -- de-plan-review-2026-10-20-anna.json` (or add
   `--dry-run` first). For each plan the reviewer scored completely, it:
   - checks the file still matches the current translation and plan version;
   - checks the reviewer's evidence (name, date, native-speaker and Christian
     attestations);
   - writes a `human-reviewed` record to
     `review-status.json → planQuality["de/<planId>"]` and archives the file
     unchanged in `docs/plan-reviews/` (the record's `evidence`);
   - prints each verdict, e.g. `approved (overall 4.5)` or
     `rejected (pastoralSafety 3 < 4 (critical))`.

   Plans with only suggestions are reported, not recorded.
4. **Apply suggestions, if any.** A wording suggestion changes the translation,
   which voids that review. Apply the corrections, build a new page, and ask the
   reviewer to confirm; their second file is the one that counts.
5. **Serve it.** Add the language to the plan's `proseTranslations`. CI
   (`planQualityGate.test.js`) checks that the language is `native-reviewed`:
   complete evidence, current fingerprints, thresholds met, and no unaccepted
   blocking finding. If a reviewer rejects a language that is already served,
   the import warns you, and CI fails until it is corrected or withdrawn.

Reviewer metadata is deliberately minimal: name, date, and the two
self-attestations. An optional `tradition` takes a value from `TRADITIONS`.
There is no free-text background or contact details. A record looks like this:

```json
"de/marriage30": {
  "status": "human-reviewed",
  "contentVersion": 1, "overlayHash": "…", "sourceHash": "…",
  "review": {
    "linguistic": 5, "christianLanguage": 4, "prayerAuthenticity": 5,
    "theology": 5, "pastoralSafety": 5, "editorial": 4,
    "reviewer": { "name": "…", "reviewedAt": "YYYY-MM-DD", "nativeSpeaker": true, "christianReview": true },
    "acceptedIssues": [{ "code": "TERM_INCONSISTENCY", "location": "plan.forgiveness", "reason": "…" }]
  },
  "evidence": "docs/plan-reviews/de-plan-review-2026-10-20-anna.json"
}
```

A dimension may also hold per-criterion scores (`{ "grammar": 5, … }`). The
mean is used.

The plan's own theology, safety and locale sign-offs (`plan.review`,
`src/content/reviews/`) remain separate and are still required for the plan.

---

## Versioning

| Change | Effect |
|---|---|
| Overlay text changes | That language's record is void (`REVIEW_STALE`); `--sync-metadata` resets it to `needs-review`; if the language is served, CI fails until it is re-reviewed or removed from `proseTranslations` |
| Plan `version` bump (meaning changed) | Every record of the plan is void |
| English/French source edited (typo-level) | Records still count; `SOURCE_CHANGED_SINCE_REVIEW` asks the reviewer to confirm |
| New or changed detection pattern or glossary term | May surface existing findings: fix them or review and baseline them (`-- --write-baseline`, review the diff) |
| Threshold change | Edit `DEFAULT_QUALITY_THRESHOLDS` and this document in the same change |
| Issue code | Never renamed or reused |

---

## Migration (2026-10-12)

- **Profiles.** All 27 plans now declare `theologyProfile` (see the table
  above). Please review the inferred values.
- **Legacy overlays.** The 32 overlays already served (`preparing21` and
  `discernment28` in 14 languages, `covenant21` in de/es/pt/ru) keep being served
  as `legacy-owner-approved`. Each record states its basis and that it is not a
  native review, and is pinned to today's text. The list is closed in
  `planQualityGate.test.js`. Changing one of these overlays voids its record.
- **Hidden overlays.** The other 24 (`covenant21` in 10 languages, all of
  `marriage30`) are `needs-review`. Most are templated stubs with
  `TEMPLATE_FRAME`, `WRONG_REPEAT` or `PLACEHOLDER_MISMATCH` findings.
- **Baselined findings** (reported, not fixed, because signed text was left
  unchanged):
  - fa `discernment28` day 6 uses «نماز» (Islamic ritual prayer) for "pray"
    (`term:prayer`, copy audit baseline);
  - fr `psalms42` mixes *Saint-Esprit* and *Esprit saint*;
  - zh `discernment28` mixes 祷告 (20×) and 祈祷 (3×);
  - ja `discernment28` mixes 悔い改め and 改心;
  - de `preparing21` mixes *Vergebung* and *Verzeihung*.
- **AI glossary.** `api/_aiGlossary.js` was regenerated with the new concepts.
  Redeploy the API for AI suggestions to use them.
- No database migration, no Edge Function change.

## Commands

```bash
npm run build:plan-review -- --lang de      # review page for native reviewers → reports/plan-review/de.html
npm run build:plan-review -- --all          # one page per translated language
npm run import:plan-review -- <file> [--dry-run]   # record a reviewer's downloaded review
npm run check:content                       # copy + plan-quality findings, records (CI)
npm run check:content -- --details          # every finding, including baselined ones
npm run check:content -- --sync-metadata    # create/refresh records; never grants a status
npm run check:content -- --write-baseline   # record current findings (review the diff)
npx vitest run src/content/plans/planQualityGate.test.js
npx vitest run src/content-quality/planChecks.test.js src/lib/planQuality.test.js
```
