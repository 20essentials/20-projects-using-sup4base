import { supabase } from '@/lib/supabase';
import { PATH } from '@/lib/auth-path';
import { setPreviousUrl } from '@/lib/local-storage';

/**
 * Ensures there is an authenticated session before allowing an edit action.
 * If there is no session, it remembers the current page and redirects to the
 * Google login so the user comes back after authenticating.
 *
 * Returns `true` when the user is authenticated and the action may continue.
 */
export const ensureAuthenticated = async (): Promise<boolean> => {
  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session) return true;

  setPreviousUrl({ previousUrl: window.location.href });
  window.location.href = PATH.login;
  return false;
};
