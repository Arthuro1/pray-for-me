// DEPRECATED — retained only so an old deployment can't run up an AI bill.
//
// The daily verse is now a curated, deterministic client-side rotation
// (src/content/dailyVerses.js): the same verse for every user on a given day,
// shown instantly and offline, with no chance of an LLM misquoting Scripture.
//
// This function no longer calls Anthropic or writes to `daily_verse`. If it is
// still scheduled, unschedule the cron and delete the function:
//   select cron.unschedule('generate-daily-verse');   -- if a job exists
//   npx supabase functions delete generate-daily-verse
Deno.serve(() =>
  new Response(
    JSON.stringify({
      status: 'gone',
      message: 'generate-daily-verse is deprecated; the daily verse is now served client-side.',
    }),
    { status: 410, headers: { 'content-type': 'application/json' } },
  )
);
