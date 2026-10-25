import { supabase } from './supabase';

// Matches the "profile" document in supabase/site-content.sql.
export type Job = { period: string; role: string; org: string; bullets: string[] };
export type Credential = { period: string; title: string; org: string };
export type Profile = {
  availability: string;
  facts: { label: string; value: string }[];
  about: { lead: string; traits: string[] };
  experience: Job[];
  credentials: Credential[];
};

export const emptyProfile: Profile = {
  availability: '',
  facts: [],
  about: { lead: '', traits: [] },
  experience: [],
  credentials: [],
};

const NOT_OWNER =
  'This account isn’t allowed to change site content. Sign in with the owner email set in ' +
  'is_portfolio_owner() (supabase/schema.sql).';

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('site_content').select('value').eq('key', 'profile').maybeSingle();
  if (error) {
    // Table missing: supabase/site-content.sql hasn't been run yet.
    if (error.code === '42P01' || /site_content/.test(error.message)) {
      throw new Error('Site content isn’t set up yet. Run supabase/site-content.sql in the Supabase SQL Editor.');
    }
    throw error;
  }
  return data ? { ...emptyProfile, ...(data.value as Partial<Profile>) } : null;
}

export async function saveProfile(profile: Profile) {
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key: 'profile', value: profile, updated_at: new Date().toISOString() })
    .select('key');
  if (error) throw new Error(/row-level security/i.test(error.message) ? NOT_OWNER : error.message);
  if (!data?.length) throw new Error(NOT_OWNER);
}
