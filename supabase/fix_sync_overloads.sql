-- Fix: remove the OLD sync function overloads left behind when the p_id versions
-- were added (create-or-replace with a new arg list makes a NEW function, it does
-- not drop the old one). Two overloads of the same name make PostgREST RPC calls
-- fail with PGRST203 "Could not choose the best candidate function".
-- Run in the Supabase SQL editor.
drop function if exists sync_add_point(uuid, text, jsonb);
drop function if exists sync_add_update(uuid, text, text, boolean);
