// Shared core for every AI call in the app. Two responsibilities:
//   1. A single theological "guardrail" system prompt, so the model can never
//      pose as a pastor/prophet or speak in God's voice — it points the user
//      back to Scripture and prayer, and nothing more.
//   2. One shared cooldown + JSON-call helper, so all AI features (Scripture
//      guidance, prayer points, day plan) share the same client-side throttle
//      and parsing instead of each re-implementing it.
import { anthropicFetch } from './anthropic';
import { devError } from './logger';
import { t } from '../i18n';

// Pinned to the one model the server proxy allows (see api/anthropic.js).
const MODEL = 'claude-haiku-4-5-20251001';
const COOLDOWN_MS = 5000;
let lastCallTime = 0;

export function getRemainingCooldown() {
  return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - lastCallTime)) / 1000));
}

// English names so the model reliably understands which language to write in,
// even when the UI locale code is non-Latin. Keys match LANG_CODES in i18n.js.
const LANGUAGE_NAMES = {
  fr: 'French', en: 'English', de: 'German', pt: 'Portuguese',
  zh: 'Chinese (Simplified)', es: 'Spanish', hi: 'Hindi', ja: 'Japanese',
  sw: 'Swahili', am: 'Amharic', id: 'Indonesian', tl: 'Tagalog',
  ko: 'Korean', ru: 'Russian', ar: 'Arabic', fa: 'Persian',
};

export function languageName(lang) {
  return LANGUAGE_NAMES[lang] || 'English';
}

// The guardrail. Sent as the `system` prompt on every AI request. This is the
// single place that keeps the app's AI a humble assistant: Christ is the center,
// Scripture is the authority, and the model never claims to speak for God.
export function scriptureSystemPrompt(lang) {
  return `You are a humble Bible-study companion inside a Christian prayer app, within a broadly evangelical framework. Your only role is to point the user to God's Word and back to prayer — never to replace either, and never to be the center of their faith. Christ is the center.

Hard rules you must never break:
- You are NOT a pastor, prophet, priest, or any source of revelation. Never claim to speak for God. Never write "God told you", "The Lord says to you", "God revealed", or place any words in God's mouth. Instead use humble framing such as: "Consider praying…", "Scripture encourages believers to…", "This passage reminds us…", "You may reflect on…".
- Never isolate a verse from its context. Prefer whole chapters or larger sections, and always encourage the user to read the full passage in their own Bible.
- Do not predict God's will, promise specific outcomes, or guarantee that a prayer will be answered a certain way. Do not settle disputed denominational questions; stay on the clear, central teaching of Scripture about Christ, grace, and the gospel.
- Be warm, pastoral, and humble. Affirm salvation by grace through faith in Jesus Christ and Scripture as the highest authority.
- Use only real, canonical Bible references — never invent a citation.
- Write ALL human-readable content in ${languageName(lang)}.
- Output ONLY valid JSON, with no text, commentary, or markdown before or after it.`;
}

// Map a typed error from callClaudeForJson to localized, user-facing copy.
// Centralized so every AI caller surfaces the same wording in the user's language.
export function localizeAiError(error, lang) {
  if (!error) return null;
  if (error.type === 'cooldown') return t(lang, 'aiCooldown', { s: error.seconds });
  if (error.type === 'busy') return t(lang, 'aiBusy');
  // Dev-only, and only the typed token — never the prompt/prayer content.
  devError('AI request failed', error.type);
  return t(lang, 'aiError');
}

// Sends one guardrailed request to Claude and returns the first JSON value found
// in the response. `shape` selects whether we expect a top-level object or array.
// Errors come back as a typed token ({ type, seconds? }) so each caller can map
// them to its own localized copy — this module stays free of i18n.
export async function callClaudeForJson({ prompt, lang, maxTokens = 900, shape = 'object' }) {
  const remaining = getRemainingCooldown();
  if (remaining > 0) return { data: null, error: { type: 'cooldown', seconds: remaining } };

  lastCallTime = Date.now();
  try {
    const res = await anthropicFetch({
      model: MODEL,
      max_tokens: maxTokens,
      system: scriptureSystemPrompt(lang),
      messages: [{ role: 'user', content: prompt }],
    });

    if (res.status === 429) return { data: null, error: { type: 'busy' } };
    if (!res.ok) {
      // Log only the status — never the body, which can echo the prompt
      // (and therefore the user's prayer content).
      devError('AI request failed', res.status);
      return { data: null, error: { type: 'error' } };
    }

    const body = await res.json();
    const text = body?.content?.[0]?.text || '';
    const match = text.match(shape === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
    if (!match) return { data: null, error: null };
    return { data: JSON.parse(match[0]), error: null };
  } catch {
    return { data: null, error: { type: 'error' } };
  }
}
