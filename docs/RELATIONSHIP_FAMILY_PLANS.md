# Relationships & Family plans

This feature extends the existing guided-prayer engine. It does not introduce a
second plan, Scripture, session, notes, scheduling, or resource system. Starting
any of these plans creates one ordinary recurring prayer, so the existing
Scripture reader, **Pray now** session, written/voice notes, history, reminders,
offline behavior, and completion flow continue to apply.

## Catalogue

| Plan id | Title (en) | Audience | Length | Purpose |
|---|---|---:|---:|---|
| `preparing21` | Single: Preparing in Prayer for Marriage | single believers | 21 days | seek God and grow without assuming marriage |
| `covenant21` | Engaged: Preparing for Marriage | engaged couples | 21 days | prepare for covenant and marriage, not only a wedding |
| `marriage30` | Married: Praying for Our Marriage | married couples | 30 days | a renewable rhythm for spouse, self, and marriage |

Each title names its life stage, because the title is the only thing that
travels: it becomes the prayer's own title in the Journal, the line in an
invitation, and the label on a group's shared plan. The catalogue used to carry
a separate "For singles / For engaged couples / For married couples" line under
the title; it is gone, and the three `plan*Audience` keys with it. All three
titles are authored in **all 16 locales**, like every other plan string.

These are contexts for faithful Christian life, not stages of spiritual rank.
The singles plan restores a compact pre-start choice sheet with only role
wording and optional growth areas. It no longer asks what season the reader is
in: that answer was stored and read by nothing, so the question and its copy are
gone from all 16 locales.

## Engaged: `covenant21`

The 21 days follow the requested Scripture-centered curriculum: Christ first;
covenant; service and character; expectations; communication and conflict;
repentance and forgiveness; trust; sexual integrity; stewardship; work;
families and boundaries; friendship; shared spiritual rhythms; church;
children without guarantees; suffering; hospitality and mission; optional role
reflection; and surrender.

Personalization is offered **after** the plan starts, from the plan's own day,
and can be reopened for the life of the run. It may link an existing Praystead
person, accept a first/display name, or remain generic. The user explicitly
chooses private use or optional activities together and explicitly chooses
husband, wife, or general role wording. No choice is inferred. A wedding date is
not collected because no calm pacing or reminder behavior consumes it;
collecting unused relationship data would add risk without helping the plan.

`conversationPrompt` renders **Talk together**, and `prayTogether` renders a
short instruction that works even when the other person has no account. Neither
asks the user to record an answer.

## Married: `marriage30`

The foundational 30-day plan repeatedly directs prayer toward:

- the spouse's good before God;
- the reader's own repentance, character, and responsibility;
- the health and faithfulness of the marriage.

It covers Christ, gratitude, friendship, character, communication, listening,
conflict, forgiveness, trust, emotional and sexual intimacy, faithfulness,
money, work/rest, spiritual rhythms, prayer, church/community, family
boundaries, hospitality, service, difficult seasons, health, decisions,
contentment, time, parenting when applicable, children when named, home culture,
mission/generosity, and surrender. Completion is not a score, diagnosis, or
certificate; the user may start a new run while old prayer history remains.

### Optional family layer

The base plan is complete without children. A married couple is already a
family, and prayer for the spouse, for one's own growth and for the marriage is
the plan itself — those three used to appear as pre-ticked boxes, which promised
a choice the plan could not honour, and they are no longer offered as options.
Only the genuinely optional layers remain: **children**, **home**, and
**extended family**, none of them selected by default.

Only after **Our children** is selected can a user add first/display names. No
age, birthday, school, location, gender, medical detail, or contact account is
requested. Days 26 and 27 add child prayer content for each configured child;
no empty child block or skip prompt appears otherwise. Each child prayer also
turns toward the parent's wisdom and avoids claiming that prayer guarantees the
child's future choices. The small `withChildren` extension is reusable by a
future family/children plan without creating a separate family engine now.

## Personalization and privacy

Names and family choices are normalized by `planPersonalization.js` and stored
per account and per plan-run id by `planPersonalizationStorage.js`. The value is
AES-GCM ciphertext backed by a non-extractable Web Crypto key in IndexedDB; it
is never placed in localStorage, the prayer schedule, the plan catalogue,
Supabase, or analytics. If IndexedDB cannot persist a non-extractable key, the
preference remains encrypted in memory for that session; if encryption itself
is unavailable, the run stays generic. Data is cleared on sign-out and account
deletion.

**What that protection is and is not.** The key is stored in the same IndexedDB
record as the ciphertext it decrypts. Non-extractable means its raw bytes can
never be exported, so the key material cannot be exfiltrated and the value is
not readable by inspecting storage — but any script running on the origin can
call `decrypt` with that handle. This is protection against casual inspection
and key exfiltration, not confidentiality against local code execution. The
guarantee that matters most is the simpler one: these names never leave the
device.

A failed READ (private browsing, a quota error, a blocked database upgrade)
leaves the record alone and the run generic for that session. Only a record that
is the wrong shape, or whose ciphertext fails GCM authentication, is deleted.

Answers can be revised for the life of a run from the prayer's detail page —
correcting a name, adding a child, switching between praying privately and
together — so a typo no longer costs the prayer and its history.

Interpolation strips control characters, the bidi embedding/override characters,
the isolates the renderer itself uses, and the implicit marks LRM/RLM/ALM; it
limits size, and wraps inserted names in Unicode directional isolates so Arabic,
Persian, and mixed-script names cannot reorder surrounding text. Adding a person
or child name does not invite, notify, or link an account.

Written Prayer Notes, formatted notes, voice notes, private reflections,
personal answers, and sensitive disclosures remain part of each user's own
ordinary prayer. Couple participation never reads or copies them.

## Explicit couple participation

Existing friend/group invitation infrastructure is reused. No relationship
status or name starts sharing. `planSharing.js` permits only:

- invitation: plan id, proposed start date, inviter id, recipient id, and
  optional group id;
- group view: aggregate participant count and whether the viewer joined.

Accepting an invitation creates a separate private guided prayer for that
participant. Every path that starts a plan — the Plan tab's own button,
accepting an invitation from the Plan tab or from Community, and joining a plan
a group is praying — goes through `src/lib/startGuidedPlan.js`, so none of them
can skip the review gate. Engaged and married plans finish their own start and
are personalized afterward. A singles start is handed to the Plan tab only long
enough to collect its two optional, prefilled choices before creating the run.

Group participation does not share historical notes or answers.
Leaving deletes only the membership row; the person's prayer, notes, voice
recordings, and history remain untouched. This release intentionally omits
per-spouse daily completion indicators; aggregate participation provides a
lightweight shared signal without adding monitoring or a new progress schema.
There are no duration comparisons, streak competitions, scores, AI judgments,
or relationship-health assessments.

## Localization and RTL

All catalogue, personalization, section, privacy, safety, completion, and status
keys exist in the 16 app locales. The main new key families are `planCovenant*`,
`planMarriage*`, `planCouple*`, `planTalkTogether`, `planPrayTogether`, and the
spouse/self/marriage/child direction headings.

Every day title is present inline in all 16 languages. English and French prose
is authored in source; plan-specific overlays live at
`src/content/plans/translations/{covenant21|marriage30}/<lang>.json`.

**Most of those overlays are not translations yet.** They were generated as one
fixed frame per field, repeated on every day with only the day title slotted in
— structurally complete, and worthless to read. Because `mergePlan` folds an
overlay in and `pick()` then prefers it, serving one would *displace* the
authored English and French. So a plan now lists only the languages that are
genuinely translated:

| Plan | Served | Still structural stubs |
|---|---|---|
| `preparing21` | all 14 | — |
| `covenant21` | de, es, pt, ru | am, ar, fa, hi, id, ja, ko, sw, tl, zh |
| `marriage30` | none | all 14 |

The stub files stay in the repo for translators. A language joins its plan's
`proseTranslations` list only once its overlay is real prose, which
`src/content/plans/translationQuality.test.js` checks: it rejects an overlay
that reuses one day's wording where the source differs, or whose values are one
template with a variable slotted in. Everything not served falls back to the
authored en/fr, which is always the better of the two.

Structural tests enforce day alignment and reject authored Scripture text or
fields the plan does not have; a field an overlay omits is legitimate and simply
falls back. UI uses logical alignment and isolated name interpolation for RTL
layouts.

## Scripture, safety, roles, and resources

Plans store references only. Scripture text continues through the authoritative
reader/cache pipeline. Reflection and prompt prose is visually separated from
Scripture, and **Pray now** stays central.

Conflict, forgiveness, family boundaries, sexual intimacy, betrayal,
pornography/infidelity, and difficult-season days carry contextual safety copy.
Forgiveness never requires silence under abuse or coercion. The content points
outside the app when pastoral, clinical, safeguarding, medical, legal, or
financial expertise is appropriate. Role-specific drafts are small, explicitly
selected, and hidden until their separate review passes.

The resource taxonomy now includes engaged/married relationship, household,
family, crisis, and safety topics. The resolver still shows at most approved,
verified resources in an allowed language. Sensitive resources require named
content and safety sign-offs. Canonical publisher/ministry URLs were verified;
no retailer fallback or invented localized edition was added. Details are in
`docs/RESOURCES.md`.

## Release gate and operations

Version 1 of `covenant21` and `marriage30` has `review.status: 'approved'`,
recording Paul's explicit approval on 2026-09-03 for theology, safety, the
three optional role sections and all current language presentations/fallbacks.
No unfinished prose overlay is enabled. See `docs/CONTENT_APPROVAL_2026-09-03.md`.
Future theological or translated prose must not be approved automatically.

Catalogue visibility is separate from release eligibility. `canUsePlan()` keeps
the curriculum, the Start action, invitations and group adoption of drafts closed for
ordinary readers, and the journey catalogue lists a plan only where it can
actually be opened — so a draft is never a locked card someone taps in vain.

### Review mode

A reviewer has to read a draft in order to correct it, so reading one is a
device setting rather than a content change:

| Where | How |
|---|---|
| Deployed build (phone, prod, preview URL) | open `…/guidance?planPreview=1` once — it sticks on that browser; `?planPreview=0` ends it |
| Development build (`npm run dev`) | drafts are already listed; add `?planPreview=1` to also read unsigned **role reflections** |

Review mode never edits a `review` record and never makes a draft look
approved: the card, the detail modal and each role reflection keep saying that
their review is pending. It stores one device-local flag (`pfm_plan_preview`),
syncs nothing, and needs no build, environment variable or redeploy. Only the
named sign-offs in `review` ever release a plan — an AI must never invent one;
recording a user's explicit named approval is distinct from granting approval.
Group adoption stays reviewed-only regardless, because pinning a draft to a
group wall would push it at people who never asked to review anything.

No database schema, RLS policy, migration, environment variable, background
job, or deployment setting changed for these plans. Existing plan invitation
and group-plan tables are sufficient, so no database test suite is required by
this change. The review metadata is now complete for these versions; a normal
application deployment is still needed to put this local change online.
