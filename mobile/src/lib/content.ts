import { extension, IMAGE_TYPES, removeFiles, upload, type PickedFile } from './projects';
import { supabase } from './supabase';

// Matches the "profile" document in supabase/site-content.sql.
export type Job = { period: string; role: string; org: string; bullets: string[] };
export type Credential = { period: string; title: string; org: string };
export type Service = { title: string; text: string };
export type Profile = {
  availability: string;
  facts: { label: string; value: string }[];
  services: Service[];
  about: { lead: string; traits: string[] };
  experience: Job[];
  credentials: Credential[];
  photo_path: string | null;   // portrait in the "projects" bucket (site/ folder)
  resume_path: string | null;  // resume PDF in the bucket
};

export const emptyProfile: Profile = {
  availability: '',
  facts: [],
  services: [],
  about: { lead: '', traits: [] },
  experience: [],
  credentials: [],
  photo_path: null,
  resume_path: null,
};

export type ProfileFiles = { photo?: PickedFile; resume?: PickedFile };

export const isImage = (f: PickedFile) => extension(f.name) in IMAGE_TYPES && extension(f.name) !== 'svg';
export const isPdf = (f: PickedFile) => extension(f.name) === 'pdf' || f.mimeType === 'application/pdf';

/** Uploads a new photo and/or resume, returning the paths to store in the profile. */
export async function uploadProfileFiles(current: Profile, files: ProfileFiles) {
  const paths: Pick<Profile, 'photo_path' | 'resume_path'> = { photo_path: current.photo_path, resume_path: current.resume_path };
  const old: (string | null)[] = [];
  if (files.photo) {
    if (!isImage(files.photo)) throw new Error('The photo must be a JPG, PNG or WebP.');
    paths.photo_path = await upload('site', files.photo, 'photo', IMAGE_TYPES[extension(files.photo.name)]);
    old.push(current.photo_path);
  }
  if (files.resume) {
    if (!isPdf(files.resume)) throw new Error('The resume must be a PDF.');
    paths.resume_path = await upload('site', files.resume, 'resume', 'application/pdf');
    old.push(current.resume_path);
  }
  return { paths, old };
}

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

export async function saveProfile(profile: Profile, files: ProfileFiles = {}) {
  const { paths, old } = await uploadProfileFiles(profile, files);
  const value = { ...profile, ...paths };
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key: 'profile', value, updated_at: new Date().toISOString() })
    .select('key');
  if (error || !data?.length) {
    await removeFiles([paths.photo_path !== profile.photo_path ? paths.photo_path : null,
                       paths.resume_path !== profile.resume_path ? paths.resume_path : null]).catch(() => {});
    throw new Error(error && !/row-level security/i.test(error.message) ? error.message : NOT_OWNER);
  }
  await removeFiles(old).catch(() => {});
}
