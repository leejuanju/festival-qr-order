import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminPin, isKitchenPin, readPin } from '@/lib/auth';
import { getServiceProgressFromItems, normalizeOrderItems } from '@/lib/serviceItems';

const kitchenStatuses = new Set(['received', 'cooking', 'ready', 'served', 'cancelled']);

function statusFromServiceItems(items, fallback = 'received') {
  const progress = getServiceProgressFromItems(items);
  if (progress.allServed) return 'served';
  if (progress.anyServed) return 'cooking';
  if (fallback === 'served') return 'cooking';
  return fallback || 'received';
}

function toggleServiceItem(items, serviceItemId, served) {
  let changed = false;
  const nextItems = normalizeOrderItems(items).map((item) => ({
    ...item,
    service_items: (item.service_items || []).map((entry) => {
      if (String(entry.id) !== String(serviceItemId)) return entry;
      changed = true;
      return {
        ...entry,
        served: Boolean(served),
        served_at: served ? new Date().toISOString() : null
      };
    })
  }));
  return { items: nextItems, changed };
}

function markAllServiceItems(items, served = true) {
  const servedAt = served ? new Date().toISOString() : null;
  return normalizeOrderItems(items).map((item) => ({
    ...item,
    service_items: (item.service_items || []).map((entry) => ({
      ...entry,
      served: Boolean(served),
      served_at: servedAt
    }))
  }));
}

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

      if (status === 'served') {
        const { data: current, error: currentError } = await supabase
          .from('orders')
          .select('items')
          .eq('id', id)
          .single();
        if (currentError) throw currentError;
        patch.items = markAllServiceItems(current.items || [], true);
        patch.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        patch.completed_at = new Date().toISOString();
      }
    } else if (action === 'set_service_item_served') {
      const serviceItemId = String(body.serviceItemId || '');
      if (!serviceItemId) return NextResponse.json({ error: '제공 체크 항목 ID가 필요합니다.' }, { status: 400 });

      const { data: current, error: currentError } = await supabase
        .from('orders')
        .select('items,kitchen_status')
        .eq('id', id)
        .single();
      if (currentError) throw currentError;

      const { items, changed } = toggleServiceItem(current.items || [], serviceItemId, body.served !== false);
      if (!changed) return NextResponse.json({ error: '제공 체크 항목을 찾지 못했습니다.' }, { status: 404 });

      const nextStatus = statusFromServiceItems(items, current.kitchen_status === 'received' ? 'cooking' : current.kitchen_status);
      patch.items = items;
      patch.kitchen_status = nextStatus;
      patch.completed_at = nextStatus === 'served' ? new Date().toISOString() : null;
    } else if (action === 'normalize_service_items') {
      const { data: current, error: currentError } = await supabase
        .from('orders')
        .select('items,kitchen_status')
        .eq('id', id)
        .single();
      if (currentError) throw currentError;
      const items = normalizeOrderItems(current.items || []);
      patch.items = items;
      patch.kitchen_status = statusFromServiceItems(items, current.kitchen_status);
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
