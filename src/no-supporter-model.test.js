import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// The Free/Supporter product model was removed from `dev` (staged separately on
// feature/supporter-model-staged). This is the regression net: none of its
// identifiers may reappear in shipping source — components, the plan helper, its
// gate helpers, or the supporter/feature-gate analytics events. It guards
// Settings, scheduling, AI, onboarding and the analytics layer all at once.
const SRC = resolve(dirname(fileURLToPath(import.meta.url)));

function sourceFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, acc);
    else if (/\.(jsx?|tsx?)$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const BANNED = [
  'SupporterModal',
  'SupporterTag',
  'getFeatureTier',
  'isSupporterFeature',
  'isFeatureAvailable',
  'BILLING_ENABLED',
  'GIVING_LEVELS',
  'supporter_prompt',
  'feature_gate',
];

describe('no Free/Supporter product model in shipping source', () => {
  const files = sourceFiles(SRC);
  for (const token of BANNED) {
    it(`does not reference "${token}"`, () => {
      const hits = files.filter((f) => readFileSync(f, 'utf8').includes(token));
      expect(hits, `found "${token}" in: ${hits.map((f) => f.replace(SRC, '')).join(', ')}`).toEqual([]);
    });
  }
});
