import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireKitchenOrAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = requireKitchenOrAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const { data: sessions, error: sessionsError } = await supabase
      .from('table_sessions')
      .select('id,table_number,session_no,status')
      .eq('status', 'open');

    if (sessionsError) throw sessionsError;
    const sessionIds = (sessions || []).map((s) => s.id);

    if (sessionIds.length === 0) {
      return NextResponse.json({ orders: [], serverTime: new Date().toISOString() });
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    const activeOrders = (orders || []).filter((order) => !['served', 'cancelled'].includes(order.kitchen_status));
    return NextResponse.json({ orders: activeOrders, serverTime: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
