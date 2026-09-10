-- Supabase schema for GymFit
-- Run this in the SQL editor of your Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol text not null default 'cliente' check (rol in ('cliente','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.clases (
  id bigserial primary key,
  nombre text not null,
  disciplina text not null,
  instructor text not null,
  dia text not null,
  hora text not null,
  cupo integer not null default 10 check (cupo > 0),
  created_at timestamptz not null default now()
);

-- Normaliza y elimina filas duplicadas que ya existan antes de crear la restricción única.
delete from public.clases a
where a.id not in (
  select min(id)
  from public.clases
  group by nombre
);

create unique index if not exists clases_nombre_key
on public.clases(nombre);

create table if not exists public.reservas (
  id bigserial primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  clase_id bigint not null references public.clases(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(usuario_id, clase_id)
);

create index if not exists reservas_usuario_idx on public.reservas(usuario_id);
create index if not exists reservas_clase_idx on public.reservas(clase_id);

insert into public.clases (nombre, disciplina, instructor, dia, hora, cupo)
values
  ('Pilates Reformer', 'Pilates', 'Ana', 'Lunes', '18:00', 10),
  ('Yoga Vinyasa', 'Yoga', 'Sofía', 'Martes', '19:00', 12),
  ('Barre Intense', 'Barre', 'Caro', 'Miércoles', '18:30', 10),
  ('Meditación & Breathwork', 'Meditación', 'Elena', 'Jueves', '20:00', 15),
  ('Pilates Flow', 'Pilates', 'Mariana', 'Sábado', '09:00', 12),
  ('Yoga Suave', 'Yoga', 'Sofía', 'Sábado', '10:30', 14)
on conflict (nombre) do nothing;

-- RLS setup
alter table public.profiles enable row level security;
alter table public.clases enable row level security;
alter table public.reservas enable row level security;

create policy "profiles_read_all"
on public.profiles
for select
using (true);

create policy "profiles_users_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "clases_read_all"
on public.clases
for select
using (true);

create policy "clases_admin_write"
on public.clases
for all
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.rol = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.rol = 'admin'
));

create policy "reservas_read_own"
on public.reservas
for select
using (usuario_id = auth.uid());

create policy "reservas_insert_own"
on public.reservas
for insert
with check (usuario_id = auth.uid());

create policy "reservas_delete_own_or_admin"
on public.reservas
for delete
using (
  usuario_id = auth.uid() or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

-- Triggers for profile creation from Supabase Auth users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email, rol)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)), new.email, 'cliente')
  on conflict (id) do update set
    nombre = excluded.nombre,
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
