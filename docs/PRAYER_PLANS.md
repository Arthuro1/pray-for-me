# Guided prayer plans

A guided plan is a journey of N days with a theme and a passage for each day.
Starting one creates **one ordinary recurring prayer** — nothing about a plan is
a separate engine, a separate session, or a separate history.

```
start a plan
  → addPrayer({ schedule: { type:'recurring', freq:'daily',
                            end:{ kind:'count', count:N },
                            plan:{ id, version, startDate } } })
  → planDayNumber(schedule, day)   numbers the days      (src/lib/schedule.js)
  → planDayContent(planId, n)      supplies the content  (src/content/prayerPlans.js)
```

Because a plan is a normal prayer, everything a prayer already does keeps
working: Pray now, the prayer session, prayer notes and voice notes, completion
and history, the calendar, catch-up, reminders, offline, and the ICS export.

---

## Where things live

| File | What it holds |
|---|---|
| `src/content/prayerPlans.js` | the `PLANS` registry, `PLAN_CATEGORIES`, `plansByCategory()`, `getPlan()`, `planDayContent()` |
| `src/content/plans/<plan>.js` | one rich plan's meta (intro, movements, completion) |
| `src/content/plans/<plan>Days.js` | that plan's day-by-day curriculum |
| `src/content/plans/translations.js` + `translations/<plan-id>/<lang>.json` | lazy per-plan, per-language overlays for plan **prose** |
| `src/lib/guidedPlan.js` | `planById()`, `buildGuidedPlanPrayer()` — shared by Plan tab, invitations, group plans |
| `src/lib/planner.js` | `runningPlanIds()` / `runningPlanProgress()` — which plans are running, and which day each has reached |
| `src/lib/planPrefs.js` | fixed-choice, device-local singles personalization answers |
| `src/lib/planPersonalization.js` | couple-plan personalization and safe name interpolation |
| `src/lib/planPersonalizationStorage.js` | per-account/per-run AES-GCM storage for optional couple names and family choices |
| `src/lib/planReview.js` | production publication gate for theological, safety, and all-locale sign-offs |
| `src/hooks/useLocalizedPlan.js` | folds a language overlay into a plan / one day |
| `src/hooks/usePlanDay.js` | one screen's worth: the day + the reader's role + resolved resources |
| `src/components/PlanDayBody.jsx` | renders a rich day's reflection, prompts, practice, "Go deeper" |
| `src/components/PlanDetailModal.jsx` | the read-before-you-commit preview |
| `src/components/PlanPersonalizeModal.jsx` | the slim singles pre-start choices and the reopenable couple personalization sheet |
| `src/components/PlanCompletionCard.jsx` | the close, and "continue praying" |

---

## The day model

Only `theme` and `ref` are required. Every other field is optional, which is why
the older plans (theme + verse) render exactly as they always did.

```js
{
  theme:          { en, fr, …16 languages },   // short day title
  ref:            'Colossians 1:9-12',         // PRIMARY passage
  related:        ['Philippians 1:9-11'],      // ≤3, kept visually secondary
  movement:       'intercede',                 // which movement this day is in
  reflection:     { en, fr },                  // 2-4 sentences of OUR commentary
  prompts:        [{ en, fr }, …],             // short prayer prompts
  spousePrompt:   { en, fr },                  // pray for spouse/fiancé(e)
  selfPrompt:     { en, fr },                  // the "also pray for yourself" mirror
  marriagePrompt: { en, fr },                  // pray for the relationship/covenant
  conversationPrompt: { en, fr },              // optional "Talk together"
  prayTogether:   { en, fr },                  // optional shared instruction
  practice:       { en, fr },                  // one small optional response
  safetyNote:     { en, fr },                  // contextual safeguarding copy
  withChildren:   { childPrompt: { en, fr } }, // additive; omitted without children
  roles:          { husband: { en, fr, ref? }, // optional, opt-in only
                    wife:    { en, fr, ref? } },
  resourceTopics: ['future-spouse', 'prayer'], // taxonomy ids for "Go deeper"
}
```

### Scripture rule

**Bible text is never authored, translated or generated in this repo.** A day
stores a *reference*; the text is resolved at render time through the existing
authoritative pipeline (offline bundle → shared cache → YouVersion), and falls
back to a link into the reader's own Bible when no authoritative edition is
available. `usfmFromReference()` must resolve every reference a plan ships —
`src/content/plans/preparingInPrayer.test.js` asserts this for all 21 days,
their related passages and their role passages.

A reference's book name must exist in `BOOK_NAMES` (`src/content/dailyVerses.js`)
for the citation to localize; add the book there if it is missing (this feature
added `MIC`).

### The three kinds of text

They stay visually distinct on purpose, so nothing of ours is ever mistaken for
Scripture:

1. **Bible text** — only ever inside a `VersePill` / `VerseAccordion` panel.
2. **Pray4Me reflection** — prose.
3. **Prayer prompts** — a bulleted list. They may paraphrase biblical themes;
   they are never presented as quotations.

---

## Localization

Three layers, each with its own reason:

| Layer | Where | Languages |
|---|---|---|
| Plan title, subtitle, movement names, all section labels, onboarding, completion, resource labels | `src/i18n/locales/*.js` | **all 16**, CI-gated by `npm run check:locales` |
| Day titles (`theme`) | inline in the day file | **all 16**, authored |
| Day prose (reflection, prayer directions, conversation/practice, safety, roles) + intro/biblical/completion body | source `en` + `fr`, plus `src/content/plans/translations/<plan-id>/<lang>.json` | **all 16** — en + fr authored in source, the other 14 are review-pending drafts |

Overlay shape (keyed by plan id, days matched **by position**):

```json
{
  "marriage30": {
    "intro": "…", "biblical": "…", "completion": "…",
    "days": [
      { "reflection": "…", "prompts": ["…","…","…"],
        "spousePrompt": "…", "selfPrompt": "…", "marriagePrompt": "…",
        "conversationPrompt": "…", "prayTogether": "…", "practice": "…",
        "roles": { "husband": "…", "wife": "…" } }
    ]
  }
}
```

`src/content/plans/translationFiles.test.js` validates every overlay against the
authored plan (day count, prompt count, no unknown fields, no Scripture), so a
mis-positioned translation is a build failure rather than a quiet content bug.

An overlay file is scoped to one PLAN and one LANGUAGE, and the loader fetches
one only when the plan says that language is **ready**:

- `proseTranslations: true` — every language with an overlay file is served.
- `proseTranslations: ['de', 'es']` — only those are; the rest fall back.
- `proseTranslations: []` — none are, though the files may exist.

The list is a statement about QUALITY, not about which files are on disk. An
overlay that exists but is still a structural stub belongs out of the list: a
file's presence is not evidence that it is worth reading, and once folded in by
`mergePlan` it *displaces* the authored en/fr prose, so a stub is worse than no
overlay at all. `src/content/plans/translationQuality.test.js` enforces this for
every language a plan declares ready — it rejects an overlay that reuses one
day's wording where the source differs, or whose values are one template with
the day title slotted in.

Ids, Scripture references, movements and `resourceTopics` stay in the source and
are **never** translated, so the journey is structurally identical in every
language. A missing overlay, day or field simply keeps its
authored en/fr value — a partially translated plan is never blank or broken.

`scripts/prune-overlay-duplicates.mjs` removes values an overlay repeats where
the source does not, so the field falls back rather than saying the same thing
five days running.

---

## Versioning

A plan carries `version`, and every newly started prayer pins it in
`schedule.plan.version`. `getPlan(id, version)` resolves that exact release and
fails closed if it is unavailable; retain older releases in the plan's
`versions` archive while any prayer can reference them. Bump the version whenever a day's **meaning** changes (a
different passage, a reworked reflection, a corrected prompt). Do **not**
renumber days, change `id`, or reorder the array of a plan that is live: a
running plan is a prayer whose `schedule.plan.startDate` maps a calendar date to
a day number, and its completion history is keyed to that prayer. Typo fixes and
translations do not need a bump.

If a plan must change shape (more or fewer days), ship it as a **new plan id**
and retire the old one from `PLANS` once no one can still be running it
(`end.count` days after the last possible start).

---

## Adding a plan

1. Author the content (`src/content/plans/`), day titles in all 16 languages.
2. Give it a `category` from `PLAN_CATEGORIES` and add it to `PLANS`.
3. Add its i18n keys (title / subtitle / movements / any theme keys) to **all
   16** locales — `npm run check:locales` fails CI otherwise. A plan written for
   one life stage says so **in its own title** (see the catalogue in
   `docs/RELATIONSHIP_FAMILY_PLANS.md`); there is no separate audience line.
4. If you ship prose overlays for it, list the languages that are genuinely
   translated in `proseTranslations` (or `true` once they all are).
5. If it can be tailored, set `onboarding` and extend the matching preference
   module. A singles plan may ask a short, optional pre-start choice only when it
   affects day one; couple details stay reopenable on the running plan. Only add
   a question that changes something the reader will actually see.
6. If it wants analytics, declare `analyticsEvents` with names that exist on the
   `EVENTS` allowlist in `src/lib/analytics.js` (they are plain strings in the
   content file so it stays free of app imports).
7. Add content tests. `preparingInPrayer.test.js` is the template.

---

## "Preparing in Prayer" (`preparing21`)

A 21-day plan for single believers: grow in Christ in the season they are
actually in, prepare their own character, pray for a person they may one day
marry, and entrust the outcome to God.

**Four movements** — Rooted in God (1–5), Becoming (6–10), Praying for a
possible future spouse (11–17), Building and surrendering the future (18–21).

### The guardrail

The plan must never promise marriage, and must stay worth praying if the reader
never marries. In practice:

- it speaks of "a possible future marriage" and "the person you may one day
  marry" — never "your future husband/wife", "your spouse", "the one";
- days 11–17 pray for someone the reader does not know, and **every one of them
  mirrors the same prayer back onto the reader**;
- it opens (day 1, Psalm 73:25–26) and closes (day 21, Matthew 6:33–34) with God;
- day 19 says plainly that not every marriage has children, that not everyone
  who longs for them can have them, and that no marriage is incomplete without
  them;
- day 7 points to a pastor or counsellor where that is the right help, and does
  not attempt therapy;
- day 8 frames purity as honour rather than shame, and names forgiveness.

`preparingInPrayer.test.js` enforces the forbidden phrasings in code.

### Personalization (optional, device-local, before each new run)

Before **Start**, one compact sheet offers two optional choices:
**husband/wife reflections** (defaulting to *keep the plan general*) and
**growth areas** (folded away). Previous answers prefill the sheet, and both can
still be changed later from the running plan.

The old version used four questions behind that sheet. A
**season** was collected, stored and read by nothing at all; an **emphasis** did
one thing only — pre-tick the boxes on the completion card three weeks later,
which is where that question is asked now. Both are gone, along with their copy
in all 16 locales. A question that changes nothing a reader sees does not belong
in front of a prayer.

The answers are stored in `localStorage` under `pfm_plan_prefs` as short ids from
fixed lists — no free text, no server row, nothing in analytics. They **only
add**: they choose which optional reflection is shown and which approved
resources rank first. The 21 days are identical for everyone. An *absent* role
means the question has not been put yet, which is what lets the inline question
be asked once and then stop.

The husband/wife question is **asked out loud** and never inferred from a name,
a profile photo, pronouns or any other signal. Role reflections appear on 5 of
21 days, add at most one extra passage, and never replace a day's Scripture,
prompts or structure. Where Christian traditions differ on marriage roles, the
plan keeps to what they share — Christlike love, humility, service,
faithfulness, repentance, wisdom, responsibility — and does not adjudicate the
disputed questions.

### Completion

After day 21 the prayer's series ends, which releases the plan (it can be
started again) and surfaces `PlanCompletionCard` on the prayer's detail page. It
names what the reader did, promises nothing, and offers one optional step:
carry selected themes on as ordinary recurring prayers (`defaultNewSchedule()`),
pre-ticked from the emphases chosen at the start.

### Analytics

`singles_plan_started`, `singles_plan_day_completed`, `singles_plan_completed`,
`resource_opened` — all content-free, all on the `EVENTS` allowlist, all
emitted with no properties. The day event fires from `markPrayedOn` in the store
(one place, so it covers the session, the detail page and the agenda).

---

## Content review before shipping a plan

1. Read every Scripture reference **in context**.
2. Review the reflections for theological accuracy.
3. Review the prayer prompts.
4. Check that marriage is never implicitly promised.
5. Check that singleness reads as a full Christian life, not a waiting room.
6. Check the purity/sexuality wording for shame.
7. Review the role-specific reflections against `docs/I18N_REVIEW.md` *and* with
   whoever owns doctrine for this app.
8. Review all 16 translations for **meaning**, not just key parity.

New plans remain visible only in development preview until `review.status`,
theology review, safety review, and every locale sign-off contain an approved
status, a named reviewer, and an ISO date. Draft role material has its own gate.

See `docs/RESOURCES.md` for the separate review the "Go deeper" catalogue needs.
See `docs/RELATIONSHIP_FAMILY_PLANS.md` for the engaged/married implementation,
privacy boundary, optional child layer, and release checklist.
