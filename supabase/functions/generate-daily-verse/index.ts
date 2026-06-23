import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LANGUAGES = [
  { code: 'fr', name: 'French' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Brazilian Portuguese' },
  { code: 'zh', name: 'Simplified Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharic' },
  { code: 'id', name: 'Indonesian' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fa', name: 'Persian' },
];

async function generateVerse(langName: string, apiKey: string): Promise<{ text: string; ref: string } | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a Christian devotional assistant. Choose one Bible verse relevant to prayer, intercession, perseverance in prayer, faith, or seeking God. Pick a different verse each time — avoid 1 Thessalonians 5:17, James 5:16, Philippians 4:6 as they are overused. Respond ONLY with a valid JSON object, no extra text:
{"text": "<verse text in ${langName}>", "ref": "<Book Chapter:Verse in ${langName}>"}`,
      }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.content?.[0]?.text || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

Deno.serve(async (req) => {
  // Allow manual trigger via POST as well as cron
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return new Response('Missing ANTHROPIC_API_KEY', { status: 500 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().slice(0, 10);

  // Check if already generated today
  const { data: existing } = await supabase
    .from('daily_verse')
    .select('lang')
    .eq('date', today);

  const existingLangs = new Set((existing || []).map((r: { lang: string }) => r.lang));
  const missing = LANGUAGES.filter((l) => !existingLangs.has(l.code));

  if (missing.length === 0) {
    return new Response(JSON.stringify({ message: 'Already generated for today', date: today }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const results: { lang: string; success: boolean }[] = [];

  for (const lang of missing) {
    try {
      const verse = await generateVerse(lang.name, apiKey);
      if (verse?.text && verse?.ref) {
        await supabase.from('daily_verse').upsert({
          date: today,
          lang: lang.code,
          text: verse.text,
          ref: verse.ref,
        }, { onConflict: 'date,lang' });
        results.push({ lang: lang.code, success: true });
      } else {
        results.push({ lang: lang.code, success: false });
      }
    } catch {
      results.push({ lang: lang.code, success: false });
    }
  }

  return new Response(JSON.stringify({ date: today, results }), {
    headers: { 'content-type': 'application/json' },
  });
});
