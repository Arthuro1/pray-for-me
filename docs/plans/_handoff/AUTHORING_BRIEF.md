# Authoring brief — Praystead guided plans drafted 2026-09-23

You are drafting ONE complete guided prayer/study plan for Praystead, a Christian
prayer app (React/Vite). The repo is at
`C:/Users/T480s/Desktop/Ministry/projets/pray_for_me` (Windows; the Bash tool is
Git Bash — use forward slashes). Twelve other agents are drafting the other
plans in parallel, so **touch only your own files** (listed below).

The product owner is a Pentecostal/charismatic ministry leader. The content will
be reviewed by humans (theology + safety) before anyone sees it; your job is to
give them a draft that is excellent, biblically careful and safe — not a shell.

## Your deliverables — ONLY these files

1. `src/content/plans/<file>Days.js` — `export const DAYS = [...]` (N day objects).
2. `src/content/plans/<file>.js` — already scaffolded. Fill `intro`, `biblical`
   (`{ ref, text: { en, fr } }`) and `completion`. Keep `id`, `version`, `count`,
   `emoji`, `category`, `mode`, `resourceDomains`, `titleKey`, `subKey`,
   `proseTranslations: []`, `review`, the `MOVEMENTS` ids/ranges/titleKeys
   EXACTLY as scaffolded. Replace the one-line "DRAFT" header with a real header
   comment stating the plan's purpose and its guardrails (model:
   `src/content/plans/preparingInPrayer.js`).
3. `src/content/plans/<file>.test.js` — see "Tests" below.
4. `docs/plans/<id>.md` — reviewer-facing research note (see below).
5. `docs/plans/_handoff/i18n/<id>.json`
   — the UI keys (see "i18n keys").

Do NOT edit anything else: not `prayerPlans.js`, not `src/i18n/locales/*`, not
`topics.js`, not the catalogue, not other plans, not shared tests. If you think a
shared file needs a change (e.g. a missing resource topic), say so in your
research note's "Outstanding questions" and in your final message.

## Work economically and write incrementally (IMPORTANT)

A shared usage limit stopped a previous attempt before anything was written.
So:

- Read ONLY what is listed below, and only the line ranges given. Do not
  explore the repo further unless something is genuinely unclear.
- FIRST check whether your files already hold content from an interrupted run
  (`<file>Days.js`, the meta file, the test, the research note, the i18n JSON).
  If they do, continue from where they stop — do not start over.
- Write the Days file IN CHUNKS: create it with the days of the first movement
  (a complete, valid `export const DAYS = [ … ];`), then append each following
  movement with Edit (insert before the closing `];`). Keep the file valid after
  every write. Then the meta prose, then the i18n JSON, then the test, then the
  research note. Never hold more than one movement unwritten.
- Keep web lookups to checking verse ranges you are unsure of.

## Read first (only these)

- `docs/content/STYLE_GUIDE.md` (whole, short)
- `src/content/plans/preparingInPrayerDays.js` lines 1–110 — the prayer-mode
  exemplar (voice, length, prompts, selfPrompt, practice)
- Study mode (psalms42 only): `src/content/plans/davidHeartDays.js` lines 1–60
  and `src/components/StudyDayGuide.jsx`
- `src/content/plans/testing/newPlanContract.js` — the contract you must pass
- `src/content/resources/topics.js` lines 1–140 — `RESOURCE_TOPICS` is the ONLY
  allowed set for `resourceTopics`
- your scaffolded meta file `src/content/plans/<file>.js`
- glossary files only if you are unsure of a term:
  `src/content-quality/glossary/<lang>.json`

## Day shape — prayer mode

```js
{
  movement: 'rescued',                       // the scaffolded movement id for this day
  theme: { en, fr, es, pt, de, ru, zh, ja, ko, ar, fa, hi, id, sw, tl, am },
  ref: 'Ephesians 2:1-10',                   // PRIMARY passage
  related: ['Colossians 2:13-14'],           // 0–3 supporting passages
  reflection: { en, fr },                    // 2–4 sentences, ~50–90 words EN
  prompts: [{ en, fr }, { en, fr }, { en, fr }],  // exactly 3 (2–4 allowed)
  selfPrompt: { en, fr },                    // optional — see below
  practice: { en, fr },                      // required: one small concrete action
  safetyNote: { en, fr },                    // only where needed
  resourceTopics: ['identity', 'gospel'],    // 1–4 ids from RESOURCE_TOPICS
}
```

- A local helper `const L = (en, fr) => ({ en, fr });` is fine.
- Do NOT use `readingRefs` (it only renders in the discernment plan), `verseText`,
  `scriptureText` or `text` on a day.
- **reflection**: one spiritual point, drawn from the passage read in context.
  It must contribute something (a contrast, a detail of the text, a connection)
  — never a restatement of the title. No "Today we reflect on…".
- **prompts**: each one actually leads into prayer ("Thank God that…", "Ask Him
  to…", "Pray for…", "Tell Him honestly…"). One sentence, ≤ ~30 words. They may
  paraphrase biblical themes; they are never presented as quotations.
- **selfPrompt**: "Also pray for yourself" mirror. REQUIRED on every day of the
  intercession plans (children21, unborn21, prodigal30, unbelievers30): turn the
  day's prayer back on the one praying. Optional elsewhere — use only when it adds.
- **practice**: one small optional action for today, concrete (who/what/when),
  1–2 sentences. Not "reflect on X".
- **safetyNote**: calm and plain; points to real help (pastor, trusted mature
  believer, counsellor, doctor/midwife, safeguarding lead, police/emergency
  services) where relevant; never alarmist, never diagnostic, never tells anyone
  to stay in danger. Use only on days that need one (plan spec says which topics).
- **resourceTopics**: precise to the day, 1–4 ids. Use the plan's suggested
  topic set below where it fits (the resource researchers use the same set).

## Day shape — study mode (psalms42 only)

```js
{
  movement, theme: {16}, ref: 'Psalm 13', related: ['Psalm 6'],
  reflection: { en, fr },            // 3–5 sentences framing the study
  study: {
    context:  { en, fr },            // collapsible literary/historical context (superscription, genre, NT use)
    tension:  { en, fr },            // counterpoint: what NOT to generalize / misreadings to avoid
    questions: [{ en, fr }, …],      // 3 (2–4): observation → meaning → prayer/application
    synthesis: { en, fr },           // a written note / practical response to record
    prayer:   { en, fr },            // short optional prayer, in the Psalm's own movement
  },
  safetyNote: { en, fr },            // on despair/imprecation days where needed
  resourceTopics: ['psalms', 'lament'],
}
```
Study days have no `prompts`/`practice`/`selfPrompt` (they don't render there).

## Scripture rules (hard)

- Store REFERENCES only. Never write Bible text in any field. Do not quote
  Scripture in prose either — say in your own words what the passage says and
  cite it. (A 2–4 word phrase is tolerable only when unavoidable, e.g. naming
  "Abba".)
- Reference format that the parser accepts (`src/lib/bibleRef.js`):
  `Book C` · `Book C:V` · `Book C:V-V` (ASCII hyphen). NOT accepted: chapter
  ranges (`Psalm 42-43` → use `ref: 'Psalm 42'`, `related: ['Psalm 43']`),
  cross-chapter ranges (`John 14:15-15:5`), lists (`Romans 8:1, 11`), `ff`,
  letters (`3a`), en-dashes. Book names as in `ENGLISH_BOOKS` in bibleRef.js;
  write `Psalm 23` (singular) for one psalm; `1 Corinthians`, `Song of Songs`.
- READ EVERY PASSAGE IN CONTEXT before using it. You may open e.g.
  `https://www.biblegateway.com/passage/?search=Galatians+5&version=NIV` (read
  only; never paste text into the repo). Check the verse range really says what
  your reflection claims; check verse numbers exist.
- Distinguish narrative (what happened) from instruction (what to do). Proverbs
  describes wisdom and its usual fruit — never guarantees. Do not generalize a
  unique calling (e.g. Jeremiah 1:5) into a promise for every reader. No
  proof-texting. Where interpretation is materially disputed, say so briefly and
  fairly, and put the detail in the research note.

## Voice & theology

- Warm, plain, Christ-centred, Scripture-first. Pentecostal/charismatic
  vocabulary is welcome (the Spirit's present work, being filled with the Spirit,
  prayer and fasting, testimony) in words other evangelicals recognise.
- **Praystead never speaks for God.** Never "God told you", "God is telling you",
  "God says to you", "God wants you to know that…" as if the app were a prophet.
  Prefer "you may sense…", "consider prayerfully…", "test this…". Describing what
  Scripture says God has promised is fine ("In Christ there is no condemnation").
- Never promise outcomes: healing, conversion, a prodigal's return, a pregnancy
  outcome, marriage, career success, spiritual experiences, certainty. Prayer is
  trust, not leverage. Faithful prayer never guarantees a particular result.
- Preserve consent, uncertainty, dignity. Never replace pastoral, medical,
  psychological, legal or safeguarding help.
- No self-help or generic self-esteem framing: ground identity and change in
  grace, union with Christ, the Spirit's work, the church.
- Avoid template repetition across days; the reader should notice a progression
  through the movements. Vary sentence openings and prompt verbs.
- No "(s)" plurals ("child(ren)" ✗). No filler.
- French: **tu** in all devotional prose (intro, reflections, prompts, practice,
  safety notes, completion). Idiomatic French, not calqued English; Bible book
  names in French when mentioned in prose ("Galates 5", "Psaume 23", "Actes 2");
  French punctuation spacing before `: ; ? !` and « guillemets » as in the
  existing FR prose. Terms per `glossary/fr.json` (e.g. "Saint-Esprit",
  "intercession", "sujet de prière", "action de grâces").

## Day titles (theme) in 16 languages

Short (EN ≤ ~45 chars), specific to the day, all 16 languages: en, fr, es, pt,
de, ru, zh (SIMPLIFIED Chinese only — the test rejects Traditional characters),
ja, ko, ar, fa, hi, id, sw, tl, am. German uses **du**; French uses tu/imperative.
Use each language's usual church vocabulary (glossary files). They are AI drafts
that will get a native review — still make them natural.

## i18n keys (scratch JSON)

Write `docs/plans/_handoff/i18n/<id>.json`:
```json
{
  "plan<Prefix>Title": { "en": "...", "fr": "...", …all 16 },
  "plan<Prefix>Sub":   { …16 },
  "plan<Prefix>Movement<Id>": { …16 }   // one per scaffolded movement titleKey
}
```
Use exactly the `titleKey`/`subKey`/movement `titleKey` strings in your
scaffolded meta file. Title: the plan's name (≤ ~40 chars EN; a life-stage plan
says its audience in its own title). Sub: one short line, e.g. "21 days of
prayer for the children in your life". Look at `planWisdomTitle`,
`planPreparingTitle`, `planPreparingMovementRooted` in `src/i18n/locales/en.js`
and `fr.js` for tone. Values must be non-empty strings in all 16 languages.

## Plan meta prose (EN + FR)

- `intro`: 3–6 sentences — what the journey is, who it is for, roughly how long a
  day takes, and what it does NOT promise.
- `biblical`: `{ ref, text }` — the Scripture foundation of the plan in 3–5
  sentences of commentary citing references (no quotation).
- `completion`: 3–5 sentences — names what the reader did, promises nothing,
  suggests one way to continue praying.

## Tests — `src/content/plans/<file>.test.js`

```js
import { describe, it, expect } from 'vitest';
import { PLAN_EXPORT as plan } from './<file>';
import { runNewPlanContract, expectNoProseMatching, proseOf } from './testing/newPlanContract';

runNewPlanContract(plan, {
  id: '<id>', count: N, category: '<category>', mode: 'prayer', // or 'study'
  domains: ['<domain>'], movements: ['<movement ids in order>'],
});

describe('<id> guardrails', () => {
  it('never promises …', () => {
    expectNoProseMatching(plan, [/…EN regex…/i, /…FR regex…/i]);
  });
  it('carries a safety note on the days that need one', () => { … });
  // plus any positive assertions your plan spec demands (e.g. a day names
  // spiritual dryness; the opening and closing days point to Christ; …)
});
```
Write regexes that catch the dangerous phrasing without tripping on your own
safe negations (e.g. "this does not guarantee" is fine; test for
"will guarantee"/"guarantees that", "God will surely", "promise(s) you a …").

Run ONLY your file: `npx vitest run src/content/plans/<file>.test.js`.
Everything must pass except the single test named "has its title, subtitle and
movement names in all sixteen locales" — it fails until the integrator merges
your i18n JSON. That is expected; do not edit locale files. If an import error
comes from ANOTHER plan's file (another agent mid-write), wait a minute and
re-run; never touch their file. Also run
`npx eslint src/content/plans/<file>.js src/content/plans/<file>Days.js src/content/plans/<file>.test.js`.

## Research note — `docs/plans/<id>.md`

Concise and reviewer-facing (not an academic paper):
1. Status line: "Drafted with AI assistance on 2026-09-23. Not reviewed by a
   human. EN and FR authored; the other 14 languages show AI-drafted day titles
   and fall back to English prose."
2. Purpose and audience.
3. Structure: a table day → movement → theme (EN) → ref → related → resourceTopics.
4. Major passages considered; passages rejected and why.
5. Interpretive issues and theological disagreements, and how the text handles them.
6. Safety concerns and how the text handles them (name the days with safety notes).
7. Resource topics chosen and why.
8. What the human theology reviewer and safety reviewer must check (bullets).
9. Outstanding questions.

## Final message to the integrator

≤ 200 words: what you wrote, test result (passed/failed counts), anything you
could not resolve, any resource topic you wished existed.
