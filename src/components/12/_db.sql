-- Crear tabla
CREATE TABLE project_12_user_profile_card (
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
employee_name text,
role_text text
);

-- Habilitar Row-Level Security
ALTER TABLE project_12_user_profile_card ENABLE ROW LEVEL SECURITY;

-- Política de lectura: el usuario solo puede ver su propia fila
CREATE POLICY "Users can read their own profile card"
ON project_12_user_profile_card
FOR SELECT
USING (id = auth.uid());

-- Política de inserción: el usuario solo puede crear una fila con su propio id
CREATE POLICY "Users can insert their own profile card"
ON project_12_user_profile_card
FOR INSERT
WITH CHECK (id = auth.uid());

-- Política de actualización: el usuario solo puede actualizar su propia fila
CREATE POLICY "Users can update their own profile card"
ON project_12_user_profile_card
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política de eliminación: el usuario solo puede borrar su propia fila
CREATE POLICY "Users can delete their own profile card"
ON project_12_user_profile_card
FOR DELETE
USING (id = auth.uid());
