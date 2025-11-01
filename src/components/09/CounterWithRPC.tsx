import { useEffect, useState } from 'react';
import './CounterWithRPC.css';
import { supabase } from '@/lib/supabase';
export const CounterWithRPC = () => {
  const [clicks, setClicks] = useState<null | number>(null);

  async function updateClicks() {
    const { data } = await supabase.rpc('updateClicksInProject9');
    setClicks(data);
  }

  useEffect(() => {
    async function getClicksFromSupabase() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      const { data: existing, error: fetchError } = await supabase
        .from('project_09_clicks_by_user')
        .select('*')
        .eq('id', userId)
        .single();

      if (existing) {
        setClicks(existing?.clicks ?? 0);
        return;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(fetchError);
      } else if (!existing) {
        const { data, error } = await supabase
          .from('project_09_clicks_by_user')
          .insert({ id: userId, clicks: 0 })
          .select();
        setClicks(0);
        if (error) console.error(error);
      }
    }

    getClicksFromSupabase();
  }, []);

  return (
    <main className='counter-with-rpc-container' onClick={updateClicks}>
      <div className='orb-container'>
        <div className='orb'>
          <div className='orb-inner'></div>
          <div className='orb-inner'></div>
        </div>
      </div>
      <aside className='num-of-clicks'>
        {clicks !== null ? `Num of Clicks: ${clicks}` : 'Loading...'}
      </aside>
    </main>
  );
};
