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
