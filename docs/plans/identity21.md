# identity21 — Identity in Christ (21 days)

**Status:** Drafted with AI assistance on 2026-09-23. Not reviewed by a human.
EN and FR authored; the other 14 languages show AI-drafted day titles and fall
back to English prose.

Files: `src/content/plans/identityInChrist.js` (meta + guardrail header),
`identityInChristDays.js` (21 days), `identityInChrist.test.js` (contract +
guardrails). UI keys: `planIdentity*` in the scratch i18n JSON (not yet merged).

## 1. Purpose and audience

Foundational discipleship on the question "Who am I because I belong to Jesus
Christ?" For new believers, and for long-time Christians whose sense of worth
has drifted onto work, looks, relationships, approval or ministry results.
Identity is presented as **received** (union with Christ, grace, justification,
adoption, sanctification, membership in God's people), never constructed. It is
explicitly not a self-esteem course and promises no feeling or outcome.

## 2. Structure

| Day | Movement | Theme (EN) | Ref | Related | resourceTopics |
|---|---|---|---|---|---|
| 1 | rescued | Created in God's image | Genesis 1:26-31 | Psalm 8:3-8, James 3:9-10 | identity, calling |
| 2 | rescued | Fully known by God | Psalm 139:1-18 | Psalm 139:23-24, Galatians 4:8-9 | identity, prayer |
| 3 | rescued | Saved by grace, not by effort | Ephesians 2:1-9 | Genesis 3:7-10, Romans 3:21-24 | gospel, identity |
| 4 | rescued | Forgiven: no more hiding | Psalm 32:1-7 | 1 John 1:8-9, Colossians 2:13-14 | forgiveness, repentance |
| 5 | rescued | No condemnation in Christ | Romans 8:1-4 | Romans 7:21-25, Romans 8:31-34 | gospel, identity |
| 6 | united | Christ lives in me | Galatians 2:16-21 | Galatians 2:11-14, Romans 5:1-2 | identity, gospel |
| 7 | united | A branch in the true Vine | John 15:1-11 | Colossians 2:6-7, Galatians 5:22-23 | spiritual-formation, prayer |
| 8 | united | A new creation | 2 Corinthians 5:14-17 | Ephesians 4:22-24, Galatians 6:14-15 | identity, holiness |
| 9 | united | Born of God | John 1:9-14 | 1 John 3:1, John 3:3-8 | identity, gospel |
| 10 | united | Adopted: calling God Abba | Galatians 4:1-7 | Romans 8:14-17, Psalm 27:10 | identity, holy-spirit, prayer |
| 11 | belonging | Chosen in Christ | Ephesians 1:3-14 | Deuteronomy 7:6-8, 1 Peter 2:9-10 | identity, worship, church |
| 12 | belonging | No longer strangers: God's household | Ephesians 2:11-22 | Ephesians 2:10, Romans 15:7 | church, community |
| 13 | belonging | A temple of the Holy Spirit | 1 Corinthians 6:12-20 | 1 Corinthians 3:16-17, Romans 12:1 | holy-spirit, holiness, purity |
| 14 | belonging | A member of Christ's body | 1 Corinthians 12:12-27 | Romans 12:4-8, Ephesians 4:15-16 | church, spiritual-gifts, community |
| 15 | belonging | Citizens of heaven | Philippians 3:17-21 | 1 Peter 2:11-12, Hebrews 11:13-16 | kingdom-of-god, identity, church |
| 16 | living | Free from slavery to sin | Romans 6:1-14 | Romans 6:15-18, Galatians 5:16-17 | holiness, discipleship, repentance |
| 17 | living | Your past is not your master | 1 Timothy 1:12-17 | Luke 19:1-10, 1 Corinthians 6:9-11 | forgiveness, repentance, gospel |
| 18 | living | Your worth is not earned | Philippians 3:4-11 | Luke 10:17-20, Jeremiah 9:23-24 | identity, work, contentment |
| 19 | living | Being conformed to Christ | 2 Corinthians 3:12-18 | Romans 8:28-30, Philippians 1:6 | holy-spirit, spiritual-formation, holiness |
| 20 | living | Christ's ambassadors | 2 Corinthians 5:18-21 | Matthew 5:13-16, 1 Peter 3:15-16 | evangelism, calling |
| 21 | living | Hidden with Christ in God | Colossians 3:1-4 | Colossians 3:9-11, 1 John 3:2 | identity, spiritual-formation, gospel |

Plan foundation (`biblical.ref`): Ephesians 1:3-14.

Deviations from the spec's suggested order (the movements forced them):
"Accepted by grace" and "God's workmanship" are folded into day 12
(Ephesians 2:10 → 2:11-22: welcomed into one household); "Chosen in Christ"
moved to day 11, where Ephesians 1's plural "us" fits *belonging*; a separate
"Born of God" day (John 1) stands before "Adopted" (Galatians 4). Days 1 and 19
form an arc: the image of Genesis 1 restored in Christ (Romans 8:29).

## 3. Passages considered and rejected

- **Jeremiah 1:5** — a prophet's unique calling; not generalised to every reader.
- **Isaiah 43:1-4** — addressed to Israel in exile; kept out to avoid
  re-addressing it to individuals without explanation.
- **Romans 7:14-25 as the main text** — its interpretation is disputed (see §4);
  used only as a related passage on day 5.
- **1 John 3:9** ("does not keep on sinning") — easily misread as sinlessness in
  a short devotional; 1 John 1:8-9 and 3:1-2 used instead.
- **Proverbs 23:7 (KJV "as he thinketh")** — commonly misused for positive
  thinking; rejected.
- **Psalm 139:13-16 on its own** — kept within 139:1-18 so that "fearfully made"
  is read as praise of God, not self-admiration.

## 4. Interpretive issues and how the text handles them

- **Romans 7** — whether 7:14-25 describes Paul's present Christian experience
  is debated. Day 5 only notes that "no condemnation" follows the cry of 7:24-25
  and grounds the verdict in God's act (8:3), which holds on either reading.
- **Sinless perfection vs. ongoing struggle** — Wesleyan-Holiness and some
  Pentecostal traditions teach entire sanctification in various forms. The plan
  does not argue this; it simply claims no present sinlessness and keeps
  confession (days 4, 8, 16) beside the new-creation and freedom days.
  Test: `never claims present sinless perfection`.
- **Election (day 11)** — stays with Ephesians 1: in Christ, plural, for
  holiness and praise. One sentence acknowledges that Christians discuss how
  God's choosing relates to human response; no position is taken.
- **"Sonship" (Galatians 4)** — rendered "a child given full rights" so that
  women readers are plainly included; the note that Roman/Jewish inheritance
  was male-oriented is left to teaching resources.
- **Romans 6 resurrection tense** — day 16 keeps Paul's wording (buried with
  Christ so that we may live a new life) and does not import "already raised"
  from Colossians 3:1 into Romans 6.
- **Galatians 2:11-14 (Peter at Antioch)** — used as context for 2:16-21: fear
  of others' approval shaped Peter's table fellowship. This is the natural
  reading of the chapter, but reviewers may prefer to keep it lighter.
- **2 Corinthians 5:17** — read as the new age breaking in (Paul's own framing
  in 5:14-16), not as a promise of felt newness.

## 5. Safety

- **Day 10 (adoption)** — readers with abusive or absent parents. The reflection
  says Paul does not ask the reader to picture their earthly father; a safety
  note points to a pastor or counsellor.
- **Day 13 (temple of the Spirit, 1 Corinthians 6)** — sexual-ethics passage
  read by abuse survivors. The safety note states that harm done *to* the
  reader's body was not their sin, points to pastor/counsellor/doctor and to
  emergency services if in danger.
- **Day 17 (your past)** — shame and self-harm risk. Grace without minimising
  harm: names confession and restitution (Zacchaeus), separates harm done BY the
  reader from harm done TO them, and a safety note points to pastor, counsellor,
  doctor and emergency services.
- No outcome, feeling, healing or deliverance is promised (tests:
  `never promises an outcome or a feeling`, contract `never speaks for God`).

## 6. Resource topics

Used: identity, gospel, holiness, holy-spirit, church, community,
spiritual-formation, discipleship, repentance, forgiveness, spiritual-gifts,
evangelism, calling, prayer, worship, purity, kingdom-of-god, work, contentment.
They follow the spec's set, plus `purity` (day 13), `worship` (day 11),
`kingdom-of-god` (day 15), `work`/`contentment` (day 18) where the day is
specifically about that. Leads to verify for the shelf: Rankin Wilbourne,
*Union with Christ*; J. Todd Billings, *Union with Christ*; Sinclair Ferguson,
*Children of the Living God*; Tim Keller, *The Freedom of Self-Forgetfulness*;
BibleProject on Ephesians. Neil Anderson, *Victory over the Darkness*, is already
in the catalogue under freedom — check that the `christian-living` domain
filter treats it as intended.

## 7. What reviewers must check

**Theology**
- Day 5: the Romans 7 framing is acceptable to the ministry's tradition.
- Day 8 / 16 / 19: the balance between "already" and "not yet" (no
  perfectionism, no defeatism) matches the ministry's teaching on
  sanctification.
- Day 11: the one-line election disclaimer is fair and enough.
- Day 6: Galatians 2:11-14 → approval-seeking application.
- Day 12: "one new humanity" applied to ethnicity, class, politics and church
  background.
- Short scriptural phrases in prose ("But God", "Abba, Father", "in Him") stay
  within the 2–4 word tolerance; nothing else reads as quotation.
- FR citations in practices use the `1.27` style (e.g. "Genèse 1.27"); confirm
  the house style.

**Safety**
- Wording of the three safety notes (days 10, 13, 17); whether day 2 (Psalm 139,
  formation in the womb) or day 9 ("whether you were wanted") also needs one.
- Day 17 prompts on restitution say "where it is wise and safe" — confirm this
  is enough where contacting a victim could itself cause harm.

**Language**
- FR is idiomatic with **tu**; masculine generic used ("créé", "seul") — confirm.
- 14 other languages: AI-drafted day titles and UI keys need a native pass
  (especially am, sw, tl, fa, hi).

## 8. Outstanding questions

- No existing resource topic for **union with Christ** or **adoption**; `identity`
  and `gospel` are used. A shared `union-with-christ` tag might help the shelf,
  but it is not needed for this plan to work.
- The FR sub key uses **vous** (UI register), matching `planPreparingSub`; the
  movement title "Vivre de sa nouvelle identité" is impersonal to avoid a
  tu/vous clash — confirm.
