# children21 — Praying for Children & the Next Generation (21 days)

**Status:** Drafted with AI assistance on 2026-09-23. Not reviewed by a human.
EN and FR authored; the other 14 languages show AI-drafted day titles and fall
back to English prose.

Files: `src/content/plans/prayingForChildren.js` (meta),
`src/content/plans/prayingForChildrenDays.js` (days),
`src/content/plans/prayingForChildren.test.js` (contract + guardrails).
UI keys: scratchpad `i18n/children21.json` (`planChildrenTitle`,
`planChildrenSub`, `planChildrenMovementBelonging|Character|Relationships|Calling`).

## 1. Purpose and audience

A 21-day intercession plan for any adult who loves children: parents,
grandparents, guardians, godparents, teachers, mentors, spiritual parents and any
Christian who cares about the next generation. No `lifeStage` is set, so no one
is filtered out. The core conviction, from Psalm 127: children belong to God;
adults are stewards, not owners of their future. Each day runs: reflection on a
passage read in context → three prompts that pray **for** children (never for
control over them) → `selfPrompt`, which turns the prayer back on the adult (on
every day) → one small practice. About ten minutes a day.

The intro welcomes those without children of their own, those who long for
children, those who have lost a child, and those whose child is far from God or
from them. It says plainly that prayer does not guarantee a child's faith,
safety, health or success, and that a child's choices are not a verdict on the
adult.

## 2. Structure

Movements (fixed): `belonging` 1–5, `character` 6–10, `relationships` 11–15,
`calling` 16–21. "Shelf" = how many approved resources the day shows today in
the `relationships` domain, all languages enabled.

| Day | Movement | Theme (EN) | Ref | Related | resourceTopics | Shelf |
|---|---|---|---|---|---|---|
| 1 | belonging | Entrusted, not owned | Psalm 127 | Genesis 33:5 | `children`, `parenting` | 14 |
| 2 | belonging | Brought to Jesus | Mark 10:13-16 | Luke 18:15-17 | `children`, `intercession` | 8 |
| 3 | belonging | Known, made and loved | Psalm 139:13-18 | Psalm 139:1-6; 1 John 3:1-2 | `children`, `parenting` | 14 |
| 4 | belonging | A faith of their own | 2 Timothy 1:3-7 | Acts 16:1; John 1:12-13 | `family-discipleship`, `children`, `gospel` | 10 |
| 5 | belonging | Loving God's word | Deuteronomy 6:4-9 | 2 Timothy 3:14-17; Psalm 119:103-105 | `family-discipleship`, `children`, `parenting` | 14 |
| 6 | character | Growing in every way | Luke 2:41-52 | Luke 2:40; 1 Samuel 2:26 | `children`, `parenting` | 14 |
| 7 | character | Wisdom as God's gift | Proverbs 2:1-11 | Proverbs 22:6; James 1:5 | `wisdom`, `wisdom-literature`, `parenting` | 14 |
| 8 | character | A guarded heart, a clear conscience | Proverbs 4:20-27 | Acts 24:16; 1 Timothy 1:5 | `children`, `holiness` | 8 |
| 9 | character | Honour and gentleness at home | Ephesians 6:1-4 | Colossians 3:20-21; Proverbs 1:8-9 | `parenting`, `family-discipleship` | 14 |
| 10 | character | A compassionate heart | Colossians 3:12-17 | Ephesians 4:26-32 | `children`, `parenting` | 14 |
| 11 | relationships | Friends who strengthen faith | 1 Samuel 23:15-18 | Proverbs 13:20; Ecclesiastes 4:9-12 | `children`, `parenting` | 14 |
| 12 | relationships | Voices that point to God | 1 Samuel 3:1-10 | 2 Timothy 2:1-2; Titus 2:6-8 | `family-discipleship`, `children` | 10 |
| 13 | relationships | Protecting the little ones | Matthew 18:1-10 | Psalm 82:3-4; Proverbs 31:8-9 | `children`, `intercession` | 8 |
| 14 | relationships | Purity without shame | 1 Corinthians 6:18-20 | Genesis 1:27-31; 1 Thessalonians 4:3-8 | `children`, `parenting` | 14 |
| 15 | relationships | Wise in a digital world | Philippians 4:4-9 | Ephesians 5:15-17 | `wisdom`, `parenting`, `family-discipleship` | 14 |
| 16 | calling | Courage under pressure | Daniel 1:8-17 | Daniel 1:3-7 | `children`, `persecution` | 8 |
| 17 | calling | Gifts for the church today | 1 Timothy 4:12-16 | Romans 12:4-8; 1 Peter 4:10-11 | `spiritual-gifts`, `children` | 8 |
| 18 | calling | Work as a calling | Exodus 31:1-6 | Colossians 3:23-24 | `calling`, `children` | 8 |
| 19 | calling | Love in their future relationships | 1 Corinthians 7:32-35 | 1 Corinthians 7:7; 1 Corinthians 13:4-7 | `children`, `parenting` | 14 |
| 20 | calling | From generation to generation | Psalm 78:1-8 | Psalm 145:4; Joel 1:3 | `family-discipleship`, `children` | 10 |
| 21 | calling | Into God's hands | 1 Samuel 1:21-28 | 1 Samuel 2:18-19; Psalm 31:14-15 | `children`, `parenting`, `intercession` | 14 |

Spec coverage: every passage the spec lists is used (Psalm 127, Psalm 78:1-8,
Deuteronomy 6:4-9, Proverbs 1–4 across days 7–9, Mark 10:13-16, Luke 2:40 and
2:52 inside Luke 2:41-52, Ephesians 6:1-4, 2 Timothy 1:3-7, 2 Timothy 3:14-17,
Psalm 139, Psalm 145:4, Joel 1:3, 1 Samuel 1:21-28, Daniel 1, 1 Timothy 4:12-16,
Matthew 18:1-10). The test asserts this list.

## 3. Passages considered and rejected

- **Proverbs 22:6 as the primary passage** — rejected: it is the verse most
  often misread as a guarantee. It sits as a *related* reference on day 7, where
  the reflection says explicitly that it is a wise observation, not an
  unconditional promise (asserted by the test).
- **Jeremiah 1:5 / Luke 1:15** ("before you were born…") — rejected: unique
  prophetic callings; using them would promise every child a special calling.
  Psalm 139 carries the "known before birth" theme without that problem.
- **Isaiah 54:13 / Acts 2:39 / Acts 16:31** — rejected as easily proof-texted
  into promises of children's salvation (Acts 16:31 in particular is addressed
  to one household in one moment).
- **Psalm 91 for protection** — rejected for the protection day: easily read as
  a guarantee that no harm will come. Matthew 18 was chosen because it shows
  Jesus' severity toward those who harm children and pairs naturally with action.
- **Genesis 22 (Abraham and Isaac) for surrender** — rejected: a child placed on
  an altar is the wrong image for a plan that also has to hold child-protection.
  Hannah (1 Samuel 1) was used instead, read as narrative (§4).
- **Song of Songs for the purity day** — rejected as adult-focused;
  Genesis 1:27-31 + 1 Corinthians 6:18-20 ground purity in the goodness of the
  body and belonging, not shame.

## 4. Interpretive issues and how the text handles them

- **Proverbs is wisdom, not promise.** Day 7 says so about 22:6; days 8, 9 and 11
  use Proverbs descriptively ("the father's picture", "Proverbs observes").
  A test rejects "Proverbs promises / guarantees".
- **Hannah's vow (day 21)** is read as narrative: "her vow belonged to her own
  story; no one is asked to leave a child at a sanctuary". Only the posture of
  entrusting a child to God is drawn from it, plus the detail of the yearly robe
  (1 Samuel 2:19): letting go into God's hands is not letting go of love.
- **Daniel 1 (day 16)** — the text says God gave these young men favour and
  understanding; the reflection says it does not promise the same outcome to
  every young believer under pressure. "Probably still in their teens" is the
  common view, hedged. The prompt's "Daniel accepted a new name but drew a line
  at the king's food" reflects the text's silence about the names (1:7) versus
  his resolve about the food (1:8).
- **Ephesians 6:1-4 (day 9)** — Paul addressing children as church members who
  would hear the letter read is a standard inference. Honour is presented as
  flowing both ways; the prompt on strained or broken parent–child relationships
  asks for reconciliation only "where it is safe". Obedience is never framed as
  unconditional.
- **1 Corinthians 7:7 (day 19)** — whether Paul calls marriage as well as
  singleness a "gift" is debated; the day follows the common reading that both
  are gifts and does not build anything on the point. The day refuses to script
  children's futures: some will marry and some will not; neither is lesser.
- **Colossians 3:23-24 (day 18)** is addressed to enslaved believers; the
  reflection applies it through verse 23's "whatever you do", the usual reading,
  and says "believers doing the humblest work". A reviewer may prefer naming the
  original audience.
- **Exodus 31 (day 18)** — Bezalel is "among the first" described as filled with
  the Spirit of God (hedged: Genesis 41:38 and Exodus 28:3 come earlier in
  different wording).
- **Ephesians 4:26 (day 10)** — "anger is not in itself sin" is the usual
  reading of "in your anger do not sin".
- **Faith cannot be inherited (day 4)** — 2 Timothy 1:5 with Acts 16:1 (only his
  mother is named as a believer) and John 1:12-13. Paedobaptist and credobaptist
  readers can both pray this day; it says nothing about baptism.

## 5. Safety concerns and how the text handles them

- **Day 13 (protection)** carries a `safetyNote`: if a child is being harmed or
  at risk, prayer goes together with action — police or emergency services for
  immediate danger, otherwise local child-protection services and the relevant
  safeguarding lead; follow their procedures; do not confront the suspected
  person; do not record any details of a child's situation in the app. Practice:
  find out who the church's or school's safeguarding lead is.
- **Day 14 (sexuality/purity)** carries a `safetyNote`: if a child discloses
  unwanted sexual contact or there are signs of grooming or exploitation
  (including online), stay calm, believe them, do not promise to keep it secret,
  call police/emergency services if in immediate danger, otherwise
  child-protection services or the safeguarding lead; you do not need to
  investigate yourself. The reflection grounds purity in the body's goodness and
  in belonging, "not from shame", learned "at a pace that fits their age". The
  practice is conditional ("If you are a parent or carer…").
- **Day 2 practice** (speaking a blessing over a child) says "openly and with
  their parents' knowledge" — no private rituals with other people's children.
- **Grief and blame.** Intro and day 7 say a child's choices are not a verdict on
  the adults; day 7 has a prompt for parents carrying guilt ("confess what is
  yours, and lay down what is not"); day 4 lets the adult tell God honestly how a
  child's unbelief feels. Tests reject "it's your fault", "because you didn't
  pray", "failed as a parent".
- **No promised outcomes.** Tests reject guarantee/promise phrasing in EN and FR
  (conversion, safety, healing, return, marriage, success).
- **No control, no stereotypes.** Tests reject "make them obey/believe", "control
  their choices", "boys are / girls should…". Day 4's first prompt prays that a
  child would know Jesus "freely".
- **Digital day (15)** — wisdom, not fear ("fear rarely makes a child wise");
  adults' own screen habits come first.
- **Illness/disability (day 6)** — prays for patient love and good care; no
  healing promise.

## 6. Resource topics

Every day is tagged through `children`, `parenting` or `family-discipleship`, with
a day-specific tag only where it adds nothing adult to the shelf (`intercession`,
`gospel`, `wisdom`, `wisdom-literature`, `holiness`, `persecution`,
`spiritual-gifts`, `calling` — none of these currently match any book in the
`relationships` domain; they are there for future child-focused resources).

The `relationships` domain is dominated by couples' and dating material, and
`resolveResources()` shows **every** match, so the spec's broader suggestions
dragged adult books onto a children's shelf. Checked with `resolveResources`
over all 16 languages:

- `sexuality` (day 14) added adult sex/marriage books (e.g. *Liebeslust*,
  *De A à Sexe*, *Relationship Goals*, *Sex, Liebe und Ehe*); `singleness`
  (day 19) added 14 singles/dating books; `marriage` would add 47 couples'
  books (61 on the shelf instead of 14).
- `friendship` adds only couples' books (*Five Love Languages*, *Cherish*…);
  `identity`, `character`, `trust`, `spiritual-formation`, `family`, `church`
  and `prayer` each add dating, marriage or marriage-roles titles.
- `abuse-safety` matches only a book on the first years of married life.

All of these were dropped. The one child-specific sexuality book
(*Sexualerziehung bleibt Familiensache*, Lehmann) still reaches day 14 through
`children`/`parenting`. The test now asserts that no day carries an adult tag and
that every book on every day's shelf carries `children`, `parenting` or
`family-discipleship`.

Books currently on the shelf (14 in total, EN/DE/FR/AR): Lee *The Parenting Book*,
*Parenting Children Course*, *Parenting Teenagers Course*; Tripp *Parenting*;
Omartian *The Power of a Praying Parent*; Fowowe *Out of the Box Parenting*;
Lehmann *Wenn Kinder andere Wege gehen*, *Sexualerziehung bleibt Familiensache*;
Annie Poonen *Gott schuf Mütter*, *Ermutigung für Mütter*; Poonen *A Godly Family
Life*; Munroe *The Fatherhood Principle*; Sanogo *Les 4 M de la femme de Dieu*;
Shepherds Global *الأسرة المسيحية*. Leads from the spec not yet in the catalogue:
Andy Crouch *The Tech-Wise Family* (day 15), Fuller Youth Institute *Growing
Young* / *Sticky Faith* (days 4, 12, 20), Jen Wilkin, Tedd Tripp *Shepherding a
Child's Heart*, and French/Spanish/Portuguese/African family-ministry resources.

## 7. What reviewers must check

Theology reviewer:
- Day 7's handling of Proverbs 22:6 and day 21's reading of Hannah's vow.
- Day 19: 1 Corinthians 7:7 reading; whether a future-relationships day belongs
  in a children's plan at all (it is there because the spec asks for it).
- Day 18: the phrasing of Colossians 3:23 (enslaved audience) and "among the
  first … filled with the Spirit".
- Day 12: "help them recognise and answer His voice" — acceptable across
  Pentecostal and non-charismatic readers?
- That no day, prompt or practice reads as a promise of conversion, protection,
  health or future.

Safety reviewer:
- Day 13 and 14 safety notes: wording, and whether local terms are needed
  (e.g. "safeguarding lead" is UK usage; FR uses "responsable de la protection
  de l'enfance").
- Day 14 practice and prompts: age-appropriate, non-shaming, no graphic content.
- Day 2 practice (blessing a child "with their parents' knowledge").
- Day 9 prompt on estranged parent–child relationships ("where it is safe").
- That no practice asks an adult to be alone with a child or to keep a secret.

## 8. Outstanding questions

- **Resource tagging:** the catalogue has no way to say "a children's book about
  sexuality" versus "a couples' book about sexuality" other than co-tagging.
  Resource researchers adding child-safeguarding, digital-parenting or
  children's-friendship books should tag them `children` (and/or `parenting`) so
  they reach this plan; a dedicated `digital` / `media` topic would help day 15.
- Should the plan get its own domain (e.g. `family`) rather than sharing
  `relationships` with couples' and dating material? That would let the days use
  `friendship`, `identity` and `character` again.
- Day 14 FR "manipulations de prédateurs" renders "grooming"; the safety
  reviewer may prefer "pédopiégeage" or another established term.
- The 14 non-EN/FR day titles are AI drafts and need a native pass.
