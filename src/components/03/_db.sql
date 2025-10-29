-- Crear tabla project_03_users
create table project_03_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Permitir insertar solo si el usuario está creando su propio registro
create policy "Insert own user record"
on public.project_03_users
for insert
with check (auth.uid() = id);

-- Permitir leer solo su propio registro
create policy "Read own user record"
on public.project_03_users
for select
using (auth.uid() = id);

-- Permitir actualizar solo su propio registro
create policy "Update own user record"
on public.project_03_users
for update
using (auth.uid() = id)
with check (auth.uid() = id);
