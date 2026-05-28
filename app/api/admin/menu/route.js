import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';
import { normalizeServeComponents, parseServeComponentsText } from '@/lib/serviceItems';

function normalizeMenuPatch(body, { requireName = false } = {}) {
  const patch = {};
  const allowed = ['name', 'description', 'category', 'price', 'image_url', 'is_visible', 'is_sold_out', 'sort_order', 'serve_components'];
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  if (requireName || patch.name !== undefined) {
    const name = String(patch.name || '').trim().slice(0, 100);
    if (!name) return { error: '메뉴명을 입력하세요.' };
    patch.name = name;
  }

  if (patch.description !== undefined) patch.description = String(patch.description || '').trim().slice(0, 300);
  if (patch.image_url !== undefined) patch.image_url = String(patch.image_url || '').trim().slice(0, 1000);
  if (patch.category !== undefined) patch.category = String(patch.category || '메뉴').trim().slice(0, 50) || '메뉴';
  if (patch.price !== undefined) {
    const price = Number(patch.price);
    if (!Number.isInteger(price) || price < 0 || price > 1000000) return { error: '가격이 올바르지 않습니다.' };
    patch.price = price;
  }
  if (patch.sort_order !== undefined) patch.sort_order = Number(patch.sort_order) || 0;
  if (body.serve_components_text !== undefined) patch.serve_components = parseServeComponentsText(body.serve_components_text);
  else if (patch.serve_components !== undefined) patch.serve_components = normalizeServeComponents(patch.serve_components);
  if (patch.is_visible !== undefined) patch.is_visible = Boolean(patch.is_visible);
  if (patch.is_sold_out !== undefined) patch.is_sold_out = Boolean(patch.is_sold_out);

  return { patch };
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ menuItems: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { patch, error } = normalizeMenuPatch({
      name: body.name,
      description: body.description || '',
      category: body.category || '메뉴',
      price: body.price,
      sort_order: body.sort_order ?? 100,
      image_url: body.image_url || '',
      is_visible: body.is_visible ?? true,
      is_sold_out: body.is_sold_out ?? false,
      serve_components: body.serve_components,
      serve_components_text: body.serve_components_text
    }, { requireName: true });
    if (error) return NextResponse.json({ error }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error: insertError } = await supabase
      .from('menu_items')
      .insert(patch)
      .select('*')
      .single();

    if (insertError) throw insertError;
    return NextResponse.json({ menuItem: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: '메뉴 ID가 필요합니다.' }, { status: 400 });

    const { patch, error } = normalizeMenuPatch(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data, error: updateError } = await supabase
      .from('menu_items')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ menuItem: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
