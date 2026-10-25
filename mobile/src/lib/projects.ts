import { File } from 'expo-file-system';

import { supabase } from './supabase';

// Matches the table in supabase/schema.sql.
export type Project = {
  id: string;
  created_at: string;
  title: string;
  category: string;
  summary: string;
  tools: string[];
  overview: string;
  objective: string;
  process: string[];
  specs: [string, string][];
  result: string;
  alt: string;
  preview_path: string | null;
  preview_url: string | null;
  preview_type: 'image' | 'pdf';
  dwg_path: string | null;
  dwg_name: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
};

export type ProjectFields = Pick<
  Project,
  | 'title' | 'category' | 'summary' | 'tools' | 'overview' | 'objective'
  | 'process' | 'specs' | 'result' | 'alt' | 'featured' | 'published' | 'sort_order'
>;

export type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };

export type FileChanges = {
  preview?: PickedFile;   // new preview image or PDF
  dwg?: PickedFile;       // new .dwg
  removeDwg?: boolean;
};

const BUCKET = 'projects';
const MAX_BYTES = 50 * 1024 * 1024; // Supabase free-plan limit per file

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml',
};

const extension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export function previewKind(file: PickedFile): 'image' | 'pdf' | null {
  const ext = extension(file.name);
  if (ext === 'pdf' || file.mimeType === 'application/pdf') return 'pdf';
  if (ext in IMAGE_TYPES) return 'image';
  return null;
}

export const isDwg = (file: PickedFile) => extension(file.name) === 'dwg';

export function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Project;
}

async function upload(projectId: string, file: PickedFile, prefix: string, contentType: string) {
  if (file.size && file.size > MAX_BYTES) {
    throw new Error(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 50 MB.`);
  }
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${projectId}/${prefix}-${Date.now()}-${safeName}`;
  const bytes = await new File(file.uri).arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType });
  if (error) throw new Error(`Upload of ${file.name} failed: ${error.message}`);
  return path;
}

async function removeFiles(paths: (string | null | undefined)[]) {
  const existing = paths.filter((p): p is string => Boolean(p));
  if (existing.length) await supabase.storage.from(BUCKET).remove(existing);
}

/**
 * New projects are created hidden and only published by saveProject once their
 * files are uploaded, so a failed upload never shows a broken card on the website.
 */
export async function createHiddenProject(fields: ProjectFields): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...fields, published: false })
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

/** Saves the fields and uploads any new files, replacing the old ones. */
export async function saveProject(project: Project, fields: ProjectFields, files: FileChanges): Promise<Project> {
  const update: Partial<Project> = { ...fields };
  const replaced: (string | null)[] = [];
  const uploaded: string[] = [];

  try {
    if (files.preview) {
      const kind = previewKind(files.preview);
      if (!kind) throw new Error('The preview must be a PDF, PNG, JPG, WebP or SVG file.');
      const type = kind === 'pdf' ? 'application/pdf' : IMAGE_TYPES[extension(files.preview.name)];
      update.preview_path = await upload(project.id, files.preview, 'preview', type);
      uploaded.push(update.preview_path);
      update.preview_type = kind;
      update.preview_url = null;
      replaced.push(project.preview_path);
    }

    if (files.dwg) {
      update.dwg_path = await upload(project.id, files.dwg, 'drawing', 'application/acad');
      uploaded.push(update.dwg_path);
      update.dwg_name = files.dwg.name;
      replaced.push(project.dwg_path);
    } else if (files.removeDwg) {
      update.dwg_path = null;
      update.dwg_name = null;
      replaced.push(project.dwg_path);
    }

    const { error } = await supabase.from('projects').update(update).eq('id', project.id);
    if (error) throw error;
  } catch (e) {
    // Nothing points at the new uploads yet, so don't leave them behind.
    await removeFiles(uploaded).catch(() => {});
    throw e;
  }

  // Old files are only removed once the project points at the new ones.
  await removeFiles(replaced).catch(() => {});
  return { ...project, ...update };
}

export async function deleteProject(project: Project) {
  const { error } = await supabase.from('projects').delete().eq('id', project.id);
  if (error) throw error;
  await removeFiles([project.preview_path, project.dwg_path]).catch(() => {});
}
