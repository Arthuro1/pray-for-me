const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const cache = new Map();
let lastCallTime = 0;
const COOLDOWN_MS = 5000;

export function getRemainingCooldown() {
  return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - lastCallTime)) / 1000));
}

// Each point now returns verses as an array: [{ref, text}, ...]
const EXAMPLE = (n) =>
  Array.from({ length: n }, (_, i) => ({
    title: '...',
    verses: [
      { ref: '...', text: '...' },
      { ref: '...', text: '...' },
    ],
  }));

const EXAMPLE_DAY = () =>
  Array.from({ length: 3 }, () => ({ title: '...', description: '...' }));

const LANG_INSTRUCTIONS = {
  fr: {
    dayPlan: (cats) =>
      `Un chrétien n'a aucune prière planifiée pour aujourd'hui. Les catégories du jour sont : ${cats}.
Suggère 3 sujets de prière concrets et inspirants pour ces catégories.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
${JSON.stringify(EXAMPLE_DAY())}`,
    evolution: (title, desc) =>
      `Un chrétien prie pour : "${title}". Il vient d'ajouter cette évolution : "${desc}".
Suggère 3 sujets de prière complémentaires adaptés à cette évolution.
Pour chaque sujet, fournis 2 versets bibliques pertinents avec leur texte complet en français.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
${JSON.stringify(EXAMPLE(3))}`,
    newPrayer: (title, desc) =>
      `Un chrétien souhaite prier pour : "${title}".${desc ? ` Détails : "${desc}".` : ''}
Suggère 4 sujets de prière connexes ou plus profonds.
Pour chaque sujet, fournis 2 versets bibliques pertinents avec leur texte complet en français.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
${JSON.stringify(EXAMPLE(4))}`,
    cooldown: (s) => `Veuillez attendre ${s}s avant une nouvelle suggestion.`,
    rateLimited: "Limite de l'API atteinte. Réessayez dans quelques secondes.",
    connError: "Erreur de connexion à l'IA.",
    netError: 'Erreur réseau.',
  },
  en: {
    dayPlan: (cats) =>
      `A Christian has no prayers planned for today. Today's categories are: ${cats}.
Suggest 3 concrete and inspiring prayer topics for these categories.
Reply ONLY with a valid JSON array, no text before or after:
${JSON.stringify(EXAMPLE_DAY())}`,
    evolution: (title, desc) =>
      `A Christian is praying for: "${title}". They just added this update: "${desc}".
Suggest 3 complementary prayer topics suited to this update.
For each topic, provide 2 relevant Bible verses with their full text in English.
Reply ONLY with a valid JSON array, no text before or after:
${JSON.stringify(EXAMPLE(3))}`,
    newPrayer: (title, desc) =>
      `A Christian wants to pray for: "${title}".${desc ? ` Details: "${desc}".` : ''}
Suggest 4 related or deeper prayer topics.
For each topic, provide 2 relevant Bible verses with their full text in English.
Reply ONLY with a valid JSON array, no text before or after:
${JSON.stringify(EXAMPLE(4))}`,
    cooldown: (s) => `Please wait ${s}s before a new suggestion.`,
    rateLimited: 'API limit reached. Please try again in a few seconds.',
    connError: 'Connection error. Please try again.',
    netError: 'Network error.',
  },
  de: {
    dayPlan: (cats) =>
      `Ein Christ hat heute keine geplanten Gebete. Die Kategorien des Tages sind: ${cats}.
Schlage 3 konkrete und inspirierende Gebetsanliegen für diese Kategorien vor.
Antworte NUR mit einem gültigen JSON-Array, kein Text davor oder danach:
${JSON.stringify(EXAMPLE_DAY())}`,
    evolution: (title, desc) =>
      `Ein Christ betet für: "${title}". Er/sie hat gerade diese Entwicklung hinzugefügt: "${desc}".
Schlage 3 ergänzende Gebetsanliegen vor, die zu dieser Entwicklung passen.
Gib für jedes Anliegen 2 relevante Bibelverse mit vollständigem Text auf Deutsch an.
Antworte NUR mit einem gültigen JSON-Array, kein Text davor oder danach:
${JSON.stringify(EXAMPLE(3))}`,
    newPrayer: (title, desc) =>
      `Ein Christ möchte für folgendes beten: "${title}".${desc ? ` Details: "${desc}".` : ''}
Schlage 4 verwandte oder tiefere Gebetsanliegen vor.
Gib für jedes Anliegen 2 relevante Bibelverse mit vollständigem Text auf Deutsch an.
Antworte NUR mit einem gültigen JSON-Array, kein Text davor oder danach:
${JSON.stringify(EXAMPLE(4))}`,
    cooldown: (s) => `Bitte warte ${s}s vor einem neuen Vorschlag.`,
    rateLimited: 'API-Limit erreicht. Bitte in einigen Sekunden erneut versuchen.',
    connError: 'KI-Verbindungsfehler.',
    netError: 'Netzwerkfehler.',
  },
  pt: {
    dayPlan: (cats) =>
      `Um cristão não tem orações planejadas para hoje. As categorias do dia são: ${cats}.
Sugira 3 tópicos de oração concretos e inspiradores para essas categorias.
Responda APENAS com um array JSON válido, sem texto antes ou depois:
${JSON.stringify(EXAMPLE_DAY())}`,
    evolution: (title, desc) =>
      `Um cristão está orando por: "${title}". Ele/ela acabou de adicionar esta atualização: "${desc}".
Sugira 3 tópicos de oração complementares adequados a esta atualização.
Para cada tópico, forneça 2 versículos bíblicos relevantes com seu texto completo em português.
Responda APENAS com um array JSON válido, sem texto antes ou depois:
${JSON.stringify(EXAMPLE(3))}`,
    newPrayer: (title, desc) =>
      `Um cristão quer orar por: "${title}".${desc ? ` Detalhes: "${desc}".` : ''}
Sugira 4 tópicos de oração relacionados ou mais profundos.
Para cada tópico, forneça 2 versículos bíblicos relevantes com seu texto completo em português.
Responda APENAS com um array JSON válido, sem texto antes ou depois:
${JSON.stringify(EXAMPLE(4))}`,
    cooldown: (s) => `Aguarde ${s}s antes de uma nova sugestão.`,
    rateLimited: 'Limite da API atingido. Tente novamente em alguns segundos.',
    connError: 'Erro de conexão com a IA.',
    netError: 'Erro de rede.',
  },
};

export async function getDayPlanSuggestions({ categoryNames, lang = 'fr' }) {
  if (!API_KEY) return { recs: [], error: null };

  const strings = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS.fr;
  const cacheKey = `dayplan:${lang}:${categoryNames}`;
  if (cache.has(cacheKey)) return { recs: cache.get(cacheKey), error: null };

  const remaining = getRemainingCooldown();
  if (remaining > 0) return { recs: [], error: strings.cooldown(remaining) };

  const prompt = strings.dayPlan(categoryNames);
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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 429) return { recs: [], error: strings.rateLimited };
    if (!res.ok) return { recs: [], error: strings.connError };

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { recs: [], error: null };

    const parsed = JSON.parse(match[0]);
    const recs = Array.isArray(parsed) ? parsed.filter((r) => r.title) : [];
    cache.set(cacheKey, recs);
    return { recs, error: null };
  } catch {
    return { recs: [], error: strings.netError };
  }
}

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
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 429) return { recs: [], error: strings.rateLimited };
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('API error', res.status, err);
      return { recs: [], error: strings.connError };
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return { recs: [], error: null };

    const parsed = JSON.parse(match[0]);
    const recs = Array.isArray(parsed)
      ? parsed
          .filter((r) => r.title && Array.isArray(r.verses) && r.verses.length > 0)
          .map((r) => ({ ...r, verses: r.verses.filter((v) => v.ref) }))
      : [];
    cache.set(cacheKey, recs);
    return { recs, error: null };
  } catch {
    return { recs: [], error: strings.netError };
  }
}
