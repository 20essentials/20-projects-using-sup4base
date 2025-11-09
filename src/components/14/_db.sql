-- Tabla de usuarios globales
create table project_14_global_users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamp with time zone default now(),
  role_text text,
  email text
);

-- Tabla de nuevos clientes
create table project_14_new_clients (
  client_id uuid primary key references project_14_global_users(id) on delete cascade,
  username text not null,
  created_at timestamp with time zone default now(),
);

-- ===========================
-- TABLA: project_14_global_users
-- ===========================

-- Activar Row Level Security
alter table public.project_14_global_users enable row level security;

-- Permitir insertar solo si el usuario crea su propio registro
create policy "Insert own global_user record"
on public.project_14_global_users
for insert
with check (auth.uid() = id);

-- Permitir leer solo su propio registro
create policy "Select own global_user record"
on public.project_14_global_users
for select
using (auth.uid() = id);

-- Permitir actualizar solo su propio registro
create policy "Update own global_user record"
on public.project_14_global_users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- (Opcional) Permitir eliminar solo su propio registro
create policy "Delete own global_user record"
on public.project_14_global_users
for delete
using (auth.uid() = id);



-- ===========================
-- TABLA: project_14_new_clients
-- ===========================

-- Activar Row Level Security
alter table public.project_14_new_clients enable row level security;

-- Permitir insertar solo si el cliente está creando su propio registro
create policy "Insert own new_client record"
on public.project_14_new_clients
for insert
with check (auth.uid() = client_id);

-- Permitir leer solo su propio registro
create policy "Select own new_client record"
on public.project_14_new_clients
for select
using (auth.uid() = client_id);

-- Permitir actualizar solo su propio registro
create policy "Update own new_client record"
on public.project_14_new_clients
for update
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

-- (Opcional) Permitir eliminar solo su propio registro
create policy "Delete own new_client record"
on public.project_14_new_clients
for delete
using (auth.uid() = client_id);