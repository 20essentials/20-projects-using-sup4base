
CREATE TABLE project_20_leaderboard (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  points number,
  profile_image text,
)

ALTER TABLE project_20_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read" ON project_20_leaderboard
FOR SELECT
USING (true);

