const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const cache = new Map();
let lastCallTime = 0;
const COOLDOWN_MS = 5000;

export function getRemainingCooldown() {
  return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - lastCallTime)) / 1000));
}

const LANG_INSTRUCTIONS = {
  fr: {
    verseTextLang: 'en français',
    evolution: (title, desc) =>
      `Un chrétien prie pour : "${title}". Il vient d'ajouter cette évolution : "${desc}".
Suggère 3 sujets de prière complémentaires adaptés à cette évolution.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
[{"title":"sujet de prière","verse":"Référence ex: Jean 3:16","verseText":"Texte complet du verset en français"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    newPrayer: (title, desc) =>
      `Un chrétien souhaite prier pour : "${title}".${desc ? ` Détails : "${desc}".` : ''}
Suggère 4 sujets de prière connexes ou plus profonds.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
[{"title":"sujet de prière","verse":"Référence ex: Jean 3:16","verseText":"Texte complet du verset en français"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    cooldown: (s) => `Veuillez attendre ${s}s avant une nouvelle suggestion.`,
    rateLimited: "Limite de l'API atteinte. Réessayez dans quelques secondes.",
    connError: "Erreur de connexion à l'IA.",
    netError: 'Erreur réseau.',
  },
  en: {
    verseTextLang: 'in English',
    evolution: (title, desc) =>
      `A Christian is praying for: "${title}". They just added this update: "${desc}".
Suggest 3 complementary prayer topics suited to this update.
Reply ONLY with a valid JSON array, no text before or after:
[{"title":"prayer topic","verse":"Reference e.g. John 3:16","verseText":"Full verse text in English"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    newPrayer: (title, desc) =>
      `A Christian wants to pray for: "${title}".${desc ? ` Details: "${desc}".` : ''}
Suggest 4 related or deeper prayer topics.
Reply ONLY with a valid JSON array, no text before or after:
[{"title":"prayer topic","verse":"Reference e.g. John 3:16","verseText":"Full verse text in English"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    cooldown: (s) => `Please wait ${s}s before a new suggestion.`,
    rateLimited: 'API limit reached. Please try again in a few seconds.',
    connError: 'AI connection error.',
    netError: 'Network error.',
  },
  de: {
    verseTextLang: 'auf Deutsch',
    evolution: (title, desc) =>
      `Ein Christ betet für: "${title}". Er/sie hat gerade diese Entwicklung hinzugefügt: "${desc}".
Schlage 3 ergänzende Gebetsanliegen vor, die zu dieser Entwicklung passen.
Antworte NUR mit einem gültigen JSON-Array, kein Text davor oder danach:
[{"title":"Gebetsanliegen","verse":"Referenz z.B. Johannes 3:16","verseText":"Vollständiger Verstext auf Deutsch"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    newPrayer: (title, desc) =>
      `Ein Christ möchte für folgendes beten: "${title}".${desc ? ` Details: "${desc}".` : ''}
Schlage 4 verwandte oder tiefere Gebetsanliegen vor.
Antworte NUR mit einem gültigen JSON-Array, kein Text davor oder danach:
[{"title":"Gebetsanliegen","verse":"Referenz z.B. Johannes 3:16","verseText":"Vollständiger Verstext auf Deutsch"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    cooldown: (s) => `Bitte warte ${s}s vor einem neuen Vorschlag.`,
    rateLimited: 'API-Limit erreicht. Bitte in einigen Sekunden erneut versuchen.',
    connError: 'KI-Verbindungsfehler.',
    netError: 'Netzwerkfehler.',
  },
  pt: {
    verseTextLang: 'em português',
    evolution: (title, desc) =>
      `Um cristão está orando por: "${title}". Ele/ela acabou de adicionar esta atualização: "${desc}".
Sugira 3 tópicos de oração complementares adequados a esta atualização.
Responda APENAS com um array JSON válido, sem texto antes ou depois:
[{"title":"tópico de oração","verse":"Referência ex: João 3:16","verseText":"Texto completo do versículo em português"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    newPrayer: (title, desc) =>
      `Um cristão quer orar por: "${title}".${desc ? ` Detalhes: "${desc}".` : ''}
Sugira 4 tópicos de oração relacionados ou mais profundos.
Responda APENAS com um array JSON válido, sem texto antes ou depois:
[{"title":"tópico de oração","verse":"Referência ex: João 3:16","verseText":"Texto completo do versículo em português"},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."},{"title":"...","verse":"...","verseText":"..."}]`,
    cooldown: (s) => `Aguarde ${s}s antes de uma nova sugestão.`,
    rateLimited: 'Limite da API atingido. Tente novamente em alguns segundos.',
    connError: 'Erro de conexão com a IA.',
    netError: 'Erro de rede.',
  },
};

export async function getAIRecommendations({ title, description = '', type = 'new', lang = 'fr' }) {
  if (!API_KEY) return { recs: [], error: null };

  const cacheKey = `${lang}:${type}:${title}:${description}`.slice(0, 100);
  if (cache.has(cacheKey)) return { recs: cache.get(cacheKey), error: null };

  const remaining = getRemainingCooldown();
  const strings = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.fr;
  if (remaining > 0) return { recs: [], error: strings.cooldown(remaining) };

  const isEvolution = type === 'evolution';
  const prompt = isEvolution
    ? strings.evolution(title, description)
    : strings.newPrayer(title, description);

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

    if (res.status === 429) return { recs: [], error: strings.rateLimited };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Claude API error', res.status, err);
      return { recs: [], error: strings.connError };
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
    return { recs: [], error: strings.netError };
  }
}
