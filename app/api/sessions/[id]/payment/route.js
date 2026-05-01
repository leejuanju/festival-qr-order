import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request, context) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'mark_unpaid_paid');

    if (action !== 'mark_unpaid_paid') {
      return NextResponse.json({ error: '지원하지 않는 동작입니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('session_id', id)
      .eq('payment_status', 'unpaid')
      .neq('kitchen_status', 'cancelled')
      .select('id,total_amount');

    if (error) throw error;

    const updatedOrders = data || [];
    const paidAmount = updatedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return NextResponse.json({ ok: true, updatedCount: updatedOrders.length, paidAmount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
