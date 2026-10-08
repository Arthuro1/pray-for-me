// Every passage a visitor can open on the landing page, including the author's
// letter and every circle teaching tab. The verse bundle builder consumes this
// manifest too, so public Scripture stays available without a network request.
import { ACCESS_REFS, NAME_REFS } from './identity.js';
import { AUTHOR_REFS } from './author.js';
import { LANDING_BEAT_REFS } from './landingBeatRefs.js';
import self from './intercessionCircles/self.js';
import household from './intercessionCircles/household.js';
import people from './intercessionCircles/people.js';
import church from './intercessionCircles/church.js';
import authorities from './intercessionCircles/authorities.js';
import nations from './intercessionCircles/nations.js';
import kingdom from './intercessionCircles/kingdom.js';
import deepSelf from './intercessionCircles/deep/self.js';
import deepHousehold from './intercessionCircles/deep/household.js';
import deepPeople from './intercessionCircles/deep/people.js';
import deepChurch from './intercessionCircles/deep/church.js';
import deepAuthorities from './intercessionCircles/deep/authorities.js';
import deepNations from './intercessionCircles/deep/nations.js';
import deepKingdom from './intercessionCircles/deep/kingdom.js';

const circles = [self, household, people, church, authorities, nations, kingdom];
const deepCircles = [deepSelf, deepHousehold, deepPeople, deepChurch, deepAuthorities, deepNations, deepKingdom];

export const LANDING_SCRIPTURE_REFS = Object.freeze([...new Set([
  ...NAME_REFS,
  ...ACCESS_REFS,
  ...Object.values(LANDING_BEAT_REFS).flat(),
  ...AUTHOR_REFS,
  ...circles.flatMap((circle) => circle.refs),
  ...deepCircles.flatMap((circle) => circle.themes.flatMap((theme) => [
    ...theme.refs,
    ...(theme.facets || []).map((facet) => facet.ref),
  ])),
])]);
