import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminPin, isKitchenPin, readPin } from '@/lib/auth';

const kitchenStatuses = new Set(['received', 'cooking', 'ready', 'served', 'cancelled']);

export async function PATCH(request, context) {
  const pin = readPin(request);
  const isAdmin = isAdminPin(pin);
  const isKitchen = isKitchenPin(pin);

  if (!process.env.ADMIN_PIN || !process.env.KITCHEN_PIN) {
    return NextResponse.json({ error: '서버에 PIN 환경변수가 설정되지 않았습니다.' }, { status: 500 });
  }

  if (!isAdmin && !isKitchen) {
    return NextResponse.json({ error: 'PIN이 올바르지 않습니다.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action;
    const supabase = getSupabaseAdmin();

    const patch = {};

    if (action === 'mark_paid') {
      if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
      patch.payment_status = 'paid';
    } else if (action === 'mark_unpaid') {
      if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
      patch.payment_status = 'unpaid';
    } else if (action === 'cancel') {
      if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
      patch.payment_status = 'cancelled';
      patch.kitchen_status = 'cancelled';
      patch.completed_at = new Date().toISOString();
    } else if (action === 'set_kitchen_status') {
      const status = String(body.kitchenStatus || '');
      if (!kitchenStatuses.has(status)) {
        return NextResponse.json({ error: '조리상태가 올바르지 않습니다.' }, { status: 400 });
      }
      patch.kitchen_status = status;
      if (status === 'served' || status === 'cancelled') {
        patch.completed_at = new Date().toISOString();
      }
    } else if (action === 'memo') {
      if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
      patch.memo = String(body.memo || '').slice(0, 500);
    } else {
      return NextResponse.json({ error: '지원하지 않는 동작입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
