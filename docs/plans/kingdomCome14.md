# kingdomCome14 — Your Kingdom Come: Praying the Prayer Jesus Taught

**Status:** Drafted with AI assistance on 2026-09-23. Not reviewed by a human. EN and FR authored; the other 14 languages show AI-drafted day titles and fall back to English prose.

Files: `src/content/plans/yourKingdomCome.js` (meta), `yourKingdomComeDays.js` (days), `yourKingdomCome.test.js` (contract + guardrails). UI keys: `scratchpad/i18n/kingdomCome14.json` (`planKingdomTitle`, `planKingdomSub`, `planKingdomMovementFather|Daily|Sent`).

## 1. Purpose and audience

A 14-day prayer plan (category `formation`, ~15 minutes a day) that works through the Lord's Prayer one petition at a time. It is meant to move prayer away from a personal wish-list toward God's name, kingdom and will, and then to daily dependence, forgiveness, holiness, protection from evil, mission and the hope of Christ's return. It is for any believer, including people who have prayed the words for years without praying *through* them.

Each day has two parts, using existing fields only:
- **Intercession** (`prompts`, 3 per day): what we ask God to do for others, the church and the world.
- **Submission** (`selfPrompt`, every day): what in the reader's own life must come under the reign they are praying for. Every one names "His reign" / "son règne" (tested).

## 2. Structure

| Day | Movement | Theme (EN) | ref | related | resourceTopics |
|---|---|---|---|---|---|
| 1 | father | Our Father | Matthew 6:5-13 | Luke 15:11-24 · Matthew 7:7-11 · Romans 8:14-17 | lords-prayer, prayer |
| 2 | father | Hallowed be your name | Ezekiel 36:22-28 | Matthew 6:9 · Exodus 34:5-7 | lords-prayer, worship, holiness |
| 3 | father | Your kingdom come | Mark 1:14-15 | Matthew 12:28 · John 18:36 · Daniel 7:13-14 | kingdom-of-god, repentance, gospel |
| 4 | father | Your will, not mine | Matthew 26:36-46 | Hebrews 5:7-9 · Romans 12:1-2 | lords-prayer, trust, suffering |
| 5 | father | On earth as in heaven | Luke 4:16-21 | Psalm 72:1-14 · Isaiah 11:1-9 | justice, kingdom-of-god, mission |
| 6 | father | Seek first the kingdom | Matthew 6:19-34 | Luke 12:32-34 · Romans 14:17 | kingdom-of-god, contentment, generosity |
| 7 | daily | Our daily bread | Luke 11:1-13 | Exodus 16:13-21 · 2 Corinthians 8:13-15 | lords-prayer, generosity, prayer |
| 8 | daily | Forgive us our debts | Psalm 32:1-7 | 1 John 1:5-9 · Colossians 2:13-14 | forgiveness, repentance, lords-prayer |
| 9 | daily | As we forgive | Matthew 18:21-35 | Matthew 6:14-15 · Romans 12:17-21 · Ephesians 4:31-32 | forgiveness, boundaries, conflict |
| 10 | daily | Lead us not into temptation | Matthew 4:1-11 | James 1:13-15 · 1 Corinthians 10:12-13 · Hebrews 4:14-16 | holiness, lords-prayer, discipleship |
| 11 | daily | Deliver us from evil | John 17:13-19 | Colossians 1:13-14 · Ephesians 6:10-18 · 2 Thessalonians 3:1-3 | lords-prayer, persecution, fear |
| 12 | sent | Kingdom people | Matthew 5:1-16 | Matthew 20:20-28 · Romans 12:1-2 | kingdom-of-god, character, leadership |
| 13 | sent | Sent into the world | Matthew 9:35-38 | Isaiah 52:7-10 · Acts 1:6-8 · Matthew 28:18-20 | mission, evangelism, intercession |
| 14 | sent | Come, Lord Jesus | Revelation 21:1-7 | 1 Corinthians 15:20-28 · Revelation 11:15 · Revelation 22:17-21 | end-times, kingdom-of-god, lords-prayer |

Plan-level `biblical.ref`: Matthew 6:9-13.

## 3. Passages

**Used, and why.** Most primary readings are *narrative or teaching contexts in which the petition is enacted*, not just the petition itself (which is the same verse every day):
- Ezekiel 36:22-28 (day 2): God "hallows" His name, profaned by His own people's conduct among the nations, by cleansing them and giving them His Spirit. This supplies the petition's biblical background and a pneumatological link.
- Mark 1:14-15, Matthew 12:28, John 18:36 (day 3): the kingdom announced in Jesus, present in His Spirit-empowered works, and not derived from this world's powers.
- Matthew 26:36-46 (day 4): Jesus prays the third petition in Gethsemane (26:42), in grief (26:38) and three times (26:39, 42, 44).
- Luke 4:16-21 with Psalm 72 and Isaiah 11 (day 5): what God's will "on earth" looks like: good news to the poor, release and justice for the weak, by the Spirit's anointing.
- Luke 11:1-13 with Exodus 16 and 2 Corinthians 8:13-15 (day 7): Luke's setting of the prayer (friend at midnight, the Father giving the Holy Spirit); Paul's own use of the manna story to argue for sharing supports the "us" of daily bread.
- Psalm 32 / Matthew 18:21-35 (days 8–9): receiving forgiveness, then extending it.
- Matthew 4:1-11, James 1:13 (day 10); John 17:15, Ephesians 6 (day 11).
- Matthew 9:35-38 → 10:1-5; Acts 1:6-8 (day 13): the people asked to pray for workers are themselves sent; Jesus redirects a nationalist question ("restore the kingdom to Israel") toward Spirit-empowered witness.
- Revelation 21:1-7, 1 Corinthians 15:20-28, Revelation 22:20 (day 14).

**Considered and not used as primary.**
- Daniel 2 (the stone kingdom). Rich but needs a lot of explanation, and it is easily read as a political timetable. Kept out to protect the "no date-setting / no nation" guardrail. Daniel 7:13-14 is kept as a related text on day 3.
- Isaiah 9:6-7 would have fitted day 3 or 14. It was left out only because of the three-related limit. A reviewer may swap it for Daniel 7.
- Matthew 13 (kingdom parables) and Luke 17:20-21 ("in your midst / within you"). Both are good texts, but 17:21 is disputed (see §4) and too brief to carry a day's reflection.
- Psalm 2, Psalm 103:19, Revelation 11:15 as primaries. Psalm 2's royal-warfare imagery is easily co-opted by nationalist readings without long framing, so only Revelation 11:15 is used, as a related text.
- 1 Chronicles 29:11 (echoed by the doxology). Not used (see §4).

## 4. Interpretive issues and how the text handles them

- **Already / not yet.** Day 3 says the kingdom has already begun in Jesus and is not yet complete, and that this is why disciples keep asking for it. The biblical note and day 14 locate its fullness at Christ's return (1 Corinthians 15; Revelation 21).
- **Kingdom ≠ nation, party, prosperity, cultural dominance.** Day 3 ("No nation, party or movement owns it", with John 18:36), day 6 ("does not promise wealth", Romans 14:17), day 12 ("Kingdom people do not seize control"; Matthew 20:25-28) and day 13 (Acts 1:6-8) all say this. Tests forbid equating wording and "take back the nation/culture/mountains" language.
- **Earthly fathers.** Day 1 never asks the reader to picture a human father. It lets Jesus define "Father" (Luke 15; Matthew 7:9-11), and one prompt intercedes for people who find the word hard.
- **Gethsemane.** Day 4 presents surrender as honest desire placed under the Father's will, not as denying grief. It cites Hebrews 5:7.
- **"Debts" (Matthew) vs "sins" (Luke).** Day 8 explains "debts" as what we owe and cannot repay. The FR title uses the familiar liturgical "offenses", and the FR prose explains « dettes ».
- **Matthew 6:14-15 (conditional forgiveness).** It is cited on day 9 without turning it into a threat. Day 9 grounds forgiving others in having been forgiven (Matthew 18) and calls it a process ("from the heart … however long it takes"). *Reviewer: check that this balance fits the ministry's teaching.*
- **Temptation / testing.** *Peirasmos* can mean temptation or trial. Day 10 says translations differ and cites James 1:13 (God tempts no one to sin). The FR title uses the 2013 liturgical «Ne nous laisse pas entrer en tentation» rather than Segond's «ne nous induis pas en tentation», which can suggest God tempts. *Reviewer: confirm this choice for the target churches.*
- **"Evil" or "the evil one".** *Tou ponērou* allows both. Day 11 says so and follows John 17:15 ("the evil one"). Spiritual conflict is framed through Ephesians 6's own list (truth, righteousness, gospel, faith, word, prayer), and the selfPrompt discourages guessing at hidden causes. Tests forbid diagnostic phrasing. The resource topic `spiritual-warfare` is deliberately not used (sensitive and off-focus); `fear` and `persecution` are used instead.
- **The doxology** ("for yours is the kingdom…") is absent from the earliest manuscripts of Matthew. It is not mentioned in the prose and no day is built on it. *Reviewer: add a gentle line on day 14 if congregations will expect it.*
- **Luke 17:21** ("within you" / "among you") is disputed and was deliberately left unused.
- **Christ's return.** Day 14 is not date-setting: it cites Matthew 24:36, and tests forbid years and "in this generation" phrasing.

## 5. Safety concerns and handling

- **Day 9 (As we forgive): safetyNote.** Forgiveness does not mean excusing abuse, immediate trust, reconciling on the other person's terms, or access to the reader or their children. It can happen at a distance. The note points to emergency services, a pastor, a safeguarding lead and a counsellor. The reflection also separates forgiveness from trust and reconciliation, and the practice suggests a pastor or counsellor for deep hurt.
- **Day 11 (Deliver us from evil): safetyNote.** Prayer against evil never replaces practical help. The note points to emergency services, a pastor and a doctor or counsellor. This day prays for victims of trafficking, abuse and violence, and talk of "the evil one" can raise fear in anxious readers.
- **Day 8 (confession).** The practice points to a trusted mature believer (James 5:16) when a sin keeps its grip. It does not require public confession.
- **Day 1.** It is sensitive to readers with painful father relationships (see §4). There is no safetyNote, because the reflection handles it and a note seemed heavier than needed. *Reviewer: decide.*
- **Throughout.** No outcome is promised (tested), Praystead never speaks for God (contract-tested), and no Bible text is stored.

## 6. Resource topics

The topics come from the spec's suggested set: `lords-prayer` (days 1, 2, 4, 7, 8, 10, 11, 14), `kingdom-of-god` (3, 5, 6, 12, 14), `justice`, `mission`, `evangelism`, `intercession`, `forgiveness`, `repentance`, `generosity`, `contentment`, `holiness`, `end-times`. Some days need a more precise tag: `worship` (2), `gospel` (3), `trust` and `suffering` (4, Gethsemane), `prayer` (1, 7), `boundaries` and `conflict` (9, where forgiveness is not unsafe access), `discipleship` (10), `persecution` and `fear` (11), `character` and `leadership` (12, servant greatness). No sensitive topic is used (checked against `SENSITIVE_RESOURCE_TOPICS`).

**Existing entries that fit:** the Munroe kingdom titles already on `christian-living` (`munroe-kingdom-principles`, `munroe-rediscovering-the-kingdom`, `munroe-kingdom-citizenship`, `munroe-you-are-a-king`, `munroe-rediscovering-kingdom-worship`, `munroe-reclaiming-gods-original-purpose`) will surface on days 3, 5, 6, 12 and 14. **Tension to flag:** Munroe's kingdom teaching stresses dominion, "colonising" earth and kingdom citizenship, and some of it runs close to kingdom-economics or prosperity language. This plan explicitly teaches that the kingdom ≠ cultural dominance or prosperity. The resource reviewer should decide whether these titles sit well beside days 6 and 12, or should be limited to days 3 and 14. Serious, accessible leads to verify for new entries: N.T. Wright, *The Lord and His Prayer*; Tim Keller, *Prayer*; Pete Greig, *How to Pray*; J.I. Packer, *Praying the Lord's Prayer*; Scot McKnight, *Kingdom Conspiracy*; George Eldon Ladd, *The Gospel of the Kingdom*; BibleProject, "Gospel of the Kingdom".

## 7. What reviewers must check

**Theology reviewer**
- The already/not-yet framing on days 3 and 14 and in the biblical note.
- Day 9's handling of Matthew 6:14-15 (conditional forgiveness) against the ministry's teaching.
- The FR petition wording: «Ne nous laisse pas entrer en tentation» and «Pardonne-nous nos offenses». Other locales use their standard Protestant or liturgical Lord's Prayer wording (e.g. de «Führe uns nicht in Versuchung», ru Synodal, zh 和合本, ko 개역개정). A native reviewer should confirm each is the form their churches use.
- Day 11: "evil one" is preferred in the reflection, while the title keeps "evil". Is that acceptable?
- Day 12 paraphrases the Beatitudes; check that it is not too close to a translation.
- Day 5's prayer for rulers (Psalm 72): check that it reads as intercession, not political endorsement.

**Safety reviewer**
- Day 9's safetyNote wording, and whether it needs a local helpline placeholder.
- Day 11's safetyNote and the prayer for victims of trafficking and abuse.
- Whether day 1 needs its own gentle note.
- Munroe resource placement (see §6).

## 8. Outstanding questions

- Day 1 has no safetyNote. Should one be added for readers with abusive fathers?
- Should the doxology be mentioned (day 14 or the completion)?
- There is no `sermon-on-the-mount` resource topic. It is not needed now (`kingdom-of-god` and `lords-prayer` cover the shelf), but it may help if more Matthew 5–7 material arrives.
- The i18n JSON titles for the 14 non-source locales are AI drafts that follow each language's familiar Lord's Prayer wording. They need a native pass.
