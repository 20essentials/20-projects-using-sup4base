CREATE TABLE project_12_user_profile_card (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
)