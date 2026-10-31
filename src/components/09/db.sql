create table project_09_clicks_by_user (
  id uuid primary key references auth.users(id) on delete cascade,
  clicks int8 not null
);

-- Permitir insertar solo si el usuario está creando su propio registro
create policy "Insert own clicks record"
on public.project_09_clicks_by_user
for insert
with check (auth.uid() = id);

-- Permitir leer solo su propio registro
create policy "Read own clicks record"
on public.project_09_clicks_by_user
for select
using (auth.uid() = id);

-- Permitir actualizar solo su propio registro
create policy "Update own clicks record"
on public.project_09_clicks_by_user
for update
using (auth.uid() = id)
with check (auth.uid() = id);