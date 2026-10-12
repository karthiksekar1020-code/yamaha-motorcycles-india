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
