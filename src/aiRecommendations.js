const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function getAIRecommendations({ title, description = '', type = 'new' }) {
  if (!API_KEY) return [];

  const isEvolution = type === 'evolution';

  const prompt = isEvolution
    ? `Tu es un conseiller en vie de prière chrétienne. Un chrétien prie pour ce sujet : "${title}".
Il vient d'ajouter cette évolution : "${description}".
Suggère 3 nouveaux sujets de prière connexes ou complémentaires adaptés à cette évolution.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sous ce format exact :
[
  { "title": "sujet de prière", "verse": "Référence biblique (ex: Jean 3:16)" },
  { "title": "sujet de prière", "verse": "Référence biblique" },
  { "title": "sujet de prière", "verse": "Référence biblique" }
]`
    : `Tu es un conseiller en vie de prière chrétienne. Un chrétien souhaite prier pour : "${title}".
${description ? `Détails : "${description}".` : ''}
Suggère 4 sujets de prière connexes, complémentaires ou plus profonds, adaptés à ce contexte.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sous ce format exact :
[
  { "title": "sujet de prière", "verse": "Référence biblique (ex: Jean 3:16)" },
  { "title": "sujet de prière", "verse": "Référence biblique" },
  { "title": "sujet de prière", "verse": "Référence biblique" },
  { "title": "sujet de prière", "verse": "Référence biblique" }
]`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.filter((r) => r.title && r.verse) : [];
  } catch {
    return [];
  }
}
