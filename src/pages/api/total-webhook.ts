import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const post: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Supabase webhook envía los datos dentro de `record`
    const usuario_id = body.record?.usuario_id;
    const total_compra = body.record?.total_compra;

    if (!usuario_id || total_compra === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing fields in webhook payload' }),
        { status: 400 }
      );
    }

    // Actualizamos o insertamos el total en la tabla
    const { error: upsertError } = await supabase
      .from('project_11_compras')
      .upsert({ usuario_id, total_compra }, { onConflict: 'usuario_id' });

    if (upsertError) {
      console.error('Error upserting total:', upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500
      });
    }

    // Broadcast del total actualizado via Supabase Realtime
    try {
      await supabase.channel('totales').send({
        type: 'broadcast',
        event: 'total_updated',
        payload: { usuario_id, total_compra }
      });
    } catch (broadcastError) {
      console.error('Broadcast failed:', broadcastError);
    }

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (err) {
    console.error('Internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500
    });
  }
};
