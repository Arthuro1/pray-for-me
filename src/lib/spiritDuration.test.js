// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  CUSTOM, OPEN_ENDED, customMinutes, durationSeconds, readDurationChoice, rememberDurationChoice,
} from './spiritDuration';

beforeEach(() => localStorage.clear());

describe('spiritDuration', () => {
  it('reads a preset as minutes, no timer as null', () => {
    expect(durationSeconds({ choice: 15, custom: '20' })).toBe(900);
    expect(durationSeconds({ choice: OPEN_ENDED, custom: '20' })).toBeNull();
  });

  it('accepts only whole minutes from 1 to 60 as the person\'s own time', () => {
    expect(customMinutes('45')).toBe(45);
    expect(customMinutes(' 1 ')).toBe(1);
    for (const bad of ['0', '61', '2.5', '', 'abc', '-3']) expect(customMinutes(bad)).toBeNull();
    expect(durationSeconds({ choice: CUSTOM, custom: '45' })).toBe(2700);
    expect(durationSeconds({ choice: CUSTOM, custom: '90' })).toBeUndefined();
  });

  it('starts at ten minutes and remembers the last choice', () => {
    expect(readDurationChoice()).toEqual({ choice: 10, custom: '20' });
    rememberDurationChoice({ choice: CUSTOM, custom: '25' });
    expect(readDurationChoice()).toEqual({ choice: CUSTOM, custom: '25' });
  });

  it('ignores a stored choice it does not know', () => {
    localStorage.setItem('pfm_spirit_duration', JSON.stringify({ choice: 7, custom: 'x' }));
    expect(readDurationChoice()).toEqual({ choice: 10, custom: '20' });
    localStorage.setItem('pfm_spirit_duration', '{not json');
    expect(readDurationChoice()).toEqual({ choice: 10, custom: '20' });
  });
});
