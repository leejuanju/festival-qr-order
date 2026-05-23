import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function keyForItem(item) {
  if (item?.menu_item_id) return `id:${item.menu_item_id}`;
  return `legacy:${item?.name || '알 수 없는 메뉴'}:${toNumber(item?.price)}`;
}

function createEmptyRow({ id = '', name = '알 수 없는 메뉴', category = '기타', price = 0, sort_order = 9999, image_url = '' } = {}) {
  return {
    id,
    name,
    category: category || '기타',
    price: toNumber(price),
    sort_order: toNumber(sort_order),
    image_url: image_url || '',
    totalQty: 0,
    paidQty: 0,
    unpaidQty: 0,
    cancelledQty: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    cancelledAmount: 0,
    orderLines: 0,
    paidLines: 0,
    unpaidLines: 0,
    cancelledLines: 0
  };
}

function addLine(row, item, order) {
  const quantity = toNumber(item?.quantity);
  const subtotal = toNumber(item?.subtotal || toNumber(item?.price) * quantity);
  const isCancelled = order.payment_status === 'cancelled' || order.kitchen_status === 'cancelled';
  const isPaid = order.payment_status === 'paid' && !isCancelled;
  const isUnpaid = order.payment_status === 'unpaid' && !isCancelled;

  row.orderLines += 1;

  if (isCancelled) {
    row.cancelledQty += quantity;
    row.cancelledAmount += subtotal;
    row.cancelledLines += 1;
    return;
  }

  row.totalQty += quantity;
  row.totalAmount += subtotal;

  if (isPaid) {
    row.paidQty += quantity;
    row.paidAmount += subtotal;
    row.paidLines += 1;
  } else if (isUnpaid) {
    row.unpaidQty += quantity;
    row.unpaidAmount += subtotal;
    row.unpaidLines += 1;
  }
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();

    const [{ data: menus, error: menuError }, { data: orders, error: orderError }] = await Promise.all([
      supabase
        .from('menu_items')
        .select('id,name,category,price,sort_order,image_url,is_visible,is_sold_out')
        .order('sort_order', { ascending: true }),
      supabase
        .from('orders')
        .select('id,order_no,items,total_amount,payment_status,kitchen_status,created_at')
        .order('created_at', { ascending: true })
    ]);

    if (menuError) throw menuError;
    if (orderError) throw orderError;

    const rowsByKey = new Map();

    for (const menu of menus || []) {
      rowsByKey.set(`id:${menu.id}`, createEmptyRow(menu));
    }

    const summary = {
      activeOrderCount: 0,
      paidOrderCount: 0,
      unpaidOrderCount: 0,
      cancelledOrderCount: 0,
      totalQty: 0,
      paidQty: 0,
      unpaidQty: 0,
      cancelledQty: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      cancelledAmount: 0
    };

    for (const order of orders || []) {
      const isCancelled = order.payment_status === 'cancelled' || order.kitchen_status === 'cancelled';
      if (isCancelled) {
        summary.cancelledOrderCount += 1;
      } else {
        summary.activeOrderCount += 1;
        if (order.payment_status === 'paid') summary.paidOrderCount += 1;
        if (order.payment_status === 'unpaid') summary.unpaidOrderCount += 1;
      }

      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const key = keyForItem(item);
        if (!rowsByKey.has(key)) {
          rowsByKey.set(key, createEmptyRow({
            id: item.menu_item_id || '',
            name: item.name || '알 수 없는 메뉴',
            category: '기록 메뉴',
            price: item.price || 0,
            sort_order: 9999,
            image_url: item.image_url || ''
          }));
        }
        const row = rowsByKey.get(key);
        addLine(row, item, order);
      }
    }

    const rows = Array.from(rowsByKey.values()).map((row) => {
      summary.totalQty += row.totalQty;
      summary.paidQty += row.paidQty;
      summary.unpaidQty += row.unpaidQty;
      summary.cancelledQty += row.cancelledQty;
      summary.totalAmount += row.totalAmount;
      summary.paidAmount += row.paidAmount;
      summary.unpaidAmount += row.unpaidAmount;
      summary.cancelledAmount += row.cancelledAmount;
      return row;
    }).sort((a, b) => {
      if (a.category !== b.category) {
        const order = ['메인', '세트', '음료', '기록 메뉴', '기타'];
        return order.indexOf(a.category) - order.indexOf(b.category);
      }
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name, 'ko');
    });

    const generatedAt = new Date().toISOString();
    return NextResponse.json({ rows, summary, generatedAt });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
