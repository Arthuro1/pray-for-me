// The spoken guide's pure logic: the language map and voice selection. Actual
// speech needs a browser SpeechSynthesis engine (exercised manually); in Node it
// must report unsupported and no-op quietly so the session still advances.
import { describe, it, expect } from 'vitest';
import { voiceLang, pickVoice, isSpeechSupported, speak, cancelSpeech } from './prayerGuideAudio';

describe('voiceLang', () => {
  it('maps every app language to a BCP-47 tag, defaulting to en-US', () => {
    expect(voiceLang('fr')).toBe('fr-FR');
    expect(voiceLang('pt')).toBe('pt-BR');
    expect(voiceLang('zh')).toBe('zh-CN');
    expect(voiceLang('ar')).toBe('ar-SA');
    expect(voiceLang('fa')).toBe('fa-IR');
    expect(voiceLang('tl')).toBe('fil-PH');
    expect(voiceLang('unknown')).toBe('en-US');
  });
});

describe('pickVoice', () => {
  const voices = [
    { lang: 'en-US', name: 'US' },
    { lang: 'fr-FR', name: 'FR' },
    { lang: 'pt-PT', name: 'PT' },
  ];

  it('prefers an exact tag, then a language-prefix match, then null', () => {
    expect(pickVoice(voices, 'fr-FR')?.name).toBe('FR');
    // pt-BR requested, only pt-PT available → prefix match on "pt".
    expect(pickVoice(voices, 'pt-BR')?.name).toBe('PT');
    expect(pickVoice(voices, 'de-DE')).toBeNull();
  });
});

describe('unsupported environment (Node)', () => {
  it('reports speech unsupported and no-ops without throwing', async () => {
    expect(isSpeechSupported()).toBe(false);
    await expect(speak('Jesus, we turn our hearts toward You.', { lang: 'en' })).resolves.toBeUndefined();
    expect(() => cancelSpeech()).not.toThrow();
  });
});
