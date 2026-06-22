const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const cache = new Map();
let lastCallTime = 0;
const COOLDOWN_MS = 5000;

export function getRemainingCooldown() {
  return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - lastCallTime)) / 1000));
}

export async function getAIRecommendations({ title, description = '', type = 'new' }) {
  if (!API_KEY) return { recs: [], error: null };

  const cacheKey = `${type}:${title}:${description}`.slice(0, 100);
  if (cache.has(cacheKey)) return { recs: cache.get(cacheKey), error: null };

  const remaining = getRemainingCooldown();
  if (remaining > 0) return { recs: [], error: `Veuillez attendre ${remaining}s avant une nouvelle suggestion.` };

  const isEvolution = type === 'evolution';
  const prompt = isEvolution
    ? `Un chrétien prie pour : "${title}". Il vient d'ajouter cette évolution : "${description}".
Suggère 3 sujets de prière complémentaires adaptés à cette évolution.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
[{"title":"sujet de prière","verse":"Référence ex: Jean 3:16","verseText":"Texte complet du verset en français"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`
    : `Un chrétien souhaite prier pour : "${title}".${description ? ` Détails : "${description}".` : ''}
Suggère 4 sujets de prière connexes ou plus profonds.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
[{"title":"sujet de prière","verse":"Référence ex: Jean 3:16","verseText":"Texte complet du verset en français"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`;

  lastCallTime = Date.now();

  const isDev = import.meta.env.DEV;
  const endpoint = isDev ? '/api/anthropic/v1/messages' : '/api/anthropic';

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (isDev) {
      headers['x-api-key'] = API_KEY;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 429) return { recs: [], error: 'Limite de l\'API atteinte. Réessayez dans quelques secondes.' };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Claude API error', res.status, err);
      return { recs: [], error: 'Erreur de connexion à l\'IA.' };
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { recs: [], error: null };

    const parsed = JSON.parse(match[0]);
    const recs = Array.isArray(parsed) ? parsed.filter((r) => r.title && r.verse) : [];
    cache.set(cacheKey, recs);
    return { recs, error: null };
  } catch {
    return { recs: [], error: 'Erreur réseau.' };
  }
}
