// Validate all model output before anything reaches the browser. Citations are
// references only; authoritative Scripture wording comes from trusted sources.
const QUOTE_CHARS = /["'“”„‟«»『』「」]/;
const SENTENCE_PUNCT = /[.!?;]/;
const QUOTED_RUN = /["“„«『「]([^"“”„«»『』「」]{60,}|(?:\S+\s+){11,}\S+)["“”»』」]/;

function invalid() {
  return new Error('Invalid AI response');
}

function shape(value, allowed, required = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    || Object.keys(value).some((key) => !allowed.includes(key))
    || required.some((key) => !Object.hasOwn(value, key))) throw invalid();
}

function reference(value) {
  if (typeof value !== 'string') throw invalid();
  const ref = value.trim();
  // German numbered books have an ordinal period: "1. Petrus", "5. Mose".
  // Remove only a numbered-book prefix before requiring a chapter number.
  const citation = ref.replace(/^[1-5](?:\.\s*|\s+)(?=\p{L})/u, '');
  if (!ref || ref.length > 64 || QUOTE_CHARS.test(ref) || /[\r\n\t]/.test(ref)
    || !/\p{L}/u.test(citation) || !/\d/.test(citation)
    || SENTENCE_PUNCT.test(citation) || ref.split(/\s+/).length > 6) throw invalid();
  return ref;
}

function explanation(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || QUOTED_RUN.test(value)) throw invalid();
  const text = value.trim();
  if (required && !text) throw invalid();
  return text;
}

function list(value, max, item) {
  if (!Array.isArray(value) || value.length > max) throw invalid();
  return Array.from(value).map(item);
}

function passage(value) {
  shape(value, ['ref', 'readWhole', 'why'], ['ref']);
  const ref = reference(value.ref);
  return {
    ref,
    readWhole: value.readWhole === undefined ? ref : reference(value.readWhole),
    why: explanation(value.why === undefined ? '' : value.why, 400),
  };
}

function recommendation(value) {
  shape(value, ['title', 'references'], ['title', 'references']);
  const references = list(value.references, 6, (item) => {
    shape(item, ['ref', 'why'], ['ref']);
    return { ref: reference(item.ref), why: explanation(item.why === undefined ? '' : item.why, 400) };
  });
  if (!references.length) throw invalid();
  return { title: explanation(value.title, 160, true), references };
}

export function parseModelResponse(content) {
  if (typeof content !== 'string' || !content.trim() || content.length > 128000) throw invalid();
  // Tolerate a single enclosing JSON fence, but never salvage JSON out of prose.
  const trimmed = content.trim();
  const fence = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  try {
    return JSON.parse(fence ? fence[1].trim() : trimmed);
  } catch {
    throw invalid();
  }
}

export function validateTaskResponse(request, parsed) {
  if (request.task === 'scripture_guidance') {
    shape(parsed, ['passages', 'context', 'themes', 'reflections'], ['passages']);
    const passages = list(parsed.passages, 3, passage);
    if (!passages.length) throw invalid();
    return {
      passages,
      context: explanation(parsed.context === undefined ? '' : parsed.context, 800),
      themes: list(parsed.themes === undefined ? [] : parsed.themes, 6, (value) => explanation(value, 80)),
      reflections: list(parsed.reflections === undefined ? [] : parsed.reflections, 6, (value) => explanation(value, 300)),
    };
  }

  if (request.task === 'prayer_recommendations') {
    shape(parsed, ['recommendations'], ['recommendations']);
    // Validate EVERY entry, including overfilled entries, before deduplicating or
    // clamping. Unsafe output must never become acceptable because it was last.
    const validated = list(parsed.recommendations, 8, recommendation);
    if (!validated.length) throw invalid();
    const target = request.input.kind === 'evolution' ? 3 : 4;
    const seen = new Set();
    const recommendations = [];
    for (const item of validated) {
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (recommendations.length < target) recommendations.push({ ...item, references: item.references.slice(0, 2) });
    }
    return { recommendations };
  }

  if (request.task === 'translate_texts') {
    const keys = request.input.texts.map((_, index) => String(index));
    shape(parsed, keys, keys);
    const translations = {};
    for (const key of keys) {
      const value = parsed[key];
      if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw invalid();
      // This is the user's own text, so a translation may include their quotes.
      translations[key] = value;
    }
    return { translations };
  }

  throw invalid();
}
