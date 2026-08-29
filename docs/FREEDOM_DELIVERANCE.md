# Freedom & Deliverance in Christ (`freedom30`)

A 30-day Scripture-centred journey of prayer, repentance, renunciation,
spiritual warfare and walking in freedom through Jesus Christ, written from an
African/Pentecostal deliverance perspective and held inside strict
non-diagnostic boundaries.

It runs on the **existing** guided-plan engine (`docs/PRAYER_PLANS.md`). Starting
it creates one ordinary recurring daily prayer capped after 30 occurrences, so
Pray now, the prayer session, prayer notes and voice notes, completion history,
the calendar, catch-up, reminders, offline and the ICS export all keep working
untouched. There is no parallel prayer, Scripture, media or resource system.

> **Release status: not shippable yet.** `review.status` is `needs_review`, so
> `canUsePlan()` keeps the plan out of a production build entirely. It is visible
> in a development preview so it can be reviewed. See § Release checklist.

---

## The theological model

```
The Word of God defines truth.
The Holy Spirit applies the Word personally.
The believer responds through repentance, faith, renunciation, prayer and obedience.
Jesus Christ remains the foundation and the centre of freedom.
```

Stated in the plan's own words:

> We do not search anxiously for hidden demons or unknown covenants. We search
> the Word of God, submit ourselves to Christ, invite the Holy Spirit to search
> us, repent where Scripture calls for repentance, renounce known or relevant
> spiritual allegiances contrary to Christ, resist evil, and stand on God's Word.

The spiritual centre is **Christ** — never demons, Satan, curses, ancestors,
spiritual enemies, manifestations or deliverance ministers. The plan opens at the
cross (day 1, Colossians 2:13-15) and closes in the vine (day 30, John 15:1-11),
and `freedomInChrist.test.js` asserts that Christ, God and the Holy Spirit are
named more than twice as often as everything that opposes them.

---

## What the app may and may not say

**May**: explain commonly recognised categories within African/Pentecostal
deliverance teaching, give illustrative examples, guide biblical
self-examination, offer Scripture-centred prayers, and record what a reader
voluntarily chooses to write.

**May never** claim that a particular demon is present, that a curse definitely
exists, that an ancestor definitely made a covenant, that a dream proves
bondage, that a life problem proves a curse, that the Holy Spirit revealed
something *through this app*, or that any illness, delay, financial difficulty,
fertility problem, relationship breakdown, mental-health condition or recurring
hardship is demonic.

These are enforced as a regex corpus check over every day, example, explanation
and prayer module (`freedomInChrist.test.js` → *"Praystead guides; it never
diagnoses"*).

---

## Where things live

| File | What it holds |
|---|---|
| `src/content/plans/freedomInChrist.js` | plan meta, the five movements, continue themes, look-back questions, the release gate |
| `src/content/plans/freedomInChristDays.js` | the 30-day curriculum |
| `src/content/plans/freedom/prayerModules.js` | the 17 reviewed guided-prayer modules |
| `src/content/plans/freedom/certainty.js` | the five certainty levels and the three remembrance answers |
| `src/lib/freedomSession.js` | `buildGuidedSession(day, certainty)` — deterministic assembly |
| `src/components/deliverance/DeliveranceDayGuide.jsx` | the day layer: explanation, examples, Holy Spirit invitation, inventory, mode choice |
| `src/components/deliverance/GuidedPrayerSteps.jsx` | the one-step-at-a-time prayer walk |
| `src/content/resources/deliveranceBooks.js` | the candidate resource worksheet (all unpublished) |

---

## The day model

`theme` and `ref` are required; everything else is optional, so the older plans
render exactly as before. Beyond the shared day fields
(`reflection`, `prompts`, `practice`, `related`, `safetyNote`, `resourceTopics`),
a deliverance day carries one extra namespaced layer:

```js
freedom: {
  understand:  { en, fr },        // "What this can mean" — the category defined plainly
  examples:    [{ en, fr }, …],   // ILLUSTRATIVE, introduced as "Examples can include"
  inventory:   true,              // ask what the reader actually KNOWS
  modules:     ['practicalObedience'],  // extra reviewed modules for the guided walk
  stepText:    { bringBeforeGod: { en, fr } },  // this day's wording for an overridable step
  standRefs:   ['1 Corinthians 10:14-22'],      // what "Pray the Word" points at
  fasting:     true,              // offer the optional fast-and-pray note
}
```

Constraints, all test-enforced:

- A day may only name modules in `DAY_EXTRA_MODULES` and may only reword steps in
  `OVERRIDABLE_STEPS` — the invitation, the confession of Christ, repentance and
  renunciation are identical everywhere they run.
- A day with an inventory must have both an `understand` explanation and
  `standRefs`. No renunciation is published without Scripture metadata.
- Bible text is never authored, translated or generated. Every `ref`, `related`,
  `standRefs` entry and module `refs` entry must resolve through
  `usfmFromReference()`; the text is fetched by the existing authoritative
  pipeline. `EZK` was added to `BOOK_NAMES` for this plan.

---

## The three kinds of text

Kept visually distinct so nothing of ours is ever mistaken for Scripture:

1. **Bible text** — only ever inside a `VersePill` / `VerseAccordion` panel.
2. **Praystead guided prayer, based on Scripture** — labelled with that exact
   phrase above every step body in the guided walk.
3. **Reflection** (prose) and **prayer points** (a bulleted list) — these may
   paraphrase biblical themes and are never presented as quotations.

---

## The Holy Spirit guidance model

Every deliverance day begins with the same authored invitation
(`PRAYER_MODULES.inviteSpirit`, citing Psalm 139:23-24, John 16:13, Romans 8:14,
John 14:26), then gives the reader quiet space:

```
Take a moment before God.
Did anything specific come to mind?

[ Add a private prayer note ]  [ Nothing specific ]  [ I'm not sure ]
```

- "Add a private prayer note" opens the **existing** note composer (an
  `openSignal` counter on `PrayerSessionNote` in the session; `focusUpdateField`
  on the detail page). No parallel notes system, and the note keeps the existing
  encryption, voice recording and update-history behaviour.
- "Nothing specific" and "I'm not sure" are complete answers, and the app says so
  out loud: *"You do not need to force yourself to remember or discover
  something."*
- Praystead **records** what the reader chooses to say. It never interprets it,
  never says what it means, and never claims God revealed anything through the
  app. Notes are not analysed.

---

## The inventory and certainty model

`inventory: true` asks one question — *"What best describes what you know?"* —
with five distinct answers:

| id | Reader says | Guided prayer becomes |
|---|---|---|
| `personal` | I personally participated | bring → **repent** → **renounce** |
| `known_family_history` | I know this occurred in my family | bring the family history → renounce *continuing agreement* (no personal guilt) |
| `reported_family_history` | I have been told this may have occurred | bring what you were told → refuse fear (no confession of guilt) |
| `uncertain` | I'm concerned but I don't know | entrust the unknown → refuse fear |
| `none` | Not applicable | no category module at all; the day is still a complete prayer |
| *(unanswered)* | — | the general form: bring this before God |

This distinction is **mandatory** and is the whole reason the model exists:
Ezekiel 18:19-20 means a reader must never be handed guilt for an ancestor's
action, and a plan that treated all five identically would invite people to
invent a family history in order to have something to confess.

**Unknown history leads to trust, not investigation.** Nothing in the plan
recommends interrogating relatives, paying a minister to uncover secrets,
attempting divination, reading dreams as evidence, or constructing hypothetical
ancestral events. Day 11's practice says so explicitly.

---

## Family-line categories (days 11–20)

Four things are kept apart on purpose: **personal guilt**, **family history**,
**learned/destructive patterns**, and **Pentecostal teaching about spiritual
family influence**.

| Day | Category | Notes |
|---|---|---|
| 11 | My family history before Christ | 1 Peter 1:18-19 with Ezekiel 18:19-20; introduces the whole movement |
| 12 | Family ancestral and spirit worship | Joshua 24:14-15; states that heritage is never bondage |
| 13 | Family dedications and initiations | asks only what is answerable |
| 14 | Family covenants, oaths and vows | a recurring problem is *not* evidence a covenant exists |
| 15 | Family shrines, altars and objects | an object is not evil for being old, traditional, African, artistic or inherited |
| 16 | Curses and spoken pronouncements | an insult or an angry word is not a supernatural curse |
| 17 | Family occult and divination history | **never accuse a relative of witchcraft** (safety note) |
| 18 | Names, ceremonies and dedications | a name is never condemned for its language, ethnicity or origin |
| 19 | Destructive generational patterns | a separate category from curses, deliberately |
| 20 | Standing free: the family line in prayer | gathers; introduces **no** new category |

Culture is never equated with idolatry. Wherever traditional or African practice
is discussed, the day names the actual criterion — explicit worship, invocation,
dependence or spiritual allegiance contrary to Christ — and says plainly what is
*not* in view. Tested.

---

## Prayer-module architecture

Guidance is assembled from 17 authored, reviewable modules rather than generated:

```
inviteSpirit → confessChrist → [thanksCross] → «category» → [forgive]
  → prayTheWord → standInChrist → askFilled → thanksgiving → [practicalObedience]
```

`buildGuidedSession(day, certainty)` is a pure function of those two inputs. It
contains no model call, no inference and no notion of "likely". The order is
biblical rather than dramatic: God is invited, Christ confessed, the matter
brought into the light, **repentance before renunciation**, Scripture prayed, the
reader filled, and the prayer closed in thanksgiving and one practical step.
Warfare language, where it appears, follows submission (James 4:7) — never
precedes it. Duplicates are removed, and every session is 6–12 steps.

This is **personalization, not diagnosis**: the app composes reviewed modules
from what the reader volunteered. It never concludes anything.

### Renunciation is not a magic formula

`renouncePersonal` says so in its own body — *"This is not a formula; it is my
will, and I ask You to make it my practice as well."* — and renunciation days
carry `practicalObedience`, which asks for one step the reader will actually take
this week. The plan never suggests that volume, repetition or exact wording is
what does the work.

### Future audio

Each step is already a discrete, ordered unit with its own text and a natural
pause at the step boundary, so a later "Listen & pray along" / "Repeat after me"
feature drops in without changing the shape. **The text version must always
remain fully usable on its own**, and audio must never be required to finish a
step, a day or the plan.

---

## Daily UX

Progressive disclosure — never everything expanded at once:

```
Day 14 of 30 · Family covenants, oaths and vows

Scripture   [primary passage]  Read passage →
Understand  [reflection]
▸ What this can mean            ← folded; opens to the definition + examples
Invite the Holy Spirit          ← the prayer, its passages, and the quiet space
What best describes what you know?   ○ ○ ○ ○ ○
How would you like to pray?     Guide me · Recommended | Prayer points | Pray freely
▸ Go deeper                     ← approved resources, or absent
```

`Guide me` opens the step dialog. `Prayer points` reveals the day's prompts
inline. `Pray freely` leaves the reader with the passage and the subject.

---

## Resource mappings and review

Topics added for this plan: `deliverance`, `spiritual-warfare`, `holy-spirit`,
`repentance`, `renunciation`, `covenants`, `curses`, `altars`, `occult`,
`idolatry`, `secret-societies`, `dedications`, `family-line`,
`generational-patterns`, `strongholds`, `fear`, `armor-of-god`,
`scripture-prayer`, `discipleship`, `victory`, `cross`.

**Every one of them is in `SENSITIVE_RESOURCE_TOPICS`**, so a resource touching
any of them needs two named human sign-offs (`contentReview` + `safetyReview`) in
addition to `status: 'approved'`. A catalogue author cannot opt out by labelling
the entry `standard` — the topic raises the level.

`RESOURCE_PERSPECTIVES` was added as theological **context**, never a judgement.
The plan declares `resourcePerspectives: ['african-pentecostal', 'pentecostal',
'charismatic', 'evangelical']`, which **orders** an already-approved shelf and
never adds or removes anything.

Movement-level shelves live on each `MOVEMENTS` entry's `resourceTopics`.

### The worksheet is deliberately unpublished

Every entry in `deliveranceBooks.js` is `needs_review` with no sign-offs, so the
"Go deeper" shelf is currently **absent** for this plan. That is the intended
state: an empty shelf is correct, and the thirty days are complete without a
single external book.

Verified official pages (read 2026-08-28): Derek Prince Ministries for *They
Shall Expel Demons*, *Blessing or Curse: You Can Choose*, *Prayers and
Proclamations* and *The Holy Spirit in You*; Harvest House for *The Bondage
Breaker*.

Recorded without a canonical URL (a reviewer must supply and verify one):
*Deliverance From Demonic Covenants and Curses* (Rev. James A. Solomon, Xulon
Press, 9781609573386), *Breaking the Power of Evil Altars* (Solomon,
9798868521706), *Prayer Rain* (D. K. Olukoya, MFM Ministries, 9780615900018),
*Prayers That Rout Demons* (John Eckhardt, Charisma House, 9781599792460),
*Victory Over the Darkness* (Neil T. Anderson, Bethany House, 9780764235993).

**Could not be verified to exist and are therefore NOT in the catalogue:** *The
Danger and Power of Hidden Covenants* and *The Danger and Power of Hidden
Curses* (both attributed to Rev. James A. Solomon in the brief). No entry was
created for them rather than inventing bibliographic data.

Localized editions are **English only**, because no other language edition was
verified. No German, French, Amharic, Swahili, Portuguese or Filipino edition is
invented; locale-specific African/Pentecostal alternatives are a curation task,
not a translation task.

### Copyright

Books inspire the topic taxonomy and the recommendations. Praystead writes its own
prayers, and never reproduces prayer text, prayer points, renunciation formulas
or substantial passages from *Prayer Rain*, *Prayers That Rout Demons*,
*They Shall Expel Demons*, *Blessing or Curse*, the Solomon titles or any other
copyrighted resource.

---

## Localization

| Layer | Where | Languages |
|---|---|---|
| Plan title/subtitle, movements, certainty options, remembrance answers, step titles, all section labels, look-back questions, continue themes, fasting note | `src/i18n/locales/*.js` (81 new keys) | **all 16**, CI-gated by `npm run check:locales` |
| Day titles (`theme`) | inline in `freedomInChristDays.js` | **all 16**, authored |
| Day prose, explanations, examples, prayer-module bodies, intro/biblical/completion | source `en` + `fr` | **en + fr only** — see below |

`proseTranslations: []` is a deliberate decision, not an omission. "Deliverance",
"covenant", "curse", "ancestral worship", "spirit", "shrine", "altar",
"divination", "initiation", "renunciation" and "spiritual warfare" translate very
differently across cultures, and a bad rendering here could accidentally equate
culture with witchcraft, ancestors with demons, or ethnicity with spiritual
bondage. A machine-drafted overlay would *displace* the authored English and
French once merged (`mergePlan`), so a stub is worse than none.

Translate **meaning**, not terminology, and require review by a competent
speaker familiar with Christian vocabulary in that language before adding a code
to `proseTranslations`.

The 81 UI keys are AI-authored and marked as pending native review in each
locale file's section header.

---

## Privacy

The most sensitive thing this app could hold is someone's occult or family
spiritual history. So:

- **The certainty selection is never persisted.** It lives in
  `DeliveranceDayGuide` state and nowhere else — not localStorage, not the
  prayer, not the server, not encrypted-and-kept. Leaving the day forgets it.
- The same is true of the "did anything come to mind" answer and the chosen
  prayer mode.
- Nothing about a category, selection, note, dream or prayer reaches analytics.
  The three declared events — `deliverance_plan_started`,
  `deliverance_plan_day_completed`, `deliverance_plan_completed` — are emitted
  with **no properties at all**, and `resource_opened` already carries none.
- Prayer notes go through the existing encrypted path and stay private. Plan
  selections are never exposed to community or group surfaces.

Tested in `DeliveranceDayGuide.test.jsx` (§ privacy) and
`FreedomPlanRTL.browser.spec.jsx`.

---

## Safety

- **Mental and physical health.** Day 22 states that prayer and appropriate care
  are not enemies, that nothing here asks anyone to stop medication, psychiatric
  care, therapy or medical treatment, and directs a reader in severe distress —
  unable to function, hearing or seeing what others do not, or having thoughts of
  harm — to a doctor or emergency services *today*, while continuing to pray.
- **Abuse.** Day 5 states that forgiveness never means staying, submitting more,
  or not seeking help. Nothing in the plan tells anyone to remain unsafe.
- **Dreams.** The plan offers Scripture, peace, protection, discernment and a
  prayer note. It never interprets a dream and never says what one proves.
- **Objects and property.** Day 15 says: start with what is actually yours and
  stop relying on it; do not burn anything unsafe, destroy someone else's
  property, break the law, trespass, damage cultural property, or confront a
  relative. Ask a trusted pastor where ownership or disposal is complicated.
- **Accusation.** Day 17 says never to accuse a relative of witchcraft.
- **Fasting.** Offered, never prescribed. No duration, no food requirement, an
  explicit non-food alternative, and an explicit "nothing in this plan depends on
  fasting". Three days at most carry the note.
- **No commercialisation.** No paid unlock, no premium prayers, no implication
  that money buys freedom.

---

## Schema and migrations

**None.** This feature adds no table, column, policy, RPC, edge function or
production SQL. It is client content plus components on the existing plan engine.

---

## Tests

| File | Covers |
|---|---|
| `src/content/plans/freedomInChrist.test.js` | engine registration, 30 days, five movements, the release gate, every Scripture reference, the non-diagnosis rules, cultural safety, health/abuse safeguards, the certainty→module mapping, deterministic assembly, ordering, no duplication, Christ-centredness, localization parity, resource topics |
| `src/components/tests/DeliveranceDayGuide.test.jsx` | the rendered day: Holy Spirit invitation, "nothing specific" as a valid answer, note hand-off, disclosure, the radiogroup and its a11y, what certainty changes, the step walk (forward/back/pause/Amen), mode gating, and privacy |
| `src/components/deliverance/FreedomPlanRTL.browser.spec.jsx` | the whole flow in Arabic in a real browser: direction inheritance, disclosure, radios, Back/Next, pause, no horizontal overflow, nothing stored |
| `src/content/resources/deliveranceBooks.test.js` | worksheet shape, sensitive-review enforcement, no invented editions, empty shelf, perspective ordering, no copied prayer text |

---

## Release checklist

The plan cannot ship until a named human works through all of this and fills in
`review` on `FREEDOM_IN_CHRIST` (see `src/lib/planReview.js` for the shape:
approved status, named reviewer, ISO date — for theology, for safety, and for
every one of the 16 locales).

1. Read **every** Scripture reference in context — 30 primary passages, all
   related passages, all `standRefs`, and all 17 module reference sets.
2. Review every theological statement, every renunciation category, every
   example, every guided prayer, every Holy Spirit prompt and every family-line
   statement.
3. Verify: Scripture stays authoritative; Christ stays central; no Holy Spirit
   language becomes app-generated revelation; personal guilt is never inherited;
   family history is never invented; African cultural practice is never
   automatically demonised; uncertainty leads to trust rather than fear; mental
   and physical problems are never automatically spiritualised; books are
   recommendations, not Scripture; no copyrighted prayer is reproduced.
4. Have the 81 new locale keys reviewed by competent speakers (`docs/I18N_REVIEW.md`).
5. Decide, per language, whether to author a prose overlay — and only then add
   that code to `proseTranslations`.
6. Review each candidate resource individually (biblical grounding, fear-based
   teaching, unsupported certainty, dangerous medical claims, encouragement of
   violence, defamatory accusation, commercialisation, coercive ministry) and
   supply a verified canonical URL before approving any of them.
7. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:browser`,
   `npm run check:locales`, `npm run build`.
