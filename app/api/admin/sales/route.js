import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

function sumOrders(orders = []) {
  return orders.reduce((acc, order) => {
    const amount = Number(order.total_amount || 0);
    if (order.payment_status === 'paid' && order.kitchen_status !== 'cancelled') {
      acc.paidAmount += amount;
      acc.paidCount += 1;
    }
    if (order.payment_status !== 'cancelled' && order.kitchen_status !== 'cancelled') {
      acc.totalAmount += amount;
      acc.totalCount += 1;
    }
    if (order.payment_status === 'unpaid' && order.kitchen_status !== 'cancelled') {
      acc.unpaidAmount += amount;
      acc.unpaidCount += 1;
    }
    if (order.payment_status === 'cancelled' || order.kitchen_status === 'cancelled') {
      acc.cancelledAmount += amount;
      acc.cancelledCount += 1;
    }
    return acc;
  }, {
    paidAmount: 0,
    paidCount: 0,
    totalAmount: 0,
    totalCount: 0,
    unpaidAmount: 0,
    unpaidCount: 0,
    cancelledAmount: 0,
    cancelledCount: 0
  });
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount,payment_status,kitchen_status,created_at');

    if (error) throw error;
    return NextResponse.json({ sales: sumOrders(data || []) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
