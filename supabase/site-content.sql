-- Editable site text (intro facts, About, Experience, Education), managed from the
-- mobile app. Run once in Supabase → SQL Editor, after schema.sql. Safe to re-run.

create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
  on public.site_content for select using (true);

drop policy if exists "Owner can add site content" on public.site_content;
create policy "Owner can add site content"
  on public.site_content for insert to authenticated
  with check (public.is_portfolio_owner());

drop policy if exists "Owner can edit site content" on public.site_content;
create policy "Owner can edit site content"
  on public.site_content for update to authenticated
  using (public.is_portfolio_owner())
  with check (public.is_portfolio_owner());

-- Starter content: what the website shows today. Only inserted if missing.
insert into public.site_content (key, value) values ('profile', $json$
{
  "availability": "Open to engineering roles",
  "facts": [
    { "label": "License",    "value": "PRC Registered Mechanical Engineer · 2024" },
    { "label": "Experience", "value": "1.5+ years · Facilities & CAD" },
    { "label": "Focus",      "value": "HVAC · CAD Drafting · Facilities" },
    { "label": "Based in",   "value": "General Santos City, PH" }
  ],
  "about": {
    "lead": "Registered Mechanical Engineer with over a year and a half of combined experience in facility engineering and AutoCAD drafting. I’ve kept a mall’s HVAC, pumps, generators and plumbing running, coordinated contractors and service providers, and produced the mechanical and HVAC drawings that projects are built from.",
    "traits": ["Detail-oriented", "Problem solving", "Clear communication", "Leadership", "Time management", "Willing to do fieldwork and site inspections"]
  },
  "experience": [
    {
      "period": "Aug 2024 — Dec 2024",
      "role": "Mall Engineer",
      "org": "Robinsons Land Corporation",
      "bullets": [
        "Monitored daily operation of HVAC systems, pumps, generators, plumbing and other building mechanical equipment.",
        "Ran routine equipment inspections and flagged maintenance needs before they caused downtime.",
        "Coordinated preventive and corrective maintenance with contractors and service providers.",
        "Helped supervise contractor work and verified compliance with specifications and safety standards.",
        "Responded to tenant engineering concerns and arranged timely repairs.",
        "Prepared daily engineering reports, Root Cause Analyses (RCA), maintenance records and inspection documentation.",
        "Recommended operational improvements for equipment reliability, efficiency and safety."
      ]
    },
    {
      "period": "Jul 2022 — Jul 2023",
      "role": "CAD Operator",
      "org": "KCC Property Holding Inc.",
      "bullets": [
        "Prepared detailed mechanical and HVAC drawings in AutoCAD.",
        "Reviewed engineering drawings and technical specifications for accuracy and compliance.",
        "Revised drawings to match engineering requirements and project updates.",
        "Worked with engineers and project teams to make sure design revisions were implemented correctly.",
        "Organized drawings and project documentation for efficient project control."
      ]
    }
  ],
  "credentials": [
    { "period": "2024",        "title": "Registered Mechanical Engineer", "org": "Professional Regulation Commission (PRC), Philippines" },
    { "period": "2019 — 2022", "title": "BS Mechanical Engineering",      "org": "Mindanao Polytechnic College, General Santos City" }
  ]
}
$json$::jsonb)
on conflict (key) do nothing;
