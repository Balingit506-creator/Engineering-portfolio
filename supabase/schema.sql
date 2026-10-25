-- Portfolio projects: run once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it skips anything that already exists.
--
-- Only the account with OWNER_EMAIL below can add, edit or delete projects
-- and files. Everyone else can only read published projects.

-- ---------------------------------------------------------------------------
-- Owner check — change the email here if you sign in with a different one.
-- ---------------------------------------------------------------------------
create or replace function public.is_portfolio_owner()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = '506balingit@gmail.com'
$$;

-- ---------------------------------------------------------------------------
-- Projects table
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  title        text not null,
  category     text not null default '',
  summary      text not null default '',          -- short line on the card
  tools        text[] not null default '{}',
  overview     text not null default '',
  objective    text not null default '',
  process      text[] not null default '{}',      -- one step per item
  specs        jsonb not null default '[]',       -- [["Scale", "1:100"], ...]
  result       text not null default '',
  alt          text not null default '',          -- image description for screen readers
  preview_path text,                              -- file in the "projects" bucket (image or PDF)
  preview_url  text,                              -- or an image already on the website, e.g. assets/projects/x.svg
  preview_type text not null default 'image',     -- 'image' | 'pdf'
  dwg_path     text,                              -- .dwg in the "projects" bucket
  dwg_name     text,                              -- original file name, used for the download
  featured     boolean not null default false,    -- full-width card
  published    boolean not null default true,
  sort_order   integer not null default 0         -- lower comes first; ties show newest first
);

alter table public.projects enable row level security;

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

drop policy if exists "Anyone can read published projects" on public.projects;
create policy "Anyone can read published projects"
  on public.projects for select
  using (published or public.is_portfolio_owner());

drop policy if exists "Owner can add projects" on public.projects;
create policy "Owner can add projects"
  on public.projects for insert to authenticated
  with check (public.is_portfolio_owner());

drop policy if exists "Owner can edit projects" on public.projects;
create policy "Owner can edit projects"
  on public.projects for update to authenticated
  using (public.is_portfolio_owner())
  with check (public.is_portfolio_owner());

drop policy if exists "Owner can delete projects" on public.projects;
create policy "Owner can delete projects"
  on public.projects for delete to authenticated
  using (public.is_portfolio_owner());

-- ---------------------------------------------------------------------------
-- File storage: public bucket (anyone can view/download), owner-only writes.
-- 50 MB per file is the Supabase free-plan maximum.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('projects', 'projects', true, 52428800)
on conflict (id) do nothing;

drop policy if exists "Owner can list project files" on storage.objects;
create policy "Owner can list project files"
  on storage.objects for select to authenticated
  using (bucket_id = 'projects' and public.is_portfolio_owner());

drop policy if exists "Owner can upload project files" on storage.objects;
create policy "Owner can upload project files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'projects' and public.is_portfolio_owner());

drop policy if exists "Owner can replace project files" on storage.objects;
create policy "Owner can replace project files"
  on storage.objects for update to authenticated
  using (bucket_id = 'projects' and public.is_portfolio_owner());

drop policy if exists "Owner can delete project files" on storage.objects;
create policy "Owner can delete project files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'projects' and public.is_portfolio_owner());

-- ---------------------------------------------------------------------------
-- Starter content: the 8 projects already on the website, so you can edit
-- them from the app (e.g. swap the illustration for your real drawing).
-- Only inserted when the table is empty.
-- ---------------------------------------------------------------------------
insert into public.projects
  (sort_order, featured, title, category, summary, tools, alt, preview_url, overview, objective, process, specs, result)
select * from (values
  (1, true, 'Residential HVAC Layout', 'HVAC Design',
   'Supply and return duct routing with diffuser placement for a single-storey home.',
   array['AutoCAD'],
   'CAD floor plan of a residence showing supply ducts and ceiling diffusers in each room',
   'assets/projects/residential-hvac.svg',
   'A complete air-conditioning layout for a single-storey residence, showing duct routing from the air-handling unit to every habitable room.',
   'Deliver even cooling to each room with the shortest practical duct runs, while keeping ducts concealed above ceilings and clear of structural members.',
   array['Reviewed the architectural floor plan and ceiling heights.', 'Estimated room loads to size diffusers and branch ducts.', 'Routed the main supply trunk along the central corridor.', 'Placed diffusers and return grilles for balanced air distribution.', 'Annotated duct sizes, airflow and equipment tags.'],
   '[["Drawing type","HVAC floor plan"],["Scale","1:100"],["System","Ducted split / AHU"],["Sheet","M-101"]]'::jsonb,
   'A clear, installation-ready plan that lets the contractor price, fabricate and install ductwork with minimal clarification.'),

  (2, false, 'Commercial Duct System', 'HVAC Ductwork',
   'Main trunk and branch layout for an open-plan commercial floor.',
   array['AutoCAD'],
   'Commercial ductwork plan with main trunk, VAV boxes and branch ducts on a column grid',
   'assets/projects/commercial-duct.svg',
   'Supply and return ductwork for an open-plan commercial floor, coordinated against the structural column grid.',
   'Distribute conditioned air across a large floor plate with a single main trunk and zoned branches that can be balanced independently.',
   array['Set up the column grid and architectural background as xrefs.', 'Laid out the main trunk and sized it for total airflow.', 'Branched to terminal units serving each zone.', 'Added return air path, dampers and access points.', 'Checked clearances and issued the drawing for review.'],
   '[["Drawing type","Ductwork layout"],["Scale","1:100"],["Main trunk","Rectangular, galvanised"],["Sheet","M-201"]]'::jsonb,
   'A coordinated duct layout with clear sizing and zoning, ready for shop drawings and installation.'),

  (3, false, 'Mechanical Floor Plan', 'Mechanical Plan',
   'Plant room arrangement for chillers, pumps and chilled-water piping.',
   array['AutoCAD'],
   'Mechanical plant room plan with chillers, pumps and chilled water piping',
   'assets/projects/mechanical-floor-plan.svg',
   'Equipment arrangement for a mechanical plant room, including chillers, circulating pumps and chilled-water supply and return headers.',
   'Fit major equipment into the plant room while keeping service clearances, logical pipe routing and safe access for maintenance.',
   array['Collected equipment footprints and clearance requirements.', 'Arranged chillers and pumps for short, clean pipe runs.', 'Drew supply and return headers with valves and fittings.', 'Tagged equipment and added a legend.', 'Reviewed maintenance access around every unit.'],
   '[["Drawing type","Plant room layout"],["Scale","1:50"],["Equipment","Chillers, CHW pumps"],["Sheet","M-301"]]'::jsonb,
   'An organised plant room plan that balances equipment density with safe, practical access for operations staff.'),

  (4, false, 'Plumbing & Sanitary Layout', 'Plumbing',
   'Water supply, waste and vent routing for a toilet block.',
   array['AutoCAD'],
   'Plumbing and sanitary layout of a toilet block with water, waste and vent lines',
   'assets/projects/plumbing-sanitary.svg',
   'Cold water supply, soil and waste, and vent piping for a toilet block with water closets, lavatories and a shower.',
   'Provide reliable water supply and code-compliant drainage with proper slopes, venting and cleanouts.',
   array['Located fixtures on the architectural plan.', 'Routed soil and waste lines with required slope toward the stack.', 'Added vent lines and cleanouts at changes of direction.', 'Drew the cold water distribution to each fixture.', 'Labelled pipe sizes and added a symbol legend.'],
   '[["Drawing type","Plumbing layout"],["Scale","1:50"],["Systems","CW · Soil · Waste · Vent"],["Sheet","P-101"]]'::jsonb,
   'A readable plumbing plan with clearly separated systems that plumbers can follow directly on site.'),

  (5, false, 'Fire Protection Layout', 'Fire Protection',
   'Sprinkler head spacing, branch lines and riser location.',
   array['AutoCAD'],
   'Fire sprinkler layout with cross main, branch lines and evenly spaced sprinkler heads',
   'assets/projects/fire-protection.svg',
   'Automatic sprinkler layout for a single floor, showing the riser, cross main, branch lines and head locations.',
   'Achieve full sprinkler coverage with even head spacing while keeping pipe routing simple.',
   array['Established the hazard classification and maximum head spacing.', 'Set a regular grid of sprinkler heads across the floor.', 'Connected heads with branch lines from a cross main.', 'Located the riser and control valve assembly.', 'Annotated pipe sizes and head types.'],
   '[["Drawing type","Sprinkler layout"],["Scale","1:100"],["Layout","Tree system"],["Sheet","FP-101"]]'::jsonb,
   'A clean, evenly spaced sprinkler layout that is easy to review for coverage and straightforward to install.'),

  (6, false, 'Machine Part Drawing', 'Detail Drawing',
   'Fully dimensioned flange detail with section view.',
   array['AutoCAD'],
   'Orthographic detail drawing of a bolted flange with front view, sectioned side view and dimensions',
   'assets/projects/machine-part.svg',
   'A fully dimensioned manufacturing drawing of a bolted flange, with a front view and a sectioned side view.',
   'Communicate every dimension and feature needed for a machinist to produce the part without additional questions.',
   array['Chose the views that best describe the part.', 'Drew the front view with bolt circle and centre lines.', 'Added a full section to show thickness and bore.', 'Dimensioned diameters, bolt pattern and thicknesses.', 'Completed the title block with material and scale.'],
   '[["Drawing type","Detail / manufacturing"],["Views","Front + Section A–A"],["Bolt pattern","6 × Ø28 on PCD 220"],["Units","mm"]]'::jsonb,
   'A precise, standards-based detail drawing suitable for fabrication and inspection.'),

  (7, false, 'Mechanical Assembly', 'Assembly',
   'Exploded shaft assembly with balloons and a bill of materials.',
   array['AutoCAD', 'Autodesk Inventor'],
   'Exploded assembly drawing of a shaft with bearings and gear, numbered balloons and parts list',
   'assets/projects/mechanical-assembly.svg',
   'An exploded assembly of a shaft, bearings, gear and housing covers, with numbered balloons and a bill of materials.',
   'Show how the components fit together and in what order, so the assembly can be built and maintained correctly.',
   array['Modeled or drew each component individually.', 'Arranged parts along the shaft axis in assembly order.', 'Added balloons linking each part to the parts list.', 'Created the bill of materials with quantities.', 'Reviewed fits and assembly sequence.'],
   '[["Drawing type","Exploded assembly"],["Components","6 parts"],["Includes","Balloons + BOM"],["Sheet","A-001"]]'::jsonb,
   'An assembly drawing that makes the build sequence obvious at a glance.'),

  (8, true, '3D Mechanical Model', '3D Modeling',
   'Parametric solid model of a machined mounting block.',
   array['Autodesk Inventor', 'SketchUp'],
   'Isometric 3D model of a machined mounting block with a bored hole',
   'assets/projects/3d-model.svg',
   'A parametric solid model of a machined mounting block, used to check proportions and generate 2D drawing views.',
   'Create an accurate 3D model that can be revised quickly and used as the single source for manufacturing drawings.',
   array['Sketched the base profile with driving dimensions.', 'Extruded the block and added the bored feature.', 'Applied edge treatments and checked proportions.', 'Generated isometric and orthographic views.', 'Exported views for documentation.'],
   '[["Model type","Parametric solid"],["Overall size","200 × 140 × 80 mm"],["Feature","Ø80 through bore"],["Output","Isometric + 2D views"]]'::jsonb,
   'A clean, editable model that speeds up design changes and keeps drawings consistent with the design.')
) as seed
where not exists (select 1 from public.projects);
