-- ===========================================
-- REQUERIMIENTO PREVIO
-- ===========================================
-- Habilitar extensión para generar UUIDs aleatorios
create extension if not exists "pgcrypto";


-- ===========================================
-- TABLA: project_14_global_users
-- ===========================================
create table project_14_global_users (
  user_row_id uuid primary key default gen_random_uuid(), -- PK autogenerada
  id uuid references auth.users(id) on delete cascade,     -- FK a auth.users
  username text not null unique,
  created_at timestamp with time zone default now(),
  role_text text default 'user',
  email text unique
);


-- ===========================================
-- TABLA: project_14_new_clients
-- ===========================================
create table project_14_new_clients (
  client_row_id uuid primary key default gen_random_uuid(),  -- PK autogenerada
  global_user_id uuid references project_14_global_users(user_row_id) on delete cascade, -- FK correcta
  username text not null,
  created_at timestamp with time zone default now()
);


-- ===========================================
-- FUNCIÓN: insertar nuevo cliente automáticamente
-- ===========================================
create or replace function insert_new_client_after_user()
returns trigger
language plpgsql
as $$
begin
  -- Insertar una nueva fila en project_14_new_clients con los mismos datos
  insert into project_14_new_clients (global_user_id, username, created_at)
  values (new.user_row_id, new.username, new.created_at);

  return new;
end;
$$;


-- ===========================================
-- TRIGGER: después de insertar en global_users
-- ===========================================
create trigger after_global_user_insert
after insert on project_14_global_users
for each row
execute function insert_new_client_after_user();


-- ===========================================
-- SEGURIDAD: project_14_global_users
-- ===========================================

-- Activar Row Level Security
alter table project_14_global_users enable row level security;

-- Permitir insertar solo si el usuario crea su propio registro (auth.uid() = id)
create policy "Insert own global_user record"
on project_14_global_users
for insert
with check (auth.uid() = id);

-- Permitir leer solo su propio registro
create policy "Select own global_user record"
on project_14_global_users
for select
using (auth.uid() = id);

-- Permitir actualizar solo su propio registro
create policy "Update own global_user record"
on project_14_global_users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Permitir eliminar solo su propio registro
create policy "Delete own global_user record"
on project_14_global_users
for delete
using (auth.uid() = id);



-- ===========================================
-- SEGURIDAD: project_14_new_clients
-- ===========================================

-- Activar Row Level Security
alter table project_14_new_clients enable row level security;

-- Permitir insertar solo si el cliente está creando su propio registro
create policy "Insert own new_client record"
on project_14_new_clients
for insert
with check (
  auth.uid() = (
    select id
    from project_14_global_users
    where user_row_id = global_user_id
  )
);

-- Permitir leer solo su propio registro
create policy "Select own new_client record"
on project_14_new_clients
for select
using (
  auth.uid() = (
    select id
    from project_14_global_users
    where user_row_id = global_user_id
  )
);

-- Permitir actualizar solo su propio registro
create policy "Update own new_client record"
on project_14_new_clients
for update
using (
  auth.uid() = (
    select id
    from project_14_global_users
    where user_row_id = global_user_id
  )
)
with check (
  auth.uid() = (
    select id
    from project_14_global_users
    where user_row_id = global_user_id
  )
);

-- Permitir eliminar solo su propio registro
create policy "Delete own new_client record"
on project_14_new_clients
for delete
using (
  auth.uid() = (
    select id
    from project_14_global_users
    where user_row_id = global_user_id
  )
);
