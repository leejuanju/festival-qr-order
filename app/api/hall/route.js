import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

function isSessionClearable(orders) {
  return orders.every((order) =>
    ['paid', 'cancelled'].includes(order.payment_status) &&
    ['served', 'cancelled'].includes(order.kitchen_status)
  );
}

function buildSessionSummary(orders) {
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

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();

    const [{ data: tables, error: tablesError }, { data: sessions, error: sessionsError }] = await Promise.all([
      supabase.from('booth_tables').select('*').order('number', { ascending: true }),
      supabase.from('table_sessions').select('*').eq('status', 'open').order('table_number', { ascending: true })
    ]);

    if (tablesError) throw tablesError;
    if (sessionsError) throw sessionsError;

    const sessionIds = (sessions || []).map((s) => s.id);
    let orders = [];

    if (sessionIds.length > 0) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      orders = data || [];
    }

    const grouped = (sessions || []).map((session) => {
      const sessionOrders = orders.filter((order) => order.session_id === session.id);
      const summary = buildSessionSummary(sessionOrders);
      return {
        ...session,
        orders: sessionOrders,
        clearable: isSessionClearable(sessionOrders),
        unpaidCount: summary.unpaidCount,
        unservedCount: sessionOrders.filter((order) => !['served', 'cancelled'].includes(order.kitchen_status)).length,
        totalAmount: summary.totalAmount,
        paidAmount: summary.paidAmount,
        unpaidAmount: summary.unpaidAmount,
        cancelledAmount: summary.cancelledAmount,
        summary
      };
    });

    return NextResponse.json({ tables, sessions: grouped, serverTime: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
