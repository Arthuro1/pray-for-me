import { supabase } from './supabase';

export const WORDING_ISSUES = ['unnatural', 'terminology', 'unclear', 'too_long', 'other'];
export const WORDING_STATUSES = ['new', 'reviewing', 'resolved', 'dismissed'];
export const canReviewWording = (user) => user?.app_metadata?.content_reviewer === true && !user?.is_anonymous;

export function buildWordingPayload(entries, id, locale, issue, suggestion) {
  const entry = entries.find((item) => item.id === id && item.locale === locale);
  if (!entry || typeof entry.text !== 'string' || !entry.text.trim() || entry.text.length > 20000 || !WORDING_ISSUES.includes(issue)) throw new Error('Invalid published wording');
  if (typeof suggestion !== 'string' || suggestion.length > 2000) throw new Error('Invalid suggestion');
  // Explicit allowlist: no spread of component props, user records or DOM text.
  return {
    locale, translation_key: entry.id, screen: entry.surface,
    current_string: entry.text, issue_type: issue,
    suggested_wording: suggestion.trim() || null,
  };
}

export async function submitWordingReport(payload) {
  const { error } = await supabase.from('wording_reports').insert(payload);
  if (error) throw error;
}

export async function fetchWordingReports(status, page = 0) {
  if (!WORDING_STATUSES.includes(status) || !Number.isInteger(page) || page < 0) throw new Error('Invalid filter');
  const { data, error } = await supabase.from('wording_reports')
    .select('id,locale,translation_key,screen,current_string,issue_type,suggested_wording,created_at,status')
    .eq('status', status).order('created_at', { ascending: false }).order('id')
    .range(page * 25, page * 25 + 25);
  if (error) throw error;
  return { rows: data.slice(0, 25), hasMore: data.length > 25 };
}

export async function updateWordingStatus(id, status) {
  if (!WORDING_STATUSES.includes(status)) throw new Error('Invalid status');
  const { error } = await supabase.from('wording_reports').update({ status }).eq('id', id).select('id').single();
  if (error) throw error;
}
