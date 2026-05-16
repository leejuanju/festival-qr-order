import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveTableKey } from '@/lib/tables';

function buildSummary(orders) {
  return orders.reduce((acc, order) => {
    const amount = Number(order.total_amount || 0);
    if (order.payment_status === 'cancelled' || order.kitchen_status === 'cancelled') {
      acc.cancelledAmount += amount;
      acc.cancelledCount += 1;
      return acc;
    }
    acc.totalAmount += amount;
    acc.orderCount += 1;
    if (order.payment_status === 'paid') {
      acc.paidAmount += amount;
      acc.paidCount += 1;
    } else if (order.payment_status === 'unpaid') {
      acc.unpaidAmount += amount;
      acc.unpaidCount += 1;
    }
    return acc;
  }, {
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    cancelledAmount: 0,
    orderCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    cancelledCount: 0
  });
}

export async function GET(_request, context) {
  try {
    const { tableNumber: tableKey } = await context.params;
    const supabase = getSupabaseAdmin();
    const table = await resolveTableKey(supabase, tableKey);
    const tableNumber = Number(table.number);

    if (!table?.current_session_id) {
      return NextResponse.json({
        tableNumber,
        table,
        session: null,
        orders: [],
        summary: buildSummary([]),
        serverTime: new Date().toISOString()
      });
    }

    const { data: session, error: sessionError } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('id', table.current_session_id)
      .eq('status', 'open')
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      return NextResponse.json({
        tableNumber,
        table,
        session: null,
        orders: [],
        summary: buildSummary([]),
        serverTime: new Date().toISOString()
      });
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    return NextResponse.json({
      tableNumber,
      table,
      session,
      orders: orders || [],
      summary: buildSummary(orders || []),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
