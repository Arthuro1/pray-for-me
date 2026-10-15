// The theological and audience context a plan is written for. A profile makes a
// plan's assumptions explicit; it never rewrites content toward one tradition.
// The plan-quality checks (src/content-quality/planChecks.js) compare the
// authored EN/FR prose against the declared profile and flag what does not fit:
// a disputed topic the plan engages without declaring it, charismatic practice
// in a plan declared non-charismatic, or a practice foreign to its tradition.
// See docs/PRAYER_PLAN_QUALITY.md § Theological profiles.

export const TRADITIONS = ['pentecostal-charismatic', 'broad-evangelical', 'catholic', 'orthodox'];

// Who a plan is written for. Life-stage plans must agree with `lifeStage`.
export const AUDIENCES = ['general-christian', 'seekers', 'singles', 'engaged', 'married', 'parents', 'men', 'women'];

// Questions on which faithful Christian traditions differ. Declaring one tells
// reviewers the plan takes a position (or deliberately keeps to common ground).
export const DISPUTED_TOPICS = [
  'gender-roles', 'deliverance', 'spiritual-gifts', 'hearing-god', 'divine-healing',
  'sexual-ethics', 'divorce-remarriage',
];

export const LIFE_STAGE_AUDIENCE = { single: 'singles', engaged: 'engaged', married: 'married' };

// Qetoret's editorial perspective (docs/content/STYLE_GUIDE.md § Vocabulary):
// written for Pentecostal and charismatic Christians first, in words other
// evangelicals also recognise.
export const DEFAULT_THEOLOGY_PROFILE = Object.freeze({
  tradition: 'pentecostal-charismatic',
  audience: 'general-christian',
  charismatic: true,
  disputedTopics: Object.freeze([]),
});

export function theologyProfile(overrides = {}) {
  return Object.freeze({
    ...DEFAULT_THEOLOGY_PROFILE,
    ...overrides,
    disputedTopics: Object.freeze([...(overrides.disputedTopics || [])]),
  });
}

// Problems with a declared profile, as short messages; empty when valid.
export function theologyProfileProblems(profile, { lifeStage = null } = {}) {
  if (!profile) return ['No theologyProfile declared.'];
  const problems = [];
  if (!TRADITIONS.includes(profile.tradition)) problems.push(`Unknown tradition "${profile.tradition}".`);
  if (!AUDIENCES.includes(profile.audience)) problems.push(`Unknown audience "${profile.audience}".`);
  if (typeof profile.charismatic !== 'boolean') problems.push('charismatic must be true or false.');
  if (!Array.isArray(profile.disputedTopics)) problems.push('disputedTopics must be a list.');
  for (const topic of profile.disputedTopics || []) {
    if (!DISPUTED_TOPICS.includes(topic)) problems.push(`Unknown disputed topic "${topic}".`);
  }
  const expected = LIFE_STAGE_AUDIENCE[lifeStage];
  if (expected && profile.audience !== expected) problems.push(`lifeStage "${lifeStage}" needs audience "${expected}".`);
  return problems;
}
