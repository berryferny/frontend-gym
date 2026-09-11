-- Supabase schema for GymFit
-- Ejecuta este archivo completo en el SQL Editor del proyecto de Supabase.

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

-- Normaliza y elimina filas duplicadas antes de crear la restricción única.
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

-- Crea automáticamente un perfil cuando un usuario se registra en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    'cliente'
  )
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

-- Función segura para saber si la sesión actual pertenece a un administrador.
-- SECURITY DEFINER evita recursión de RLS al consultar profiles desde sus propias políticas.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Devuelve las clases con disponibilidad real sin exponer las reservas de otros usuarios.
create or replace function public.get_clases_con_disponibilidad()
returns table (
  id bigint,
  nombre text,
  disciplina text,
  instructor text,
  dia text,
  hora text,
  cupo integer,
  created_at timestamptz,
  disponibles bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.nombre,
    c.disciplina,
    c.instructor,
    c.dia,
    c.hora,
    c.cupo,
    c.created_at,
    greatest(c.cupo::bigint - count(r.id), 0::bigint) as disponibles
  from public.clases c
  left join public.reservas r on r.clase_id = c.id
  group by c.id
  order by c.id asc;
$$;

revoke all on function public.get_clases_con_disponibilidad() from public;
grant execute on function public.get_clases_con_disponibilidad() to anon, authenticated;

-- Evita sobrecupo incluso si dos usuarios intentan reservar al mismo tiempo.
create or replace function public.validar_reserva_antes_de_insertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cupo integer;
  v_total integer;
  v_rol text;
begin
  if auth.uid() is null or new.usuario_id <> auth.uid() then
    raise exception 'USUARIO_NO_VALIDO';
  end if;

  select rol into v_rol
  from public.profiles
  where id = auth.uid();

  if v_rol is distinct from 'cliente' then
    raise exception 'SOLO_CLIENTES';
  end if;

  select cupo into v_cupo
  from public.clases
  where id = new.clase_id
  for update;

  if v_cupo is null then
    raise exception 'CLASE_NO_EXISTE';
  end if;

  select count(*) into v_total
  from public.reservas
  where clase_id = new.clase_id;

  if v_total >= v_cupo then
    raise exception 'CLASE_LLENA';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_cupo_reserva on public.reservas;
create trigger validar_cupo_reserva
before insert on public.reservas
for each row execute procedure public.validar_reserva_antes_de_insertar();

-- RLS
alter table public.profiles enable row level security;
alter table public.clases enable row level security;
alter table public.reservas enable row level security;

-- Elimina las políticas anteriores para que el script pueda ejecutarse varias veces.
drop policy if exists "profiles_read_all" on public.profiles;
drop policy if exists "profiles_users_update_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "clases_read_all" on public.clases;
drop policy if exists "clases_admin_write" on public.clases;
drop policy if exists "reservas_read_own" on public.reservas;
drop policy if exists "reservas_select_own_or_admin" on public.reservas;
drop policy if exists "reservas_insert_own" on public.reservas;
drop policy if exists "reservas_delete_own_or_admin" on public.reservas;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "clases_read_all"
on public.clases
for select
to anon, authenticated
using (true);

create policy "clases_admin_write"
on public.clases
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "reservas_select_own_or_admin"
on public.reservas
for select
to authenticated
using (usuario_id = auth.uid() or public.is_admin());

create policy "reservas_insert_own"
on public.reservas
for insert
to authenticated
with check (usuario_id = auth.uid() and not public.is_admin());

create policy "reservas_delete_own_or_admin"
on public.reservas
for delete
to authenticated
using (usuario_id = auth.uid() or public.is_admin());

-- Configuración del administrador para la demo:
-- 1) Crea el usuario desde Authentication > Users en Supabase.
-- 2) Después ejecuta, cambiando el correo si lo deseas:
--    update public.profiles set rol = 'admin' where email = 'admin@gymfit.com';
-- La contraseña se define desde Supabase Auth y NO debe escribirse en este archivo.
