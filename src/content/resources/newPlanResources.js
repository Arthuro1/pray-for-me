// Resource candidates researched for the thirteen plans drafted on 2026-09-23
// (docs/NEW_PLANS_2026-09-23.md). One file per plan in ./newPlans/, with its
// verification worksheet in docs/resources/candidates/<plan-id>.md.
//
// Approval is the closed list in src/content/reviews/paulNewPlans20260930.js
// (Paul, 2026-09-30). An entry on it leaves this module approved with content
// and safety sign-offs; any other entry leaves as `needs_review` with no
// sign-off, whatever a candidate file says, so a candidate added later is
// never approved by default.
import { NEW_PLAN_RESOURCE_APPROVED_IDS, NEW_PLAN_RESOURCE_SIGNOFF } from '../reviews/paulNewPlans20260930';
import { CHILDREN21_CANDIDATES } from './newPlans/children21';
import { CHURCH_HURT_21_CANDIDATES } from './newPlans/churchHurt21';
import { FRUIT10_CANDIDATES } from './newPlans/fruit10';
import { HOLY_SPIRIT21_CANDIDATES } from './newPlans/holySpirit21';
import { IDENTITY21_CANDIDATES } from './newPlans/identity21';
import { KINGDOM_COME14_CANDIDATES } from './newPlans/kingdomCome14';
import { MAN_OF_GOD21_CANDIDATES } from './newPlans/manOfGod21';
import { PRODIGAL30_CANDIDATES } from './newPlans/prodigal30';
import { PSALMS42_CANDIDATES } from './newPlans/psalms42';
import { UNBELIEVERS30_CANDIDATES } from './newPlans/unbelievers30';
import { UNBORN21_CANDIDATES } from './newPlans/unborn21';
import { WOMAN_OF_GOD21_CANDIDATES } from './newPlans/womanOfGod21';
import { WORK21_CANDIDATES } from './newPlans/work21';

const COLLECTIONS = [
  CHILDREN21_CANDIDATES,
  CHURCH_HURT_21_CANDIDATES,
  FRUIT10_CANDIDATES,
  HOLY_SPIRIT21_CANDIDATES,
  IDENTITY21_CANDIDATES,
  KINGDOM_COME14_CANDIDATES,
  MAN_OF_GOD21_CANDIDATES,
  PRODIGAL30_CANDIDATES,
  PSALMS42_CANDIDATES,
  UNBELIEVERS30_CANDIDATES,
  UNBORN21_CANDIDATES,
  WOMAN_OF_GOD21_CANDIDATES,
  WORK21_CANDIDATES,
];

const union = (a = [], b = []) => [...new Set([...a, ...b])];

// A life stage narrows who sees an entry; an entry that names none is for
// everyone, and merging must not narrow it.
const mergeLifeStages = (a = [], b = []) => (a.length && b.length ? union(a, b) : []);

// The same work found for two plans becomes ONE entry, so a curator reviews it
// once: domains, topics, perspectives and editions are merged, and the entry
// is sensitive if either research pass found it sensitive. The first
// description and the first verified edition of a language are kept.
function mergeCandidate(first, other) {
  const sensitive = first.reviewLevel === 'sensitive' || other.reviewLevel === 'sensitive';
  return {
    ...first,
    domains: union(first.domains, other.domains),
    topics: union(first.topics, other.topics),
    lifeStages: mergeLifeStages(first.lifeStages, other.lifeStages),
    ...(first.perspective || other.perspective ? { perspective: union(first.perspective, other.perspective) } : {}),
    ...(sensitive ? { reviewLevel: 'sensitive' } : {}),
    editions: { ...other.editions, ...first.editions },
  };
}

const APPROVED = new Set(NEW_PLAN_RESOURCE_APPROVED_IDS);

// Review state comes only from the closed list: a candidate file can neither
// approve itself nor keep a stale sign-off.
function withReview(entry) {
  if (APPROVED.has(entry.id)) {
    return {
      ...entry,
      status: 'approved',
      contentReview: { ...NEW_PLAN_RESOURCE_SIGNOFF },
      safetyReview: { ...NEW_PLAN_RESOURCE_SIGNOFF },
    };
  }
  const pending = { ...entry, status: 'needs_review' };
  delete pending.contentReview;
  delete pending.safetyReview;
  return pending;
}

export function mergeCandidates(collections) {
  const byId = new Map();
  for (const entry of collections.flat()) {
    const known = byId.get(entry.id);
    byId.set(entry.id, known ? mergeCandidate(known, entry) : entry);
  }
  return [...byId.values()].map(withReview);
}

export const NEW_PLAN_RESOURCES = mergeCandidates(COLLECTIONS);

export default NEW_PLAN_RESOURCES;
