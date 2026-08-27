import { describe, expect, it } from 'vitest';
import {
  cleanPlanName, personalizePlanDay, sanitizePlanPersonalization,
  MARRIAGE_INCLUDES, MAX_PLAN_CHILDREN,
} from './planPersonalization';

const plan = { lifeStage: 'married' };
const day = {
  theme: { en: 'A complete no-child day' },
  spousePrompt: { en: 'Give {partner} wisdom.' },
  selfPrompt: { en: 'Change me.' },
  marriagePrompt: { en: 'Shape our marriage.' },
  conversationPrompt: { en: 'What helps us listen?' },
  prayTogether: { en: 'Pray these words together.' },
  withChildren: {
    theme: { en: 'Praying for each child' },
    childPrompt: { en: 'Give {child} wise friends, and give us wisdom without control.' },
  },
};

describe('relationship plan personalization', () => {
  it('defaults to private, general, and a complete no-child plan', () => {
    const prefs = sanitizePlanPersonalization();
    expect(prefs).toMatchObject({ partner: null, role: 'general', mode: 'private', children: [] });
    expect(prefs.includes).toEqual([]);
    const resolved = personalizePlanDay(plan, day, prefs, 'en');
    expect(resolved.theme.en).toBe('A complete no-child day');
    expect(resolved.conversationPrompt).toBeUndefined();
    expect(resolved.prayTogether).toBeUndefined();
  });

  it('uses each child only in that child’s own prayer', () => {
    const resolved = personalizePlanDay(plan, day, {
      includes: ['children'],
      children: [{ id: 'emma', name: 'Emma' }, { id: 'liam', name: 'Liam' }],
    }, 'en');
    expect(resolved.childPrayers).toHaveLength(2);
    expect(resolved.childPrayers[0].prompt.en).toContain('Emma');
    expect(resolved.childPrayers[0].prompt.en).not.toContain('Liam');
    expect(resolved.childPrayers[1].prompt.en).toContain('Liam');
    expect(resolved.childPrayers[1].prompt.en).not.toContain('Emma');
  });

  it('shows conversation and shared-prayer instructions only after together mode is chosen', () => {
    const resolved = personalizePlanDay(plan, day, { mode: 'together' }, 'en');
    expect(resolved.conversationPrompt.en).toContain('listen');
    expect(resolved.prayTogether.en).toContain('together');
  });

  it('sanitizes names, fixed ids, options, and list size', () => {
    const children = Array.from({ length: MAX_PLAN_CHILDREN + 5 }, (_, index) => ({ id: `child-${index}`, name: `Name ${index}` }));
    const result = sanitizePlanPersonalization({
      partner: { name: '\u202e Alex \u0000', prayerId: 'valid-prayer' },
      role: 'inferred', mode: 'monitor', includes: ['children', 'not-a-real-option'], children,
    });
    expect(result.partner.name).toBe('Alex');
    expect(result.role).toBe('general');
    expect(result.mode).toBe('private');
    expect(result.includes).toEqual(['children']);
    expect(result.children).toHaveLength(MAX_PLAN_CHILDREN);
    expect(cleanPlanName('  Sam  ')).toBe('Sam');
  });

  it('never treats names as replacement syntax or markup', () => {
    const name = '$& {child} <img onerror=alert(1)>';
    const resolved = personalizePlanDay(plan, day, { partner: { name } }, 'en');
    expect(resolved.spousePrompt.en).toContain(name);
    expect(resolved.spousePrompt.en).not.toContain('{partner}');
  });

  // LRM, RLM and ALM are bidirectional controls too. The isolates the renderer
  // adds contain the damage either way, but a name is not "cleaned" while it
  // can still carry them.
  it('strips the implicit bidi marks, not only the overrides', () => {
    expect(cleanPlanName('A‎lex‏؜')).toBe('Alex');
    expect(cleanPlanName('⁦Alex⁩')).toBe('Alex');
  });

  // Only the OPTIONAL layers are offered. Prayer for the spouse, for one's own
  // growth and for the marriage used to sit in this list as pre-ticked boxes
  // that changed nothing a day said — a control the plan could not honour.
  it('offers only the layers that genuinely change a day', () => {
    expect(MARRIAGE_INCLUDES.map(({ id }) => id)).toEqual(['children', 'home', 'extended-family']);
  });

  it('keeps "no extra layer" as a real answer, and drops ids it no longer knows', () => {
    expect(sanitizePlanPersonalization({ includes: [] }).includes).toEqual([]);
    expect(sanitizePlanPersonalization({ includes: ['nonsense'] }).includes).toEqual([]);
    // Answers saved by an older build named layers that no longer exist.
    expect(sanitizePlanPersonalization({ includes: ['marriage', 'spouse', 'self', 'spiritual'] }).includes).toEqual([]);
    // A real choice is still honoured exactly as given.
    expect(sanitizePlanPersonalization({ includes: ['home'] }).includes).toEqual(['home']);
  });
});
