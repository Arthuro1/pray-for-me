# Handoff — 13 new guided plans (state at 2026-09-24)

> **Status 2026-09-30: DONE.** All 13 plans are drafted, reviewed by the
> integrator and merged; all 13 resource researches are integrated (254
> candidates, all `needs_review`). Full suite, ESLint, check:locales,
> check:content and the build pass. What remains is HUMAN work only — see
> `docs/NEW_PLANS_2026-09-23.md` (review list, curator proposals). The rest of
> this file is the historical handoff from 2026-09-24.

Read this first if you are continuing this work. Everything below is
UNCOMMITTED on `main` (the owner asked for no commits). Nothing here is
approved: every new plan and resource stays review-gated.

## 1. The task

The owner (Paul = the user) asked for 13 new, fully authored guided
prayer/study plans on the existing plan engine (26 plans total), plus
exhaustive external-resource research, review gating, localization, tests and
docs. The full per-plan requirements are captured in `specs/<id>.md`; the
cross-cutting rules are in `AUTHORING_BRIEF.md` and `RESEARCH_BRIEF.md` (all in
this folder).

### Owner decisions (collected up front — do NOT re-ask)
1. Formation plans use the EXISTING `christian-living` resource domain (no
   `formation` domain). A new PLAN category `formation` ("Growing in Christ") exists.
2. Prose EN + FR only (`proseTranslations: []`); day titles + plan title/sub/
   movement names in all 16 languages (AI drafts, need native review).
3. Man/Woman of God: shared ground only; name the complementarian/egalitarian
   disagreement fairly where a text raises it; never adjudicate.
4. Holy Spirit: Pentecostal voice, other views named fairly, no "initial
   evidence" claim, never "no tongues = no Spirit".
5. Run straight through; 6. subagents allowed for research + drafts;
7. **leave everything uncommitted**; 8. resource research exhaustive: 15+
   verified candidates per plan across all 16 languages, all `needs_review`;
9. Paul-approved christian-living books that clash with a plan's guardrails
   are SHOWN and FLAGGED in review notes, not excluded.

### Hard rules
- Never write a sign-off (plan `review` or resource `contentReview`/
  `safetyReview`) — only a named human may. An AI must never attest approval.
- Never author/translate Bible text; store references only.
- Never fabricate a resource edition/URL/ISBN; open every URL before recording it.
- **Max ~4 parallel subagents.** 20 at once exhausted the usage window before
  anything was written. Agents must write incrementally (per movement/week)
  and resume from partial files.

## 2. What is done

### Shared infrastructure (all done, uncommitted)
- `src/content/prayerPlans.js` — `formation` category; all 13 plans imported
  and registered (display order within category = PLANS order).
- `src/content/resources/topics.js` — domains `intercession`, `care` added;
  19 new topics (intercession, evangelism, apologetics, persecution, prodigals,
  pregnancy, manhood, womanhood, fruit-of-the-spirit, spiritual-gifts,
  spirit-baptism, prophecy, psalms, lament, lords-prayer, justice, sabbath,
  church-hurt, spiritual-abuse).
- `src/lib/resources.js` — `church-hurt`, `spiritual-abuse`, `prophecy` added to
  `SENSITIVE_RESOURCE_TOPICS`.
- `src/content/reviews/pendingPlans20260923.js` — `pendingPlanReview(id)`:
  `status: 'needs_review'`, no reviewer, no date (plan visible only in preview).
- `src/components/PlanDayBody.jsx` — study-mode days now render `safetyNote`.
- `src/content/plans/testing/newPlanContract.js` — shared contract
  (`runNewPlanContract(plan, spec)`, `expectNoProseMatching`, `proseOf`).
- `src/content/resources/authorBooks.test.js` — christian-living shelf now
  allowed for formation plans only.
- `src/pages/PlansTab.test.jsx` — asserts published plans shown, drafts hidden
  in production.
- i18n: `planCategoryFormation` + keys of the 10 finished plans merged into all
  16 locales (copies of merged JSON in `i18n-merged/`).

### Plans DONE (reviewed by the previous assistant; own tests green)
| id | files (`src/content/plans/`) | days | category | domain | tests |
|---|---|---|---|---|---|
| fruit10 | fruitOfTheSpirit* | 10 | formation | christian-living | 17/17 |
| identity21 | identityInChrist* | 21 | formation | christian-living | 19/19 |
| kingdomCome14 | yourKingdomCome* | 14 | formation | christian-living | 19/19 |
| holySpirit21 | intimacyWithTheSpirit* | 21 | formation | christian-living | 21/21 |
| work21 | workAndCalling* | 21 | formation | christian-living | 22/22 |
| manOfGod21 | manOfGod* | 21 | formation | christian-living | 21/21 |
| womanOfGod21 | womanOfGod* | 21 | formation | christian-living | 23/23 |
| children21 | prayingForChildren* | 21 | relationships | relationships | 21/21 |
| prodigal30 | prayingForAProdigal* | 30 | others | intercession | 20/20 |
| unbelievers30 | prayingForUnbelievers* | 30 | others | intercession | 20/20 |

Each has `<file>.js` (meta), `<file>Days.js`, `<file>.test.js` and a reviewer
note `docs/plans/<id>.md`.

## 3. What remains (in order)

### A. Finish three plans (one agent each, ≤4 concurrent)
| id | files | state |
|---|---|---|
| psalms42 (study mode) | psalmsStudy.js / psalmsStudyDays.js | days 1–21 written (weeks 1–3, ends Psalm 88). Missing: weeks 4–6 (days 22–42), meta prose (still empty `intro/biblical/completion`), test file, `docs/plans/psalms42.md`, i18n JSON. |
| unborn21 | prayingForUnbornChild.js / …Days.js | only `prayingForUnbornChild.test.js` exists (fails: 0 days). Everything else to write. |
| churchHurt21 | healingFromChurchHurt.js / …Days.js | empty scaffold. Everything to write. Most safeguarding-critical plan; domain `care`. |

Agent prompt pattern that worked: "Read `docs/plans/_handoff/AUTHORING_BRIEF.md`
(follow 'Work economically and write incrementally') and
`docs/plans/_handoff/specs/<id>.md`; continue from any partial files; write
i18n JSON to `docs/plans/_handoff/i18n/<id>.json`; touch only your plan's
files; finish with `npx vitest run src/content/plans/<file>.test.js` (all
green except the locale-key test) and eslint." For psalms42 add: "days 1–21
exist; append week 4 (6, 25, 32, 38, 51, 103, 130), week 5 (1, 2, 15, 37, 72,
73, 82), week 6 (84, 107, 116, 118, 126, 131, 145 or 146); no
`wisdom-literature`/`david` topics." For unborn21 add: "prefer `pregnancy`/
`children`/`parenting` topics; check with resolveResources that no day pulls
adult-couple/dating books."

### B. Per finished plan: review + merge (the integrator's loop)
1. Review: `$env:SP="<any scratch dir>"; node docs/plans/_handoff/scripts/show-plan.mjs . <file>Days en`
   (prints every day; `SP` is only where bundles are written). Read the meta
   (`intro/biblical/completion`) too. Check theology, safety, promises, voice.
2. Merge UI keys: `node docs/plans/_handoff/scripts/merge-i18n.mjs . docs/plans/_handoff/i18n/<id>.json`
   (inserts after `"planCategoryStudy"` in all 16 locales; refuses duplicates),
   then move the JSON to `i18n-merged/`.
3. `npx vitest run src/content/plans/<file>.test.js` → must be fully green.

### C. Resource research (not started for any plan)
- Brief: `RESEARCH_BRIEF.md`; per-plan search terms/topics in `specs/<id>.md`.
- Output per plan: `src/content/resources/newPlans/<id>.js` (export
  `<ID>_CANDIDATES`, all `needs_review`, explicit `domains`) +
  `docs/resources/candidates/<id>.md` worksheet. Directories exist, empty.
- Domains: formation plans → `christian-living`; children21/unborn21 →
  `relationships` (children21 candidates MUST carry `children`, `parenting` or
  `family-discipleship` — its test enforces it); prodigal30/unbelievers30 →
  `intercession`; churchHurt21 → `care` (all sensitive); psalms42 → `bible-study`
  (no `wisdom-literature`/`david` topics).
- Then write an aggregator (e.g. `src/content/resources/newPlanResources.js`)
  importing all candidate files, de-duplicating ids across plans (merge
  domains/topics/editions), and spread it into `RESOURCES` in `catalogue.js`.
  Validate with `node docs/plans/_handoff/scripts/validate-resources.mjs .`
  (needs `SP` env var for its bundle dir; uses esbuild via npx).
- Existing-entry domain additions (e.g. `ortlund-gentle-and-lowly` → also `care`)
  only with a documented reason.

### D. Final integration
1. Full suite: `npx vitest run` — fix regressions (tests iterating `PLANS`).
2. `npx eslint . --quiet`, `npm run check:locales`, `npm run check:content`.
   `check:content` will report new "missing-copy" findings for the 14 fallback
   languages of the new plans (expected, same as wisdom42). Inspect them; if
   they are only fallback/missing-copy, run
   `node scripts/audit-copy.mjs --sync-metadata` then `--write-baseline`, and say
   so in the report. Fix real findings (e.g. Traditional chars in zh).
3. OG images: NOT needed (only reviewed plans get previews; api/planPreview.test.js).
4. Docs: write `docs/NEW_PLANS_2026-09-23.md` (overview for reviewers: table of
   all 13 plans, movements, domains, how to preview with `?planPreview=1`, how a
   human approves — replace `pendingPlanReview(id)` with a dated record like
   `paulWisdom20260908.js`, review flags below); add sections to
   `docs/PRAYER_PLANS.md` (formation category, contract test, study safetyNote)
   and `docs/RESOURCES.md` (new domains/topics, candidates); CHANGELOG entry
   under Unreleased/Added.
5. Final report to the owner (see the original request's §43 structure:
   implemented plans, resource research counts, architecture changes,
   theology/safety review list, localization status, commands run + results,
   remaining work).

## 4. Flags for human review (collect into the overview doc)
- Paul-approved christian-living books that surface on new plans and sit
  uneasily with their guardrails (shown + flagged per decision 9):
  Munroe kingdom titles on kingdomCome14 (days 3, 5, 6, 12, 14); Munroe
  *Man/Woman of Purpose and Power* (headship) on manOfGod21 (days 1, 2, 13) and
  womanOfGod21 — men's titles (incl. Poonen *Fifty Marks of Godly Men*) also
  appear on the women's plan; Poonen *Basic Christian Teachings* (marriage
  duties) on manOfGod21; Sanogo anointing titles on holySpirit21; Sanogo
  `blessing`/Munroe success titles on work21 and manOfGod21 day 15; Sanogo
  *Bénédiction de la fécondité divine* on womanOfGod21 (reads as fertility
  promise).
- Idea (not built, needs owner decision): show sensitive `marriage-roles`
  books only on days tagged `marriage-roles` — would change `src/lib/resources.js`.
- Theology calls: 2 Thessalonians 3:10 deliberately omitted from work21;
  Junia (Romans 16:7) left out of womanOfGod21 day 15; kingdomCome14 doxology
  and whether day 1 ("Our Father") needs a safety note; holySpirit21 day 18
  Spirit-baptism wording; identity21 day 5 Romans 7 framing.
- Technical: `Jude 1:20-21` (holySpirit21) and `Jude 1:24-25` (prodigal30) are
  the first single-chapter-book refs — check rendering in the verse reader.
  "Safeguarding lead" is UK wording — check it reads well elsewhere.
- Resource-topic wishes from agents (not added): other-faiths,
  deconstruction/doubt, union-with-christ, sermon-on-the-mount, a
  digital/media topic, a separate `family` domain (relationships domain is
  mostly couples/dating material).
- Native review: all non-EN/FR day titles, plan names and movement names
  (e.g. prodigal30 title avoids gendered "prodigal son").

## 5. Tooling notes
- In the previous session's last turn the Bash tool lost its PATH (mkdir/cp/grep
  "not found"); PowerShell worked. Use whichever works.
- Plan content modules import without extensions, so plain `node` can't import
  them; bundle with `npx esbuild <file> --bundle --format=esm --platform=node`
  (what `show-plan.mjs` does).
- The contract's locale-key test fails until a plan's i18n JSON is merged — by
  design.
- `scripts/scaffold-spec.json` is the spec the 13 scaffolds were generated from
  (ids, file names, export names, key prefixes, emojis, movements).
