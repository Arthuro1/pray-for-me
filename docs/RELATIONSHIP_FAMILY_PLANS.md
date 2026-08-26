# Relationships & Family plans

This feature extends the existing guided-prayer engine. It does not introduce a
second plan, Scripture, session, notes, scheduling, or resource system. Starting
any of these plans creates one ordinary recurring prayer, so the existing
Scripture reader, **Pray now** session, written/voice notes, history, reminders,
offline behavior, and completion flow continue to apply.

## Catalogue

| Plan id | Audience | Length | Purpose |
|---|---:|---:|---|
| `preparing21` | single believers | 21 days | seek God and grow without assuming marriage |
| `covenant21` | engaged couples | 21 days | prepare for covenant and marriage, not only a wedding |
| `marriage30` | married couples | 30 days | a renewable rhythm for spouse, self, and marriage |

These are contexts for faithful Christian life, not stages of spiritual rank.
The singles implementation is unchanged except that its season option now says
**“I'm seeking clarity about marriage.”** The old phrase is prohibited by tests
across all 16 locales.

## Engaged: `covenant21`

The 21 days follow the requested Scripture-centered curriculum: Christ first;
covenant; service and character; expectations; communication and conflict;
repentance and forgiveness; trust; sexual integrity; stewardship; work;
families and boundaries; friendship; shared spiritual rhythms; church;
children without guarantees; suffering; hospitality and mission; optional role
reflection; and surrender.

Onboarding may link an existing Pray4Me person, accept a first/display name, or
remain generic. The user explicitly chooses private use or optional activities
together and explicitly chooses husband, wife, or general role wording. No
choice is inferred. A wedding date is not collected in this release because no
calm pacing or reminder behavior consumes it; collecting unused relationship
data would add risk without helping the plan.

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
family. The onboarding defaults to marriage, spouse, personal growth, and
spiritual life. Home/extended-family emphases and children are opt-in.

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

Interpolation strips control/bidirectional-control characters, limits size,
and wraps inserted names in Unicode directional isolates so Arabic, Persian,
and mixed-script names cannot reorder surrounding text. Adding a person or
child name does not invite, notify, or link an account.

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
participant. Group participation does not share historical notes or answers.
Leaving deletes only the membership row; the person's prayer, notes, voice
recordings, and history remain untouched. This release intentionally omits
per-spouse daily completion indicators; aggregate participation provides a
lightweight shared signal without adding monitoring or a new progress schema.
There are no duration comparisons, streak competitions, scores, AI judgments,
or relationship-health assessments.

## Localization and RTL

All catalogue, onboarding, section, privacy, safety, completion, and status keys
exist in the 16 app locales. The main new key families are `planCovenant*`,
`planMarriage*`, `planCouple*`, `planTalkTogether`, `planPrayTogether`, and the
spouse/self/marriage/child direction headings.

Every day title is present inline in all 16 languages. English and French prose
is authored in source; the other 14 plan-specific overlays live at
`src/content/plans/translations/{covenant21|marriage30}/<lang>.json`. Those
overlays are drafts pending native and theological review. Structural tests
enforce day/field parity and reject authored Scripture text. UI uses logical
alignment and isolated name interpolation for RTL layouts.

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

`covenant21` and `marriage30` deliberately have `review.status:
'needs_review'`. Production access stays closed until Scripture/context,
theology, pastoral safety, role material, and every locale have approved,
named, dated sign-offs. Development preview remains available for reviewers.
Generated theological or translated prose must not be approved automatically.

No database schema, RLS policy, migration, environment variable, background
job, or deployment setting changed for these plans. Existing plan invitation
and group-plan tables are sufficient, so no database test suite is required by
this change. A normal application deployment is needed only after human review
metadata is completed.
