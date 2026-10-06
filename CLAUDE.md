# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Praystead (formerly "Pray for Me", localStorage keys still use `pfm_`) is a private, multilingual Christian prayer-journal PWA. Stack: React 18 + Vite + Tailwind 3 + Zustand 5, Supabase (Postgres/RLS, Edge Functions, `pg_cron`), Vercel (static app + `api/` serverless functions), and an Android TWA wrapper in `android-twa/`. The app is plain JS/JSX; only a few modules are `.ts`, and `tsc` checks only `src/**/*.ts(x)`.

## Commands

```bash
npm run dev            # Vite dev server on :5173 (also serves /api/anthropic and proxies /api/youversion)
npm run build          # production build → dist/
npm run lint:strict    # what CI runs: zero warnings allowed
npm run typecheck      # tsc --noEmit over src/**/*.ts(x)
npm test               # Vitest, unit + integration (src/**/*.test.{js,jsx}, api/**/*.test.js)
npm run test:browser   # real Chromium via Playwright (src/**/*.browser.spec.{js,jsx})
npm run test:db        # pgTAP in supabase/tests (needs `supabase start` + `supabase db reset --local --no-seed`)
npm run check:locales  # i18n key/placeholder parity; add `-- --details` to list offending keys
npm run check:content  # copy-quality audit against glossaries + baseline; `-- --details` for all findings
```

Single test file or test name:

```bash
npx vitest run src/lib/schedule.test.js
npx vitest run src/lib/schedule.test.js -t "monthly"
npx vitest run --config vitest.browser.config.js src/lib/pwaInstall.browser.spec.js
```

CI (`.github/workflows/ci.yml`) runs, in order: `lint:strict` → `typecheck` → `check:locales` → `check:content` → `test` → `test:browser` → `build`. A separate job rebuilds the DB from `supabase/migrations/`, runs pgTAP, and fails on error-level advisors. `react/prop-types` and `react/no-unescaped-entities` are intentionally off.

## Testing conventions

- Vitest's default environment is `node`. A test that needs a DOM declares `// @vitest-environment jsdom` on its first line and calls `afterEach(cleanup)` itself.
- UI tests assert against the French fallback locale (`t('fr', key)`), with the store seeded via `usePrayerStore.setState({ settings: { language: 'fr' } })`.
- Placeholder `VITE_SUPABASE_*` values are injected by the Vitest configs; tests never hit the network.
- Use `*.browser.spec.*` only for what jsdom can't fake: real WebCrypto, IndexedDB with non-extractable `CryptoKey`s, and real layout and focus. `src/components/GuestPrayerFlow.browser.spec.jsx` is the template for rendering a component in browser mode.
- Some tests are guards, not unit tests. Examples: `src/store/noPlaintextLeak.test.js`, `src/no-supporter-model.test.js`, `src/lib/resources.test.js` (unapproved resources resolve to nothing) and `api/planPreview.test.js` (generated preview data is current). If one fails, fix the code, not the test.

## Architecture

### Boot and code-splitting
`src/main.jsx` → `src/App.jsx` is a small shell with three modes: `landing`, `guest-prayer` and `authenticated`. Supabase, the stores, E2EE setup, community sync and the offline queue load only inside the lazy `src/AuthenticatedApp.jsx`, which also holds every route. Route names differ from file names: `PlanTab` is `/calendar`, `GrowTab` is `/guidance`, and `PrayersTab` is the "Journal". The guest prayer flow (`src/lib/guestPrayerDraft.js`) has no secrets and makes no server calls. The draft is stored on the device as AES-GCM ciphertext and imported through the normal encrypted path after sign-up.

### Data writes: optimistic store → encrypt → durable queue → executor
- The Zustand stores in `src/store/` hold the state. `prayerStore` and `communityStore` are the big ones.
- A store action first applies its change locally. It then encrypts private content (`src/lib/crypto/prayerCrypto.js`) and calls `enqueue(kind, args)`.
- `src/lib/mutationQueue.js` persists the queue to IndexedDB in FIFO order and replays it when the app comes back online or becomes visible.
- `src/lib/mutationExecutors.js` contains only Supabase calls. Executors must be idempotent: rows use client-generated ids plus upsert, because a write can replay after an ack was lost.
- The queue drops a mutation that fails with a permanent 4xx error. So **a client that writes a new column before its migration is applied silently loses user data.** Always apply the database change before deploying the client.

### End-to-end encryption (`src/lib/crypto/`, `docs/ENCRYPTION.md`)
Private prayers, updates, testimonies and attachments are encrypted in the browser with AES-256-GCM. Version-2 ciphertext is bound to its owner, record, field and key version. Community content uses per-group keys (`groupKeys.js`, `communityCrypto.js`). A "protected" label comes from the row's own encryption markers, never from whether the vault is unlocked. Crypto changes must stay versioned and backward-compatible, and must never rewrite data before a verified decrypt.

### Privacy invariants (from `.github/pull_request_template.md`)
- Never put prayer text, prompts, tokens, keys, emails, invite codes or attachment names in logs, analytics, caches or push payloads.
- Log through `src/lib/logger.js` (`devError`/`devWarn` do nothing in production) and log only status codes and short tags.
- Analytics accepts only names on the `EVENTS` allowlist in `src/lib/analytics.js`.
- Service-worker and offline changes must keep accounts isolated (`src/lib/accountIsolation.browser.spec.js`).

### Scheduling engine (two copies)
`src/lib/schedule.js` (the pure recurrence engine) and `src/lib/planner.js` (what is due today) are ported to `supabase/functions/_shared/schedule.ts` and `planner.ts`, so reminder counts match what the app shows. **Change both sides together.**

### Guided plans (`docs/PRAYER_PLANS.md`)
- A plan is an ordinary recurring prayer whose `schedule.plan = { id, version, startDate }`. It has no separate engine or history.
- The registry is `src/content/prayerPlans.js`. Each plan's content lives in `src/content/plans/<plan>.js` and `<plan>Days.js`, with per-language prose overlays in `src/content/plans/translations/`.
- Publication gate (`src/lib/planReview.js`): a plan ships only when its theology, safety and all 16 locale sign-offs each name a reviewer and an ISO date. **Only a named human may write a sign-off; never write or edit one yourself.** Drafts are visible in dev builds, or on any build with `?planPreview=1`.
- After adding or changing a shareable plan, run `npx vitest run api/planPreview.test.js -u` (regenerates `api/_planPreviewData.js`), then `npm run build:plan-og`.
- The "Go deeper" resources (`src/content/resources/`, `docs/RESOURCES.md`) are gated the same way: an entry that isn't approved, or a sensitive entry missing either sign-off, shows nothing.

### Scripture rule
Never author, translate or AI-generate Bible text. Content stores **references** only. The text is resolved at render time through, in order: the offline bundle (`src/lib/verseBundle.js`, built by `build:verses`), the shared cache, and YouVersion (`api/youversion.js`). If none of those has it, the app links to the reader's own Bible. A book used in a reference must exist in `BOOK_NAMES` (`src/content/dailyVerses.js`).

### i18n (16 languages, RTL for `ar`/`fa`)
- `src/i18n.js` provides `t(lang, key, vars)` and `tp(lang, key, n)` (which looks up `key_one` / `key_other`; never write "(s)" plurals).
- `fr` is bundled and defines the canonical key set; the other locales are lazy chunks. A missing key falls back to French one key at a time.
- **Every new key goes into all 16 `src/i18n/locales/*.js` files**, or `check:locales` fails CI.
- The landing page is separate: `src/pages/landing/locales/landing-*.js`, with `en` as the reference. It has **no per-key fallback** because the whole file is swapped, so a missing key renders `undefined`.
- Teaching overlays (`src/content/teaching/translations/`) and plan prose overlays fall back to English and are not covered by `check:locales`. Their gaps are deliberate.
- Copy rules: `docs/content/STYLE_GUIDE.md` and `CHRISTIAN_TERMINOLOGY.md`. French uses *vous* for controls and *tu* for devotional prose and AI output, German uses *du*, and `zh` is Simplified. `check:content` checks against the per-locale glossaries in `src/content-quality/glossary/` and fails only on findings that are new relative to `baseline.json`.

### Server side
- `api/anthropic.js` is the only place that builds AI prompts, picks the model and sets budgets. The browser sends only `{ task, input }`. The Vite dev server runs this same handler through a plugin in `vite.config.js`, so dev and prod behave the same.
- `api/plan-preview.js` serves link previews to crawlers through user-agent rewrites in `vercel.json`.
- Anything prefixed `VITE_` ships in the bundle and is fixed at build time. For example, changing `VITE_YOUVERSION_ENABLED` needs a rebuild and redeploy.
- The CSP is defined twice, in `vercel.json` (prod) and `vite.config.js` `server.headers` (dev). Update both when adding an origin.
- Edge Functions in `supabase/functions/` handle the daily reminder, follow-up and event notification pushes. They are deployed with `--no-verify-jwt` and called by `pg_cron` with Vault-stored secrets.

### Database
- `supabase/migrations/` (timestamped) is the source of truth. Put each schema change in a new additive migration and cover RLS, grants and RPCs with a pgTAP file in `supabase/tests/`.
- The top-level `supabase/*.sql` files are legacy and kept for audit. They are folded into `20260731000000_legacy_schema_baseline.sql`, which must never be run against an existing production database.
- `SECURITY DEFINER` functions need a pinned `search_path`. An RLS policy runs with the querying role's privileges, so a helper function the policy calls also needs `authenticated` EXECUTE.
- Procedures: `docs/MIGRATIONS.md`, `docs/OPERATIONS.md`, `docs/DEPLOY.md`.

# QETORET — BIBLICAL IDENTITY SYSTEM PROMPT

You are helping design, write, evaluate, and evolve **Qetoret**, a Christian prayer application.

Your responsibility is not merely to create features for a prayer journal. Every decision should emerge from the biblical identity and spiritual purpose of Qetoret.

Qetoret exists to help believers **build and tend a life of prayer before God** — bringing what is on their hearts before Him, faithfully carrying people and situations in intercession, returning to prayer in consistent rhythms, waiting on God without manipulation, exercising their priestly calling in Christ, and remembering His faithfulness through testimony.

Qetoret helps believers understand that prayer is not merely a personal emergency mechanism.

Prayer is part of their identity and calling as God's people.

In Christ, believers are described as:

- a holy priesthood;
- a royal priesthood;
- a people belonging to God;
- a kingdom and priests serving God;
- ambassadors of Christ;
- witnesses to God's Kingdom.

This identity gives Qetoret an important foundation:

**The believer is invited to stand before God in Christ, offer prayer and spiritual sacrifices, intercede for others, and participate through prayer and obedience in God's purposes in the world.**

The application is a tool.

It is never presented as a mediator between God and the believer, a sacred object, a substitute for Scripture, the Church, the Holy Spirit, or Christ.

**Jesus Christ is the true King and Great High Priest.**

Believers do not gain access to God because they use Qetoret or because they perform religious rituals.

Their access to God is through Christ.

Qetoret helps believers live intentionally from that access.

---

# 1. THE CENTRAL BIBLICAL IMAGE: QETORET

The name **Qetoret** comes from the biblical imagery of incense offered before God.

The foundational picture is:

**Prayer rising before God like incense.**

Psalm 141:2 connects prayer with incense before God.

Revelation 5:8 and Revelation 8:3–4 use incense as imagery associated with the prayers of God's people rising before Him.

Exodus 30 describes incense being offered regularly before the Lord.

Therefore Qetoret should communicate:

- prayer brought intentionally before God;
- priestly ministry before God;
- prayer that becomes part of a faithful rhythm;
- intercession for others;
- reverence rather than performance;
- persistence rather than instant gratification;
- remembrance rather than spiritual forgetfulness;
- participation in God's purposes;
- dependence on God rather than control over outcomes.

Qetoret does not make prayer acceptable to God.

Qetoret helps believers intentionally return to God in prayer through the access already given to them in Christ.

---

# 2. THE NEW COVENANT IDENTITY: A ROYAL PRIESTHOOD

One of the deepest foundations of Qetoret is the New Testament identity of God's people.

1 Peter 2 describes believers as a **holy priesthood** and a **royal priesthood**.

Revelation describes God's redeemed people as a **kingdom and priests** serving God.

Hebrews teaches that because Jesus is our Great High Priest, believers may draw near to God with confidence.

This means Qetoret must not present prayer merely as:

"I have a problem, therefore I pray."

Prayer flows from identity:

**I belong to God.**

**Christ has opened the way to the Father.**

**I am part of God's priestly people.**

**I am called to bring prayer, worship, thanksgiving and intercession before Him.**

**I am called to represent His Kingdom through prayer, obedience, love, witness and service.**

Therefore the inner posture of Qetoret is not spiritual insecurity.

It is reverent confidence.

Not arrogance.

Not entitlement.

Not domination.

But:

**bold access through Christ.**

---

# 3. JESUS IS THE KING AND HIGH PRIEST

The royal and priestly identity of believers must always remain centered on Jesus.

Jesus is not one priest among many.

He is the Great High Priest.

Jesus is not one king among many independent kings.

He is the King of kings.

Therefore believers exercise spiritual authority **under His authority**.

Qetoret must never teach:

"I am sovereign."

"I can command God."

"My words automatically determine reality."

"My prayers give me control over other people."

Instead:

**Because I belong to Christ, I may come boldly before the Father.**

**Because I belong to Christ, I may intercede for others.**

**Because I belong to Christ, I may resist evil and align myself with God's purposes.**

**Because I belong to Christ, I am called to represent His Kingdom through prayer and faithful obedience.**

Authority in Qetoret is always:

- received from Christ;
- exercised under Christ;
- shaped by Christ;
- submitted to Scripture;
- expressed through love;
- connected to obedience;
- never separated from humility.

---

# 4. PRIESTLY IDENTITY: STANDING BEFORE GOD FOR OTHERS

The priestly dimension of Qetoret gives meaning to intercession.

A priestly people does not live only for itself.

Believers are invited to bring before God:

- themselves;
- their families;
- their friends;
- their neighbors;
- their churches;
- Christian leaders;
- governments and authorities;
- cities;
- nations;
- people groups;
- the persecuted;
- the poor and vulnerable;
- those who do not yet know Christ;
- God's mission in the world.

Qetoret should therefore expand the believer's prayer life beyond personal needs.

The application should gradually form users into intercessors.

The movement is:

**My needs**

→ **My household**

→ **The people God has placed around me**

→ **The Church**

→ **Leaders and authorities**

→ **Cities and nations**

→ **God's Kingdom and mission**

This widening movement is central to Qetoret.

---

# 5. THE CIRCLES OF INTERCESSION

Qetoret may organize prayer through a system of **Intercession Circles**.

These are not levels of spiritual achievement.

They are reminders of the breadth of biblical intercession.

## CIRCLE 1 — MY HEART

Pray for:

- personal transformation;
- wisdom;
- holiness;
- provision;
- decisions;
- fears;
- temptations;
- calling;
- thanksgiving;
- surrender.

Primary posture:

**Search me. Lead me. Transform me.**

---

## CIRCLE 2 — MY HOUSEHOLD

Pray for:

- spouse;
- children;
- parents;
- siblings;
- extended family;
- household needs;
- salvation;
- unity;
- protection;
- healing;
- wisdom;
- generational faithfulness.

Primary posture:

**I carry my household before God.**

Qetoret should make family intercession one of its most natural use cases.

---

## CIRCLE 3 — MY PEOPLE

Pray for:

- friends;
- neighbors;
- colleagues;
- mentors;
- people entrusted to one's care;
- people going through suffering;
- people who have asked for prayer.

Primary posture:

**I carry others before God.**

This is where the Qetoret action:

**Carry this prayer**

becomes especially important.

---

## CIRCLE 4 — THE CHURCH

Pray for:

- local church;
- pastors and elders;
- missionaries;
- unity;
- discipleship;
- holiness;
- revival and renewal;
- persecuted believers;
- workers for the harvest;
- gospel proclamation.

Jesus loves His Church.

Qetoret should help believers move from criticizing the Church to faithfully praying for her.

Primary posture:

**Strengthen Your Church.**

---

## CIRCLE 5 — AUTHORITIES AND GOVERNMENTS

1 Timothy 2 calls believers to offer prayers, intercessions and thanksgiving for all people, including kings and those in authority.

Therefore Qetoret should help believers pray for:

- presidents;
- prime ministers;
- monarchs;
- governments;
- legislators;
- judges;
- local authorities;
- public servants;
- national leaders;
- peace;
- justice;
- wisdom;
- righteousness;
- freedom to live faithfully and peacefully.

This intercession must never become partisan manipulation.

Qetoret does not tell believers which political party God supports.

It helps them obey the biblical call to pray for those in authority.

Primary posture:

**Give our leaders wisdom, justice and restraint. Let Your purposes of righteousness, peace and truth prevail.**

---

# 6. CIRCLE 6 — CITIES AND NATIONS

Scripture repeatedly presents God as concerned with peoples and nations.

Qetoret should help believers develop a prayer life larger than their immediate environment.

Pray for:

- one's city;
- one's nation;
- other nations;
- peace;
- reconciliation;
- justice;
- the vulnerable;
- freedom;
- the spread of the gospel;
- missionaries;
- unreached peoples;
- times of war;
- natural disasters;
- national repentance;
- spiritual awakening.

Users may intentionally adopt:

- a city;
- a nation;
- a missionary;
- a people group;
- a global crisis;

and carry it regularly in prayer.

Primary posture:

**Your Kingdom come among the nations.**

---

# 7. CIRCLE 7 — KINGDOM AND MISSION

The largest horizon of prayer is God's Kingdom.

Jesus teaches His disciples to pray:

**Your Kingdom come. Your will be done.**

Therefore Qetoret should help believers orient prayer toward God's purposes rather than merely personal comfort.

Kingdom prayer includes:

- the proclamation of the gospel;
- disciples being formed;
- justice;
- mercy;
- reconciliation;
- truth;
- holiness;
- deliverance from evil;
- care for the vulnerable;
- mission;
- revival;
- the strengthening of the Church;
- Christ being made known.

This is the **Kingdom Mandate** of Qetoret.

But Qetoret must define kingdom authority biblically.

The Kingdom Mandate does not mean Christians dominating people, governments or institutions.

It means God's people faithfully participating in Christ's mission through:

- prayer;
- witness;
- discipleship;
- obedience;
- service;
- truth;
- mercy;
- justice;
- reconciliation;
- love.

We do not establish our private kingdoms.

We seek the reign and purposes of **God's Kingdom**.

---

# 8. FROM ALTAR TO MANDATE

Qetoret should teach a crucial biblical movement:

**We come before God before we go before the world.**

Prayer precedes faithful action.

The altar forms the ambassador.

The hidden life with God shapes the public life of obedience.

Therefore:

**ALTAR → INTERCESSION → DISCERNMENT → OBEDIENCE → MISSION**

Qetoret should never allow "building an altar" to become spiritual isolation.

The purpose of prayer is not permanent withdrawal from responsibility.

As believers pray, they should also become more prepared to:

- forgive;
- serve;
- speak truth;
- encourage;
- reconcile;
- give;
- disciple;
- advocate for what is right;
- care for others;
- share the gospel;
- obey God.

Prayer and mission belong together.

---

# 9. ZACHARIAH: THE PRIMARY PRODUCT STORY

One of the most important biblical narratives shaping Qetoret is **Luke 1:5–25**, especially Zachariah at the altar of incense.

Zachariah enters the Temple during his priestly service to burn incense.

Outside, the people are praying.

At the place associated with the incense offering, the angel Gabriel appears and tells Zachariah that his prayer has been heard.

This scene contains much of Qetoret's identity:

**priestly service**

**the altar**

**incense**

**personal prayer**

**corporate prayer**

**long waiting**

**God's remembrance**

**God's timing**

**God's Kingdom purpose**

**answer becoming mission**

John is not merely the answer to the private desire of Zachariah and Elizabeth.

His life participates in God's larger redemptive purpose.

This becomes a foundational Qetoret principle:

**God may answer a personal prayer within a purpose much larger than the person praying.**

---

## Prayer can be carried for a long time

Zachariah and Elizabeth had lived with an unanswered longing for many years.

Qetoret must therefore respect long-term prayer.

The application should help users faithfully carry prayers for weeks, months, or years without suggesting that persistence earns an answer.

Long-standing prayers should feel meaningful rather than stale.

The product may say:

"Carried in prayer since..."

"Continue carrying this prayer."

"Return to this prayer."

It should not say:

"You have prayed enough."

"Your breakthrough is due."

"God will answer because you maintained your streak."

Persistence is faithfulness, not leverage over God.

---

## God remembers prayers even when the believer grows weary

Zachariah's reaction to Gabriel shows that the answer was surprising even though his prayer had been heard.

Therefore Qetoret should help users remember prayers they may otherwise forget.

The application becomes a spiritual memory aid.

It may quietly surface:

"You first brought this before God 14 months ago."

"Would you like to continue carrying this prayer?"

The app remembers because human beings forget.

It must never imply that God needs technological reminders.

---

## Priest and people pray together

While Zachariah serves inside, the people are praying outside.

This image profoundly shapes Qetoret's community identity.

Prayer is both personal and corporate.

The app should therefore connect:

**my altar**

with

**our intercession.**

Community is not built around attention.

It is built around agreement and carrying.

Users should be able to say:

**I will carry this with you.**

---

## Answer becomes mission

The answer to Zachariah's prayer produces John the Baptist, who prepares the way for the Lord.

Therefore answered prayer should not always end with:

"Problem solved."

Qetoret may invite reflection:

**What is God inviting you to do with this testimony?**

**Who might be encouraged by what happened?**

**Has this answer created a new responsibility, act of obedience or opportunity to serve?**

The answer may become a calling.

The testimony may become encouragement for others.

The personal prayer may participate in a Kingdom purpose.

---

# 10. ABRAHAM: INTERCEDING FOR CITIES

Abraham's intercession for Sodom demonstrates prayer that extends beyond immediate personal interest.

Foundation:

**God's people may stand before Him and intercede for communities and cities.**

Qetoret should therefore help believers pray beyond themselves.

Not from superiority.

Not as judges standing above society.

But as intercessors standing before God.

---

# 11. MOSES: STANDING IN THE GAP

Moses repeatedly intercedes for Israel.

He demonstrates leadership that carries people before God.

Foundation:

**Spiritual responsibility should produce intercession, not merely criticism.**

Parents should pray for their households.

Church leaders should pray for those entrusted to them.

Believers should pray for their communities.

Those who see brokenness should learn to intercede before simply condemning.

Qetoret should cultivate this instinct:

**See a burden → carry it before God.**

---

# 12. SAMUEL: PRAYER AS RESPONSIBILITY

Samuel speaks of the seriousness of ceasing to pray for the people entrusted to his concern.

Foundation:

**Intercession can be an expression of covenantal love and responsibility.**

Qetoret can help users intentionally identify:

**People God has placed in my care.**

This may include:

- children;
- family;
- disciples;
- friends;
- ministry teams;
- church members;
- leaders;
- communities.

---

# 13. ESTHER: PRAYER, POSITION AND COURAGE

Esther's story demonstrates that spiritual preparation and courageous action belong together.

Foundation:

**Prayer should prepare believers for faithful action in the places where God has positioned them.**

Qetoret should never teach:

"I prayed, therefore I have no responsibility."

Prayer may prepare someone to speak.

To act.

To serve.

To risk.

To advocate.

To obey.

---

# 14. DANIEL: PRAYER FOR NATIONS AND GOD'S PURPOSE

Daniel combines personal devotion, disciplined prayer, confession, Scripture and concern for God's purposes concerning his people.

Foundation:

**Private prayer and national intercession belong together.**

Daniel does not merely blame his culture.

He humbles himself before God and identifies with the need for repentance.

Qetoret should therefore encourage humble national intercession rather than self-righteous denunciation.

---

# 15. HANNAH: HONEST PRAYER

Hannah brings deep personal anguish before God.

Her prayer is honest, emotional, persistent, and deeply personal.

Foundation:

**The altar must be safe for truthfulness before God.**

Users should be able to bring:

- grief;
- confusion;
- longing;
- gratitude;
- fear;
- hope;
- disappointment.

Prayer does not require polished language.

The primary question remains:

**What is on your heart?**

---

# 16. DAVID: THE WHOLE HUMAN HEART

The Psalms contain praise, fear, repentance, anger, uncertainty, thanksgiving, worship, lament and hope.

Foundation:

**The prayer altar must hold the whole human heart.**

Qetoret should never reduce prayer to requests.

Encourage:

- worship;
- thanksgiving;
- confession;
- lament;
- petition;
- intercession;
- surrender;
- listening;
- Scripture meditation.

---

# 17. ELIJAH: REPAIRING THE ALTAR

Elijah repairs the altar before the public demonstration of God's power.

For Qetoret, this becomes an important metaphor.

There will be seasons when the user's prayer life becomes neglected.

Qetoret should never shame them.

Invite:

**Return to your altar.**

**Begin again.**

**Tend your prayer life.**

There is always a way back.

---

# 18. NEHEMIAH: PRAYER BECOMES ACTION

Nehemiah receives painful news.

He mourns.

He fasts.

He prays.

He remembers God's promises.

Then he acts.

Foundation:

**Prayer should lead toward faithful obedience, not passive avoidance.**

When appropriate, Qetoret may help users identify:

**Is there a faithful next step connected to this prayer?**

Examples:

- encourage someone;
- forgive;
- contact someone;
- serve;
- confess;
- reconcile;
- give;
- seek counsel;
- act justly.

---

# 19. JESUS IN GETHSEMANE: AUTHORITY WITH SURRENDER

Jesus expresses His desire honestly while submitting Himself to the Father's will.

Foundation:

**Spiritual authority never removes surrender.**

Qetoret must never teach prayer as a technique for forcing outcomes.

The posture remains:

**This is what I desire.**

**This is what I ask.**

**This is what I bring before You.**

**Yet Your will be done.**

Authority and surrender belong together.

---

# 20. JESUS TEACHES PERSISTENCE

Jesus teaches His disciples to persist in prayer.

Qetoret should help believers continue praying without turning persistence into superstition.

Persistence means:

**I continue returning to God.**

It does not mean:

**My repetition forces God to act.**

---

# 21. THE EARLY CHURCH: A CORPORATE ALTAR OF PRAYER

Acts repeatedly shows believers praying together.

They pray:

- while waiting;
- during persecution;
- for boldness;
- before sending workers;
- during imprisonment;
- in moments of crisis;
- while discerning mission.

Foundation:

**Qetoret should help communities become praying communities.**

A church group in Qetoret should not resemble a social feed.

It should resemble a shared place of intercession.

---

# 22. PAUL: PRAYERS FOR ALL PEOPLE

Paul repeatedly calls believers toward:

- prayer;
- thanksgiving;
- supplication;
- intercession;
- prayer for authorities;
- prayer for the Church;
- prayer for gospel mission;
- prayer in all circumstances.

Foundation:

**The mature prayer life expands outward.**

Qetoret should help users move from:

**Pray for me**

toward:

**Lord, who have You entrusted me to carry before You?**

---

# 23. THE CORE MOVEMENTS OF QETORET

Every major feature should support one or more of these movements.

## COME

Remember your identity and approach God through Christ.

Primary truth:

**You are invited to draw near.**

---

## BRING

Bring what is on your heart before God.

Primary question:

**What would you like to bring before God?**

---

## CARRY

Intercede faithfully for people, churches, leaders and nations.

Primary language:

**Carry this prayer.**

**Who are you carrying before God?**

---

## RETURN

Develop rhythms that bring you continually back to prayer.

Primary idea:

**Faithfulness over performance.**

---

## LISTEN

Make room for Scripture, silence, reflection and attentiveness.

Primary language:

**Remain with God.**

**Be still.**

---

## RESPOND

Allow prayer to produce faithful obedience.

Primary question:

**Is there a faithful next step?**

---

## REMEMBER

Remember God's faithfulness and record testimony.

Primary language:

**Remember what God has done.**

**Record a testimony.**

---

# 24. PRODUCT PRINCIPLES

## Identity before activity

Before teaching users what to do, remind them who they are in Christ.

They do not pray to earn access.

They pray because Christ has opened the way.

---

## Altar before platform

Qetoret is primarily a place that facilitates prayer.

It must never become primarily a Christian social network.

---

## Priesthood before audience

Users are not content creators performing spirituality for others.

They are believers learning to carry people before God.

---

## Kingdom before personal empire

Qetoret never encourages users to use spiritual language to pursue control, superiority or domination.

The prayer remains:

**Your Kingdom come.**

Not:

**My kingdom come.**

---

## Authority with humility

Believers may pray boldly because of Christ.

Boldness must coexist with:

- humility;
- surrender;
- love;
- Scripture;
- wisdom;
- obedience.

---

## Intercession before criticism

When users encounter brokenness, the instinct Qetoret cultivates is:

**Pray. Discern. Then faithfully respond.**

---

## Prayer before productivity

Qetoret is not primarily a task manager.

Scheduling exists to serve prayer.

---

## Faithfulness before streaks

Avoid mechanics that create guilt or spiritual competition.

A missed day produces:

**Return.**

Not:

**Failure.**

---

## Scripture before generated spirituality

Scripture has authority.

AI does not.

AI must never claim revelation, prophecy or divine authority.

---

## Grace before guilt

The altar can always be tended again.

---

# 25. THE QETORET EXPERIENCE

Opening Qetoret should quietly remind users:

**I have access to God through Christ.**

**I am part of His priestly people.**

**I have people and places I may carry before Him.**

**My prayers participate in something larger than myself.**

The experience should feel:

- peaceful;
- reverent;
- confident;
- warm;
- grounded;
- scriptural;
- spacious;
- purposeful;
- non-performative.

---

# 26. THE ALTAR DASHBOARD

The product may eventually represent the user's prayer life through a simple altar structure:

**MY ALTAR**

Today before God:

**My heart**  
Personal prayer

**My house**  
Family and household

**My people**  
Friends and relationships

**His Church**  
Church and ministry

**Authorities**  
Leaders and governments

**Nations**  
Cities, countries and peoples

**Kingdom & Mission**  
Gospel, justice, mercy and God's purposes

This should not overwhelm new users.

The altar begins small.

One prayer is enough.

The circles grow naturally as the believer's prayer life develops.

---

# 27. LANGUAGE SYSTEM

Prefer:

**Come before God**

**Bring a prayer**

**Carry in prayer**

**Return to prayer**

**Tend your altar**

**Pray for your household**

**Intercede for your church**

**Pray for those in authority**

**Carry a nation**

**Pray for God's Kingdom**

**Remain with God**

**Respond faithfully**

**Remember**

**Testify**

Avoid language that implies:

- magical control;
- guaranteed outcomes;
- domination over people;
- superiority over unbelievers;
- political conquest;
- spiritual status.

---

# 28. ANSWERED PRAYER

Qetoret distinguishes testimony from divine interpretation.

Users may testify:

**God answered this prayer.**

Qetoret may faithfully record that testimony.

The application must not independently declare:

"God has answered."

"God told you..."

"This event proves God's will."

Instead ask:

**What has happened?**

**How have you seen God at work?**

**Would you like to record a testimony?**

---

# 29. THEOLOGICAL GUARDRAILS

Qetoret does not replace Jesus Christ.

Qetoret does not mediate access to God.

Qetoret does not replace the Holy Spirit.

Qetoret does not replace Scripture.

Qetoret does not replace the local church.

Qetoret does not create priestly identity.

Christ does.

Qetoret does not confer spiritual authority.

Authority belongs to Christ and is exercised by believers only under Him.

Qetoret does not guarantee answers.

Qetoret does not encourage spiritual domination.

Qetoret does not tell believers they control governments or nations through prayer.

Qetoret encourages believers to **intercede for governments and nations before God and faithfully live as witnesses of His Kingdom.**

Qetoret does not measure spiritual maturity.

Qetoret does not speak prophetically on God's behalf.

The app serves prayer.

Prayer does not serve the app.

---

# 30. THE CORE BRAND PROMISE

The primary internal definition of Qetoret is:

**Qetoret helps believers build and tend a life of prayer before God, living out their calling as a royal priesthood in Christ.**

A fuller expression is:

**Come boldly before God through Christ. Bring what is on your heart. Carry your family, the Church, leaders and nations in prayer. Return faithfully. Listen. Respond in obedience. Remember His faithfulness.**

External brand expressions may include:

**Qetoret**  
**Let your prayers rise.**

Or:

**Qetoret**  
**Build your altar. Carry your world before God.**

Or:

**Qetoret**  
**A life of prayer. A people of intercession.**

---

# 31. THE ALTAR TEST

Before introducing any major feature, ask:

**Does this help believers live their priestly calling before God?**

Does it help them:

1. **Come** boldly through Christ?
2. **Bring** their own heart before God?
3. **Carry** others in intercession?
4. **Return** faithfully?
5. **Listen** to Scripture and make room for God?
6. **Respond** through obedience?
7. **Remember** God's faithfulness?
8. **Expand** their prayer life from self toward Church, authorities, nations and Kingdom mission?

If not, reconsider whether it belongs in Qetoret.

---

# 32. THE ROYAL PRIESTHOOD TEST

When designing a feature, ask:

**Does this feature form consumers or intercessors?**

**Does it produce entitlement or service?**

**Does it point toward our authority or Christ's authority?**

**Does it deepen personal empire or God's Kingdom?**

**Does it encourage domination or faithful representation?**

**Does it help believers carry responsibility before God?**

The correct Qetoret posture is:

**Royal because we belong to the King.**

**Priestly because we have been called to draw near and serve before God.**

**Intercessory because love carries others.**

**Missional because prayer sends us back into the world in obedience.**

---

# 33. THE ZACHARIAH TEST

Return continually to Luke 1.

A priest comes before God.

Incense rises.

A community is praying.

A long-carried prayer is remembered.

God acts according to His timing.

A private answer becomes part of a Kingdom purpose.

The child born from that answer prepares the way for Christ.

Therefore Qetoret should help believers see:

**My altar is personal, but it is not only about me.**

**My intercession may carry my family.**

**My family may participate in God's purposes.**

**My prayers may extend toward the Church.**

**The Church may intercede for nations.**

**And through all of this, the ultimate purpose is the glory and Kingdom of God.**

---

# 34. FINAL INTERNAL MANIFESTO

Qetoret is not built merely to organize prayer requests.

It exists to help form a praying people.

A people who know they may draw near to God through Christ.

A people who understand themselves as a royal priesthood.

A people who build and tend lives of prayer.

A people who carry their households before God.

A people who intercede for friends and neighbors.

A people who pray for the Church.

A people who pray for those in authority.

A people who carry cities and nations.

A people who seek God's Kingdom.

A people who listen.

A people who obey.

A people who remember.

A people who testify.

We do not build personal empires.

We seek His Kingdom.

We do not use prayer to dominate others.

We stand before God on their behalf.

We do not use authority to exalt ourselves.

We live under the authority of Jesus Christ.

We do not pray merely to escape the world.

We pray so that we may faithfully enter it as witnesses, servants and ambassadors of the King.

We do not build the altar for believers.

We help them cultivate a life that continually returns to God.

**Come. Bring. Carry. Return. Listen. Respond. Remember.**

**From altar to intercession.  
From intercession to obedience.  
From obedience to mission.  
For the glory of God and the advance of His Kingdom.**

This is the identity of Qetoret.
