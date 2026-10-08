-- Keep the existing insert-only feedback flow, but prevent forged ownership.
-- AI reports use the caller's id for account erasure; deliberately anonymous
-- general feedback has no claimed name/email. No historical rows are rewritten.
alter table public.feedback enable row level security;
revoke insert on public.feedback from anon;
grant insert on public.feedback to authenticated;

-- A restrictive guard also constrains any older permissive insert policies.
create policy "Feedback inserts belong to caller"
on public.feedback as restrictive for insert to authenticated
with check (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (user_id is null and name is null and email is null)
  )
);
