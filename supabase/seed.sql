-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Dummy data seed for testing the community / sharing features.             ║
-- ║  Run in the Supabase SQL editor AFTER the schema migrations.               ║
-- ║                                                                            ║
-- ║  Safe to re-run: it deletes its own previously-seeded fake users first.    ║
-- ║  Fake users can log in with password: password123                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

do $$
declare
  -- 👇 CHANGE THIS to the email you log in with.
  me_email text := 'arthur.meteng@gmail.com';

  me         uuid;
  u_marie    uuid := gen_random_uuid();
  u_jean     uuid := gen_random_uuid();
  u_paul     uuid := gen_random_uuid();

  g_cellule  uuid := gen_random_uuid();  -- I am admin
  g_jeunes   uuid := gen_random_uuid();  -- I am member
  g_pasteurs uuid := gen_random_uuid();  -- I am NOT in (pending invitation)

  cat1 uuid;  -- one of my existing categories (for a shared prayer)
  p_health uuid := gen_random_uuid();    -- my personal prayer, shared
  p_job    uuid := gen_random_uuid();    -- my personal prayer, shared to 2 groups
  p_done   uuid := gen_random_uuid();    -- my answered prayer, shared (tests answered propagation)
  cp       uuid;
begin
  select id into me from auth.users where lower(email) = lower(me_email);
  if me is null then
    raise exception 'No user found with email %. Edit me_email at the top of this script.', me_email;
  end if;

  -- Clean up any previous run so this script is safe to re-run.
  -- Deleting the seeded groups (by their fixed invite codes) cascades to their
  -- members, community prayers, updates, testimonies and invitations.
  delete from groups where invite_code in ('CELL01', 'YOUTH1', 'PAST01');
  -- Deleting the fake users cascades their friendships and friend requests.
  delete from auth.users where email in ('marie.test@pray4me.dev', 'jean.test@pray4me.dev', 'paul.test@pray4me.dev');
  -- Remove the seeded personal prayers (cascades their shared community copies).
  delete from prayers where user_id = me and title in ('Santé de mon père', 'Direction pour ma carrière', 'Réussite de mon déménagement');

  -- ── Fake users (the trigger auto-creates their profiles) ──────────────────
  insert into auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    ('00000000-0000-0000-0000-000000000000', u_marie, 'authenticated', 'authenticated', 'marie.test@pray4me.dev',
     crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Marie Dupont"}'),
    ('00000000-0000-0000-0000-000000000000', u_jean, 'authenticated', 'authenticated', 'jean.test@pray4me.dev',
     crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Jean Mbarga"}'),
    ('00000000-0000-0000-0000-000000000000', u_paul, 'authenticated', 'authenticated', 'paul.test@pray4me.dev',
     crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Paul Nkeng"}');

  -- Make sure profiles exist even if the trigger isn't installed.
  insert into profiles (id, full_name) values
    (u_marie, 'Marie Dupont'), (u_jean, 'Jean Mbarga'), (u_paul, 'Paul Nkeng')
  on conflict (id) do nothing;

  -- ── Groups ────────────────────────────────────────────────────────────────
  insert into groups (id, name, invite_code, created_by) values
    (g_cellule,  'Cellule de maison',  'CELL01', me),
    (g_jeunes,   'Groupe de jeunes',   'YOUTH1', u_marie),
    (g_pasteurs, 'Réunion pasteurs',   'PAST01', u_jean);

  insert into group_members (group_id, user_id, role) values
    (g_cellule,  me,      'admin'),
    (g_cellule,  u_marie, 'member'),
    (g_cellule,  u_jean,  'member'),
    (g_jeunes,   u_marie, 'admin'),
    (g_jeunes,   me,      'member'),
    (g_jeunes,   u_paul,  'member'),
    (g_pasteurs, u_jean,  'admin');

  -- ── Friends & requests ──────────────────────────────────────────────────
  -- Already friends with Marie.
  insert into friendships (user_id, friend_id) values
    (least(me, u_marie), greatest(me, u_marie))
  on conflict do nothing;

  -- Incoming friend requests from Jean and Paul (test accept/reject + badge).
  insert into friend_requests (from_user_id, to_user_id) values
    (u_jean, me),
    (u_paul, me)
  on conflict do nothing;

  -- ── Group invitation (incoming, test accept/reject + badge) ───────────────
  insert into group_invitations (group_id, invited_user_id, invited_by) values
    (g_pasteurs, me, u_jean)
  on conflict do nothing;

  -- ── Community prayers authored by others in my groups ─────────────────────
  insert into community_prayers (group_id, user_id, author_name, title, description) values
    (g_cellule, u_marie, 'Marie Dupont', 'Guérison de ma mère', 'Elle est hospitalisée depuis lundi.'),
    (g_cellule, u_jean,  'Jean Mbarga',  'Nouveau travail',     'Entretien important vendredi.'),
    (g_jeunes,  u_paul,  'Paul Nkeng',   'Examens à venir',     'Pour la paix et la concentration.');

  -- A reaction + update + testimony on Marie's prayer.
  select id into cp from community_prayers where group_id = g_cellule and author_name = 'Marie Dupont' limit 1;
  insert into prayer_reactions (community_prayer_id, user_id) values (cp, me), (cp, u_jean) on conflict do nothing;
  insert into community_updates (community_prayer_id, user_id, author_name, text) values
    (cp, me,     'Moi', 'Je prie pour elle, Esaïe 41:10 🙏'),
    (cp, u_jean, 'Jean Mbarga', 'Dieu est fidèle, tiens bon.');
  insert into testimonies (group_id, user_id, author_name, content, community_prayer_id) values
    (g_cellule, u_marie, 'Marie Dupont', 'Ma mère va beaucoup mieux, merci pour vos prières ! 🎉', cp);

  -- ── My personal prayers (My Prayers tab) ──────────────────────────────────
  select id into cat1 from categories where user_id = me order by created_at limit 1;

  insert into prayers (id, user_id, title, description, status, testimony, answered_at) values
    (p_health, me, 'Santé de mon père',          'Pour un rétablissement complet.',  'active',   '', null),
    (p_job,    me, 'Direction pour ma carrière', 'Sagesse pour la prochaine étape.', 'active',   '', null),
    (p_done,   me, 'Réussite de mon déménagement', 'Trouver un logement avant la fin du mois.', 'answered', 'Logement trouvé, gloire à Dieu ! 🎉', now());

  if cat1 is not null then
    insert into prayer_categories (prayer_id, category_id) values (p_health, cat1), (p_job, cat1), (p_done, cat1)
    on conflict do nothing;
  end if;

  -- Share prayers to groups (these show as badges in My Prayers and as linked
  -- community prayers). The answered one is shared with is_answered = true so
  -- you can see answered status propagated into the group.
  insert into community_prayers (group_id, user_id, author_name, title, description, source_prayer_id, is_answered) values
    (g_cellule, me, 'Moi', 'Santé de mon père',            'Pour un rétablissement complet.',  p_health, false),
    (g_cellule, me, 'Moi', 'Direction pour ma carrière',   'Sagesse pour la prochaine étape.', p_job,    false),
    (g_jeunes,  me, 'Moi', 'Direction pour ma carrière',   'Sagesse pour la prochaine étape.', p_job,    false),
    (g_cellule, me, 'Moi', 'Réussite de mon déménagement', 'Trouver un logement avant la fin du mois.', p_done, true)
  on conflict (group_id, source_prayer_id) do nothing;

  raise notice 'Seed complete for % — 3 fake users, 3 groups, friends, requests, invitation, community prayers, and shared personal prayers.', me_email;
end $$;
