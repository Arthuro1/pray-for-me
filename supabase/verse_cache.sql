-- Shared cache of resolved Bible passage text, so a verse fetched once (from
-- YouVersion or, with consent, the AI fallback) is reused by every user and
-- device instead of being re-fetched and re-billed per person.
--
-- This holds ONLY public Scripture text — never private prayer content — so a
-- world-readable policy is safe. Keyed by (lang, reference); `source` labels the
-- origin ('youversion' | 'ai') so the reader can stay honest about AI-sourced text.
create table if not exists verse_cache (
  lang       text        not null,
  reference  text        not null,
  text       text        not null,
  source     text        not null default 'ai',
  created_at timestamptz not null default now(),
  primary key (lang, reference)
);

alter table verse_cache enable row level security;

-- Public Scripture text: any authenticated user may read the shared cache…
drop policy if exists "Public read verse cache" on verse_cache;
create policy "Public read verse cache" on verse_cache
  for select using (true);

-- …and contribute a newly-resolved passage. No update/delete policy: entries are
-- immutable Scripture text, write-once.
drop policy if exists "Authenticated insert verse cache" on verse_cache;
create policy "Authenticated insert verse cache" on verse_cache
  for insert to authenticated with check (true);
