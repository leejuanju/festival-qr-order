import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [{ data: settings, error: settingsError }, { data: menuItems, error: menuError }] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 'main').single(),
      supabase
        .from('menu_items')
        .select('id,name,description,category,price,image_url,is_sold_out,sort_order')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true })
    ]);

    if (settingsError) throw settingsError;
    if (menuError) throw menuError;

    return NextResponse.json({ settings, menuItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
