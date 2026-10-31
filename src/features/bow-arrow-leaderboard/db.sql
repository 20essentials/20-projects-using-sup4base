CREATE TABLE project_20_leaderboard (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  points integer,
  profile_image text
);

create function increment_points(user_id uuid, increment_by int)
returns void as $$
begin
  update project_20_leaderboard
  set points = points + increment_by
  where id = user_id;
end;
$$ language plpgsql;

-- Habilitar Row Level Security
ALTER TABLE project_20_leaderboard ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS

-- Permitir lectura a todos los usuarios
CREATE POLICY "Allow read" ON project_20_leaderboard
FOR SELECT
USING (true);

-- Permitir inserción solo para el propio usuario
CREATE POLICY "Allow insert for self" ON project_20_leaderboard
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permitir actualización solo para el propio usuario
CREATE POLICY "Allow update for self" ON project_20_leaderboard
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir eliminación solo para el propio usuario
CREATE POLICY "Allow delete for self" ON project_20_leaderboard
FOR DELETE
USING (auth.uid() = id);
