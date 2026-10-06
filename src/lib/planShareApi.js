// The five RPCs behind plan share links (supabase/migrations/…_plan_share_links.sql).
// Both tables are RPC-only, so this is the whole client surface.
//
// Every call resolves to `{ data }` or `{ error }` and never throws: this repo
// routinely ships client code ahead of its manual prod migration, and until the
// functions exist every caller must fall back to a plain plan link rather than
// break the share sheet or the join.
import { supabase } from './supabase';

async function call(fn, args) {
  try {
    const { data, error } = await supabase.rpc(fn, args);
    return error ? { error } : { data };
  } catch (error) {
    return { error };
  }
}

const firstRow = (data) => (Array.isArray(data) ? data[0] : data) || null;

// { activeToken, stopped, joinCount, friendNames } for the caller's link to `planId`.
export async function fetchPlanShareStatus(planId) {
  const { data, error } = await call('plan_share_status', { p_plan_id: planId });
  if (error) return { error };
  const row = firstRow(data);
  return {
    data: {
      activeToken: row?.active_token || null,
      stopped: !!row?.stopped,
      joinCount: row?.join_count || 0,
      friendNames: row?.friend_names || [],
    },
  };
}

export async function createPlanShareLink(planId) {
  const { data, error } = await call('create_plan_share_link', { p_plan_id: planId });
  if (error || !data) return { error: error || new Error('no token') };
  return { data };
}

export async function stopPlanShareLink(planId) {
  return call('stop_plan_share_link', { p_plan_id: planId });
}

// { planId, inviterFirstName, inviterId, active }, or null for an unknown token.
// Callable signed out; `inviterId` is only ever filled for a signed-in caller.
export async function resolvePlanShareLink(token) {
  const { data, error } = await call('resolve_plan_share_link', { p_token: token });
  if (error) return { error };
  const row = firstRow(data);
  return {
    data: row
      ? {
        planId: row.plan_id,
        inviterFirstName: row.inviter_first_name || null,
        inviterId: row.inviter_id || null,
        active: !!row.active,
      }
      : null,
  };
}

export async function recordPlanShareJoin(token, planId) {
  return call('record_plan_share_join', { p_token: token, p_plan_id: planId });
}
