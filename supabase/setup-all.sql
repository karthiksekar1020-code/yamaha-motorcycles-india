-- Yamaha Motorcycles India: ALL database setup in one paste (0001 + 0002 + 0003). RUN ONCE, on a NEW project.
-- (The first part creates tables and cannot be run twice. To add a later migration to an existing project, run just that file from supabase/migrations/, or use scripts/apply-migrations.mjs, which handles re-runs.)

-- Yamaha Motorcycles India: initial schema
create extension if not exists "pgcrypto";

create table public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  market text not null check (market in ('India', 'International')),
  model_year int check (model_year between 1990 and 2100),
  category text not null check (category in ('Supersport', 'Street', 'Hyper Naked', 'Sport Touring', 'Heritage', 'Scooter', 'Electric')),
  description text,
  engine_cc int check (engine_cc > 0),
  power_value numeric, power_unit text,
  torque_value numeric, torque_unit text,
  transmission text, cooling text,
  kerb_weight_kg numeric check (kerb_weight_kg > 0),
  seat_height_mm int check (seat_height_mm > 0),
  fuel_capacity_l numeric check (fuel_capacity_l > 0),
  front_suspension text, rear_suspension text, front_brake text, rear_brake text,
  features text[] not null default '{}',
  price_amount numeric check (price_amount >= 0),
  price_currency text check (price_currency in ('INR')),
  availability_status text not null default 'unverified'
    check (availability_status in ('unverified', 'current', 'upcoming', 'discontinued', 'international-only')),
  source_url text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index motorcycles_category_idx on public.motorcycles (category);
create index motorcycles_market_idx on public.motorcycles (market);

create table public.motorcycle_images (
  id uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles (id) on delete cascade,
  image_url text not null,
  alt_text text not null,
  sort_order int not null default 0,
  license_attribution text not null
);
create index motorcycle_images_moto_idx on public.motorcycle_images (motorcycle_id, sort_order);

create table public.motorcycle_assets (
  id uuid primary key default gen_random_uuid(),
  motorcycle_id uuid not null references public.motorcycles (id) on delete cascade,
  asset_url text not null,
  preview_url text,
  file_format text not null check (file_format in ('glb', 'gltf')),
  license_attribution text not null,
  material_variants jsonb not null default '[]',
  camera_configuration jsonb
);

create table public.dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  postal_code text not null check (postal_code ~ '^[0-9]{6}$'),
  address text not null,
  phone text,
  opening_hours text,
  is_verified boolean not null default false,
  source_url text
);
create index dealers_city_idx on public.dealers (lower(city));
create index dealers_postal_idx on public.dealers (postal_code);

create table public.test_ride_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  full_name text not null,
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email text not null,
  city text not null,
  motorcycle_id uuid references public.motorcycles (id) on delete set null,
  motorcycle_slug text not null,
  dealer_id uuid references public.dealers (id) on delete set null,
  preferred_date date not null,
  preferred_time_window text not null check (preferred_time_window in ('morning', 'afternoon', 'evening')),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'cancelled')),
  consent_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);
create index test_ride_requests_created_idx on public.test_ride_requests (created_at desc);

-- Row Level Security
alter table public.motorcycles enable row level security;
alter table public.motorcycle_images enable row level security;
alter table public.motorcycle_assets enable row level security;
alter table public.dealers enable row level security;
alter table public.test_ride_requests enable row level security;

-- Public catalogue data is readable; all writes require the service role (server-side only, bypasses RLS).
create policy "public read motorcycles" on public.motorcycles for select using (true);
create policy "public read images" on public.motorcycle_images for select using (true);
create policy "public read assets" on public.motorcycle_assets for select using (true);
create policy "public read verified dealers" on public.dealers for select using (is_verified);
-- test_ride_requests intentionally has NO policies: anon/authenticated roles can neither read nor write it.


-- Yamaha Motorcycles India: owner-only admin / content management
--
-- Safe to re-run: every statement is idempotent and no existing rows are deleted.
-- Security model: Postgres RLS is the final authority. The website's server acts as the signed-in user
-- (anon key + that user's JWT), so a request can only do what these policies allow. The service-role key
-- bypasses RLS and is used only by scripts/create-owner.mjs.

-- ---------------------------------------------------------------------------------------------
-- Admin allow-list. Rows are created ONLY by scripts/create-owner.mjs (service role).
-- There is no insert/update/delete policy, so no API client can ever grant itself admin rights.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "read own admin row" on public.admin_users;
create policy "read own admin row" on public.admin_users for select to authenticated using (user_id = auth.uid());

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

-- True only for a signed-in user listed in admin_users. SECURITY DEFINER so policies can call it without
-- granting read access to the whole table; search_path is pinned so it cannot be hijacked.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Motorcycles: add publishing + merchandising fields. Existing rows stay visible (published).
-- ---------------------------------------------------------------------------------------------
alter table public.motorcycles add column if not exists is_published boolean not null default true;
alter table public.motorcycles alter column is_published set default false; -- new rows start as drafts
alter table public.motorcycles add column if not exists is_featured boolean not null default false;
alter table public.motorcycles add column if not exists colors text[] not null default '{}';
alter table public.motorcycles add column if not exists sort_order int not null default 0;
alter table public.motorcycles add column if not exists updated_by uuid references auth.users (id) on delete set null;
create index if not exists motorcycles_published_idx on public.motorcycles (is_published, sort_order);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists motorcycles_touch on public.motorcycles;
create trigger motorcycles_touch before update on public.motorcycles for each row execute function public.touch_updated_at();

drop policy if exists "public read motorcycles" on public.motorcycles;
drop policy if exists "read published motorcycles" on public.motorcycles;
create policy "read published motorcycles" on public.motorcycles for select using (is_published or public.is_admin());
drop policy if exists "admin insert motorcycles" on public.motorcycles;
create policy "admin insert motorcycles" on public.motorcycles for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update motorcycles" on public.motorcycles;
create policy "admin update motorcycles" on public.motorcycles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete motorcycles" on public.motorcycles;
create policy "admin delete motorcycles" on public.motorcycles for delete to authenticated using (public.is_admin());

-- Child tables follow their motorcycle: drafts' images/assets are not public.
drop policy if exists "public read images" on public.motorcycle_images;
drop policy if exists "read images of visible motorcycles" on public.motorcycle_images;
create policy "read images of visible motorcycles" on public.motorcycle_images for select
  using (exists (select 1 from public.motorcycles m where m.id = motorcycle_id and (m.is_published or public.is_admin())));
drop policy if exists "admin write images" on public.motorcycle_images;
create policy "admin write images" on public.motorcycle_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read assets" on public.motorcycle_assets;
drop policy if exists "read assets of visible motorcycles" on public.motorcycle_assets;
create policy "read assets of visible motorcycles" on public.motorcycle_assets for select
  using (exists (select 1 from public.motorcycles m where m.id = motorcycle_id and (m.is_published or public.is_admin())));
drop policy if exists "admin write assets" on public.motorcycle_assets;
create policy "admin write assets" on public.motorcycle_assets for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------------------------
-- Gallery images (files live in the private "gallery" storage bucket)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path ~ '^gallery/[0-9a-f-]{36}\.webp$'),
  caption text not null default '' check (char_length(caption) <= 200),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  motorcycle_id uuid references public.motorcycles (id) on delete set null,
  sort_order int not null default 0,
  is_published boolean not null default false,
  width int not null check (width between 1 and 10000),
  height int not null check (height between 1 and 10000),
  mime_type text not null check (mime_type = 'image/webp'),
  size_bytes int not null check (size_bytes between 1 and 15728640),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gallery_images_order_idx on public.gallery_images (is_published, sort_order, created_at);
create index if not exists gallery_images_moto_idx on public.gallery_images (motorcycle_id);
drop trigger if exists gallery_images_touch on public.gallery_images;
create trigger gallery_images_touch before update on public.gallery_images for each row execute function public.touch_updated_at();
alter table public.gallery_images enable row level security;

drop policy if exists "read published gallery" on public.gallery_images;
create policy "read published gallery" on public.gallery_images for select using (is_published or public.is_admin());
drop policy if exists "admin insert gallery" on public.gallery_images;
create policy "admin insert gallery" on public.gallery_images for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update gallery" on public.gallery_images;
create policy "admin update gallery" on public.gallery_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete gallery" on public.gallery_images;
create policy "admin delete gallery" on public.gallery_images for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------------------------
-- Editable site content (hero, homepage text, navigation): a draft row and a published row per key.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.site_content (
  key text not null check (key in ('hero', 'home', 'navigation', 'promo')),
  status text not null check (status in ('draft', 'published')),
  value jsonb not null check (octet_length(value::text) <= 20000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (key, status)
);
drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before update on public.site_content for each row execute function public.touch_updated_at();
alter table public.site_content enable row level security;

drop policy if exists "read published content" on public.site_content;
create policy "read published content" on public.site_content for select using (status = 'published' or public.is_admin());
drop policy if exists "admin insert content" on public.site_content;
create policy "admin insert content" on public.site_content for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update content" on public.site_content;
create policy "admin update content" on public.site_content for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete content" on public.site_content;
create policy "admin delete content" on public.site_content for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------------------------
-- Audit log: append-only. Admins can add and read entries; nobody can change or remove them.
-- Never store passwords, tokens or other secrets in `details`.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) between 1 and 60),
  entity text check (char_length(entity) <= 40),
  entity_id text check (char_length(entity_id) <= 80),
  details jsonb not null default '{}'::jsonb check (octet_length(details::text) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
alter table public.audit_logs enable row level security;

drop policy if exists "admin read audit" on public.audit_logs;
create policy "admin read audit" on public.audit_logs for select to authenticated using (public.is_admin());
drop policy if exists "admin append audit" on public.audit_logs;
create policy "admin append audit" on public.audit_logs for insert to authenticated with check (public.is_admin() and actor_id = auth.uid());
revoke update, delete, truncate on public.audit_logs from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Least privilege: anonymous visitors can read (through RLS) but never write any content table.
-- ---------------------------------------------------------------------------------------------
revoke insert, update, delete, truncate on
  public.motorcycles, public.motorcycle_images, public.motorcycle_assets, public.gallery_images,
  public.site_content, public.audit_logs, public.dealers
from anon;
revoke all on public.audit_logs from anon;

-- ---------------------------------------------------------------------------------------------
-- Storage (Supabase only; skipped on a plain Postgres). The bucket is private: a file can be fetched
-- anonymously only while its gallery_images row is published. Only admins can write or delete.
-- ---------------------------------------------------------------------------------------------
do $storage$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('gallery', 'gallery', false, 5242880, array['image/webp'])
    on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/webp'];

    drop policy if exists "gallery read published" on storage.objects;
    create policy "gallery read published" on storage.objects for select
      using (bucket_id = 'gallery' and (
        public.is_admin()
        or exists (select 1 from public.gallery_images g where g.storage_path = storage.objects.name and g.is_published)
      ));

    drop policy if exists "gallery admin insert" on storage.objects;
    create policy "gallery admin insert" on storage.objects for insert to authenticated
      with check (bucket_id = 'gallery' and public.is_admin());

    drop policy if exists "gallery admin update" on storage.objects;
    create policy "gallery admin update" on storage.objects for update to authenticated
      using (bucket_id = 'gallery' and public.is_admin()) with check (bucket_id = 'gallery' and public.is_admin());

    drop policy if exists "gallery admin delete" on storage.objects;
    create policy "gallery admin delete" on storage.objects for delete to authenticated
      using (bucket_id = 'gallery' and public.is_admin());
  end if;
end
$storage$;


-- Yamaha Motorcycles India: owner can remove ("hide") the built-in official photos from the public gallery.
--
-- The built-in photos live in the site's code, not in the database, so removing one is recorded here and the gallery
-- page skips it. Restoring deletes the row. Safe to re-run; nothing is dropped.
-- Visitors can read the list (it only holds photo ids, nothing private) but only the owner can add or remove entries.

create table if not exists public.gallery_hidden (
  item_id text primary key check (item_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  hidden_by uuid references auth.users (id) on delete set null,
  hidden_at timestamptz not null default now()
);
alter table public.gallery_hidden enable row level security;

drop policy if exists "read hidden photo list" on public.gallery_hidden;
create policy "read hidden photo list" on public.gallery_hidden for select using (true);
drop policy if exists "admin hide photo" on public.gallery_hidden;
create policy "admin hide photo" on public.gallery_hidden for insert to authenticated with check (public.is_admin());
drop policy if exists "admin restore photo" on public.gallery_hidden;
create policy "admin restore photo" on public.gallery_hidden for delete to authenticated using (public.is_admin());

-- Least privilege: nobody can edit an entry, and anonymous visitors cannot write at all.
revoke insert, update, delete, truncate on public.gallery_hidden from anon;
revoke update on public.gallery_hidden from authenticated;
