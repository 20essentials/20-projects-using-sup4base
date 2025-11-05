create table project_11_compras (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  total_compra numeric(10, 2) not null default 0
);

alter table public.project_11_compras enable row level security;

create policy "Los usuarios solo pueden ver su propia compra"
on public.project_11_compras
for select
using (auth.uid() = usuario_id);

create policy "Los usuarios solo pueden insertar su propio registro"
on public.project_11_compras
for insert
with check (auth.uid() = usuario_id);

create policy "Los usuarios solo pueden actualizar su propio total"
on public.project_11_compras
for update
using (auth.uid() = usuario_id);

create policy "Los usuarios solo pueden eliminar su propio registro"
on public.project_11_compras
for delete
using (auth.uid() = usuario_id);