/* Projects managed from the mobile app, read from Supabase.
   Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env;
   without them the site keeps the projects written into index.html. */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = "projects";

export const remoteEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

export async function fetchProjects() {
  const query = "select=*&published=eq.true&order=sort_order.asc,created_at.desc";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?${query}`, {
    headers: { apikey: SUPABASE_KEY, Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Public URL of a file in the bucket; `downloadAs` makes the browser save it under that name.
export function fileUrl(path, downloadAs) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const download = downloadAs ? `?download=${encodeURIComponent(downloadAs)}` : "";
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}${download}`;
}

// Where the card image comes from: an uploaded file, or an image already on the site.
export function previewSource(p) {
  if (p.preview_path) return { url: fileUrl(p.preview_path), isPdf: p.preview_type === "pdf" };
  if (p.preview_url) return { url: p.preview_url, isPdf: false };
  return null;
}
