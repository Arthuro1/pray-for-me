# psalms42 — Psalms: Learning to Pray Everything

**Status:** Drafted with AI assistance on 2026-09-23 (weeks 1–4) and completed on
2026-09-28 (weeks 5–6, meta prose, test, this note). Not reviewed by a human.
EN and FR authored; the other 14 languages show AI-drafted day titles and fall
back to English prose.

Files: `src/content/plans/psalmsStudy.js` (meta, export `PSALMS_STUDY`),
`src/content/plans/psalmsStudyDays.js` (42 days), `src/content/plans/psalmsStudy.test.js`,
`docs/plans/_handoff/i18n/psalms42.json` (8 UI keys × 16 languages).

## 1. Purpose and audience

A real Bible-study journey through the Psalter (mode `study`, category
`bible-study`), for ordinary believers who want to learn to pray with the
Psalms rather than read 42 disconnected devotionals. It shows how the Psalms give
God's people words for praise, trust, fear, grief, anger, repentance, justice,
thanksgiving, waiting and worship. About 20 minutes a day with a Bible open.

Day 1 teaches six questions to put to any psalm (what it reveals about God; what
the psalmist is honestly experiencing; how the psalm moves; what must not be
generalized into a universal promise; how it fits the wider biblical story; how
its words can faithfully become prayer). The questions recur as the stems of the
daily `study.questions`, and the last day of every week (7, 14, 21, 28, 35, 42)
has a review question in `study.synthesis`.

## 2. Structure

| Day | Movement | Theme (EN) | Ref | Related | resourceTopics |
|---|---|---|---|---|---|
| 1 | praise | How to read a psalm | Psalm 100 | Psalm 95:1-7; 1 Peter 2:9-10 | psalms, worship, scripture-prayer |
| 2 | praise | The Maker’s majesty, our dignity | Psalm 8 | Genesis 1:26-28; Hebrews 2:5-9; Matthew 21:14-16 | psalms, worship, identity |
| 3 | praise | Skies that speak, a word that revives | Psalm 19 | Romans 10:14-18; Romans 1:19-20 | psalms, scripture-prayer, holiness |
| 4 | praise | The voice over the storm | Psalm 29 | Mark 4:35-41; Genesis 9:8-17 | psalms, worship, kingdom-of-god |
| 5 | praise | The word that made the heavens | Psalm 33 | John 1:1-3; Hebrews 11:3 | psalms, worship, trust |
| 6 | praise | King over all the earth | Psalm 47 | Genesis 12:1-3; Galatians 3:7-9; Philippians 2:9-11 | psalms, kingdom-of-god, mission |
| 7 | praise | His glory among the nations | Psalm 96 | 1 Chronicles 16:23-33; Revelation 5:9-10 | psalms, worship, mission |
| 8 | trust | The Shepherd in the dark valley | Psalm 23 | Ezekiel 34:11-16; John 10:11-15 | psalms, trust, suffering |
| 9 | trust | The Lord, my portion | Psalm 16 | Numbers 18:20; Acts 2:22-32; Acts 13:34-37 | psalms, trust, gospel |
| 10 | trust | Confidence and fear in one prayer | Psalm 27 | Luke 10:38-42; Isaiah 40:27-31 | psalms, trust, fear |
| 11 | trust | A refuge when the earth shakes | Psalm 46 | 2 Kings 19:32-36; Revelation 22:1-5 | psalms, trust, kingdom-of-god |
| 12 | trust | Waiting for God alone | Psalm 62 | Romans 2:6-11; 1 Timothy 6:17-19 | psalms, trust, prayer |
| 13 | trust | Sheltered, not exempt | Psalm 91 | Matthew 4:1-11; Romans 8:35-39 | psalms, trust, suffering |
| 14 | trust | The Keeper who never sleeps | Psalm 121 | 1 Kings 18:25-29; John 17:11-15 | psalms, trust, worship |
| 15 | lament | How long? The shape of lament | Psalm 13 | Habakkuk 1:1-4; Revelation 6:9-11 | psalms, lament, grief |
| 16 | lament | Thirst, memory and stubborn hope | Psalm 42 | Psalm 43; Mark 14:32-36 | psalms, lament, mental-health |
| 17 | lament | Fear, tears and trust | Psalm 56 | 1 Samuel 21:10-15; Romans 8:31-34 | psalms, lament, fear |
| 18 | lament | Remembering in a sleepless night | Psalm 77 | Exodus 14:21-31; Exodus 15:11-13 | psalms, lament, suffering |
| 19 | lament | Anger handed over to God | Psalm 69 | Psalm 137; Romans 12:14-21; Luke 23:32-36 | psalms, lament, justice, forgiveness |
| 20 | lament | Forsaken — and the praise beyond | Psalm 22 | Mark 15:33-39; John 19:23-24; Hebrews 2:10-12 | psalms, lament, cross, suffering |
| 21 | lament | Praying in the dark | Psalm 88 | 1 Chronicles 6:31-33; Romans 8:26-27 | psalms, lament, grief, mental-health |
| 22 | mercy | Mercy in exhaustion | Psalm 6 | Psalm 38; John 9:1-7 | psalms, lament, suffering, prayer |
| 23 | mercy | Teach a forgiven heart | Psalm 25 | Psalm 32; Psalm 130 | psalms, repentance, prayer |
| 24 | mercy | From concealment to confession | Psalm 32 | Romans 4:1-8 | psalms, repentance, forgiveness |
| 25 | mercy | Guilt, pain and the need for help | Psalm 38 | John 9:1-7; Psalm 6 | psalms, repentance, suffering, lament |
| 26 | mercy | Mercy that makes a new beginning | Psalm 51 | 2 Samuel 12:1-13; Psalm 32 | psalms, repentance, forgiveness |
| 27 | mercy | Remembering compassion | Psalm 103 | Psalm 130 | psalms, forgiveness, worship |
| 28 | mercy | Forgiveness and patient hope | Psalm 130 | Psalm 25; Psalm 131 | psalms, repentance, forgiveness, prayer |
| 29 | justice | Two ways, one delight | Psalm 1 | Jeremiah 17:5-8; Joshua 1:8 | psalms, scripture-prayer, discipleship |
| 30 | justice | The nations rage; the Lord’s Anointed reigns | Psalm 2 | Acts 4:23-31; Hebrews 1:1-5; Mark 1:9-11 | psalms, kingdom-of-god, gospel |
| 31 | justice | Who may dwell with God? | Psalm 15 | Psalm 24:3-6; Isaiah 1:10-17; Hebrews 10:19-25 | psalms, worship, holiness, justice |
| 32 | justice | Do not fret: waiting for justice | Psalm 37 | Matthew 5:1-12; Romans 12:17-21 | psalms, justice, trust |
| 33 | justice | When the wicked seem to win | Psalm 73 | Jeremiah 12:1-4; Habakkuk 3:17-19 | psalms, justice, suffering, contentment |
| 34 | justice | God judges the judges | Psalm 82 | John 10:31-39; Isaiah 1:16-17; Proverbs 31:8-9 | psalms, justice, kingdom-of-god |
| 35 | justice | A King who defends the poor | Psalm 72 | Isaiah 11:1-9; 1 Timothy 2:1-4; Genesis 12:1-3 | psalms, justice, kingdom-of-god, intercession |
| 36 | hope | Longing for the house of God | Psalm 84 | Psalm 42; Hebrews 12:22-24; John 4:19-24 | psalms, worship, church |
| 37 | hope | The redeemed tell their story | Psalm 107 | Psalm 106:47-48; Mark 4:35-41 | psalms, worship, prayer |
| 38 | hope | Love and vows after rescue | Psalm 116 | 2 Corinthians 4:7-15; Matthew 26:26-30 | psalms, worship, suffering |
| 39 | hope | The rejected stone, the cornerstone | Psalm 118 | Matthew 21:1-11; Acts 4:8-12; 1 Peter 2:4-7 | psalms, worship, cross, gospel |
| 40 | hope | Sowing in tears, reaping in joy | Psalm 126 | Ezra 3:10-13; Isaiah 35:1-10; John 16:20-22 | psalms, grief, lament, prayer |
| 41 | hope | A quieted soul | Psalm 131 | Matthew 11:25-30; Isaiah 66:12-13; Philippians 4:11-13 | psalms, contentment, trust, spiritual-formation |
| 42 | hope | Praise as long as I live | Psalm 146 | Psalm 145; Psalm 150; Luke 7:18-23 | psalms, worship, justice, kingdom-of-god |

Plan foundation (`biblical.ref`): Colossians 3:16, with James 5:13, Matthew 26:30,
Mark 15:34, Luke 23:46 and Luke 24:44 cited in the commentary.

## 3. Passages considered and rejected

- The spec's psalm list is used unchanged. Order was adjusted within weeks for
  an arc: week 3 ends on Psalm 88; week 4 opens with Psalm 6 as a contrasting
  ending; week 5 runs 1 → 2 (the gateway pair) → 15 → 37 → 73 (the crisis) → 82
  → 72 (the just King, closing Book II); week 6 runs from pilgrimage (84)
  through testimony (107, 116, 118) and waiting (126, 131) to the Hallelujah of
  146.
- Day 42: **Psalm 146** chosen over 145. It opens the closing Hallel (146–150),
  gathers the justice concerns of Psalms 72 and 82 into praise, and ends with
  the Lord's everlasting reign — a fitting close to a plan that moved from
  praise through lament and justice back to praise. Psalm 145 is kept as a
  related passage.
- Psalm 109 (imprecatory) was not used as a day; Psalm 69 carries that work, with
  Psalm 137 as related. A full day on 109 needs more pastoral scaffolding than a
  study day allows.
- Psalm 110 (the most-quoted psalm in the NT) is not in the spec's list and was
  not added; worth considering if the plan is ever lengthened.
- Rejected cross-references: Exodus 22:25 on Psalm 15 (its verse number differs
  between English and French Bibles, confusing the FR prose) — Leviticus
  25:35-37 used instead.

## 4. Interpretive issues and how the text handles them

- **Superscriptions** are cited as ancient titles whose authorship and setting
  are debated (e.g. Psalm 72 "of/for Solomon"; Psalm 131 possibly a woman's
  voice — noted as a suggestion only).
- **Psalm 2:12** ("kiss the Son") — noted as difficult Hebrew with differing
  translations.
- **Psalm 82's "gods"** — heavenly council vs human judges presented fairly; the
  application does not depend on the choice. Jesus' use in John 10:34-36
  explained as a lesser-to-greater argument.
- **Psalm 73:24** — many read a hope beyond death; the text says interpreters
  differ on how much the psalmist saw.
- **Psalm 51:11** (from week 4) — the plea about the Spirit is not turned into a
  threat that God abandons believers; the text says Christians differ on its
  relation to new-covenant assurance.
- **NT use** is named only where genuine: Psalms 2 (Acts 4, 13; Hebrews 1, 5;
  Mark 1:11 echo), 8 (Hebrews 2), 16 (Acts 2, 13), 22 (Mark 15), 69, 116
  (2 Corinthians 4:13), 118 (Matthew 21; Acts 4; 1 Peter 2; Hebrews 13:6).
  Psalm 72's link to the magi is described as a possible echo only, and the
  text states that the NT does not quote it. Psalm 118:24 is read in context (the
  day of the Lord's act), not as a generic slogan.
- **Versification**: verse numbers follow English Bibles; day 1 warns that many
  French Bibles (e.g. Segond) count a psalm's title as verse 1.

## 5. Safety concerns and how the text handles them

Safety notes on days 13, 15–22, 25–27, 32, 38:

- **Crisis pointer** (emergency services / crisis line / someone you trust) via
  the shared `crisisNote` helper on the despair-heavy days: 15 (Ps 13), 16 (Ps
  42), 18 (Ps 77), 19 (Ps 69), 20 (Ps 22), 21 (Ps 88), 22 (Ps 6), 25 (Ps 38), 38
  (Ps 116 — cords of death).
- Day 13 (Ps 91): trusting God never means ignoring medical advice or danger.
- Day 17 (Ps 56): fear and threat — real help, not staying in danger.
- Days 26–27 (Ps 51, 103): repentance does not oblige a harmed person to
  restore contact or a leader's role; ongoing illness is not a failure of faith.
- Day 32 (Ps 37): waiting for God's justice never means staying in danger or
  keeping abuse secret; reporting wrongdoing is not revenge.
- **Imprecation**: days 19, 30, 32 and 39 frame anger and battle language as
  handed to God, under Matthew 5:44 and Romans 12:19; no licence for curses,
  revenge or coercion (Psalm 2 is explicitly not a mandate for any nation,
  party or church).
- **No forced resolution**: Psalm 88 ends in darkness and is left there;
  Psalms 6, 107, 116, 126 and 131 all say explicitly that their outcome is
  testimony, not a timetable.
- **No guarantees**: Psalms 1, 37, 84, 91, 103, 116 and 146 each carry a tension
  note on what not to generalize.

## 6. Resource topics

Mostly from the spec's set: `psalms` on every day, plus `lament`, `worship`,
`prayer`, `justice`, `repentance`, `kingdom-of-god`, `suffering`, `grief`,
`forgiveness`, `scripture-prayer`. Also used where precise: `trust`, `fear`,
`identity`, `holiness`, `mission`, `gospel`, `cross`, `mental-health`,
`discipleship`, `contentment`, `intercession`, `church`, `spiritual-formation`.
**Never** `wisdom-literature` or `david` (other studies' shelves on the same
domain; enforced by the test). `kingship` was deliberately avoided for the royal
psalms for the same reason.

## 7. What the reviewers must check

Theology reviewer:
- The six-question method (day 1) and the weekly review questions.
- Day 30 (Ps 2) and day 35 (Ps 72): messianic reading stated without claiming
  every psalm is Christ's voice; no endorsement of any modern ruler or nation.
- Day 34 (Ps 82): fairness of the "divine council" vs "human judges" summary.
- Day 38 (Ps 116:15) reading of "precious" as costly/weighty.
- Day 39 (Ps 118): reading of verse 24 in context; battle language.
- Week 4 (days 22–28) is noticeably terser than weeks 1–3 and 5–6; consider
  whether it needs enrichment (context especially).
- French: tu-register, French book names, typography.

Safety reviewer:
- Crisis wording on the nine `crisisNote` days; whether day 40 (Ps 126, grief)
  or day 33 (Ps 73, bitterness) should also carry a note.
- Day 32 wording on reporting abuse vs "be still".
- Day 26 (Ps 51) safeguarding wording around leaders and repentance.

## 8. Outstanding questions

- Day 42: Psalm 146 vs 145 (both defensible; 145 kept as related).
- Should Psalm 110 replace one psalm in week 5 given its NT weight?
- The 16-language day titles and the i18n JSON are AI drafts and need a native
  pass (Arabic and Swahili "pilgrimage" in `planPsalmsMovementHope` were
  rendered as "journey" to avoid Islamic-specific terms — check).
- No new resource topic needed; a `hebrew-poetry` or `psalms-genres` topic
  could help later but is not required.
