import { createClient } from '@supabase/supabase-js';
import { type User } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from 'astro:env/client';

export type UserType = User;

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);

export const theUserHasAuthenticated  = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (data.session) return true;
  if (error) return false;
  return false
}