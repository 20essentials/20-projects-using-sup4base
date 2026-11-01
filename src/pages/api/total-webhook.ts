import type { APIRoute } from 'astro';
import { channel } from '@/lib/common-channel';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Supabase webhook envía los datos dentro de `record`
    const usuario_id = body.record?.usuario_id;
    const total_compra = body.record?.total_compra;

    if (usuario_id == null || total_compra == null) {
      return new Response(
        JSON.stringify({ error: 'Missing fields in webhook payload' }),
        { status: 400 }
      );
    }

    // Solo notificamos: no escribimos en project_11_compras porque este
    // webhook se dispara precisamente por un INSERT/UPDATE en esa tabla.
    // Escribir aquí re-dispara el webhook (bucle) y con RLS el anon falla.
    try {
      await channel.send({
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
