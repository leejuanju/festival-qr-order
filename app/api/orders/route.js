import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function normalizeQuantity(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > 50) return null;
  return n;
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const tableNumber = Number(body.tableNumber);
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 10) {
      return NextResponse.json({ error: '테이블 번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('is_open')
      .eq('id', 'main')
      .single();

    if (settingsError) throw settingsError;
    if (!settings?.is_open) {
      return NextResponse.json({ error: '현재 주문 접수가 중지되어 있습니다.' }, { status: 403 });
    }

    const requested = rawItems
      .map((item) => ({ id: String(item.id || ''), quantity: normalizeQuantity(item.quantity) }))
      .filter((item) => item.id && item.quantity !== null);

    if (requested.length === 0) {
      return NextResponse.json({ error: '주문할 메뉴를 선택하세요.' }, { status: 400 });
    }

    const requestedMap = new Map();
    for (const item of requested) {
      requestedMap.set(item.id, (requestedMap.get(item.id) || 0) + item.quantity);
    }

    const ids = Array.from(requestedMap.keys());
    const { data: menuRows, error: menuError } = await supabase
      .from('menu_items')
      .select('id,name,price,is_visible,is_sold_out')
      .in('id', ids);

    if (menuError) throw menuError;
    if (!menuRows || menuRows.length !== ids.length) {
      return NextResponse.json({ error: '선택한 메뉴 중 판매하지 않는 메뉴가 있습니다.' }, { status: 400 });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const row of menuRows) {
      if (!row.is_visible || row.is_sold_out) {
        return NextResponse.json({ error: `${row.name} 메뉴는 현재 주문할 수 없습니다.` }, { status: 400 });
      }
      const quantity = requestedMap.get(row.id);
      const subtotal = row.price * quantity;
      totalAmount += subtotal;
      normalizedItems.push({
        menu_item_id: row.id,
        name: row.name,
        price: row.price,
        quantity,
        subtotal
      });
    }

    const { data: order, error: orderError } = await supabase.rpc('create_order', {
      p_table_number: tableNumber,
      p_items: normalizedItems,
      p_total_amount: totalAmount
    });

    if (orderError) throw orderError;

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
