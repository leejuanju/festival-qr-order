import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'main').single();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const patch = {};

    if (typeof body.is_open === 'boolean') patch.is_open = body.is_open;
    if (body.wait_time_minutes !== undefined) {
      const wait = Number(body.wait_time_minutes);
      if (!Number.isInteger(wait) || wait < 0 || wait > 240) {
        return NextResponse.json({ error: '예상 대기시간은 0~240분 사이 정수여야 합니다.' }, { status: 400 });
      }
      patch.wait_time_minutes = wait;
    }
    if (body.payment_message !== undefined) patch.payment_message = String(body.payment_message || '').slice(0, 1000);
    if (body.notice !== undefined) patch.notice = String(body.notice || '').slice(0, 1000);
    if (body.guest_hero_image_url !== undefined) patch.guest_hero_image_url = String(body.guest_hero_image_url || '').trim().slice(0, 1000);
    if (body.admin_hero_image_url !== undefined) patch.admin_hero_image_url = String(body.admin_hero_image_url || '').trim().slice(0, 1000);
    if (body.guest_character_image_url !== undefined) patch.guest_character_image_url = String(body.guest_character_image_url || '').trim().slice(0, 1000);
    if (body.order_success_image_url !== undefined) patch.order_success_image_url = String(body.order_success_image_url || '').trim().slice(0, 1000);
    if (body.guest_hero_title !== undefined) patch.guest_hero_title = String(body.guest_hero_title || '').trim().slice(0, 120);
    if (body.guest_hero_subtitle !== undefined) patch.guest_hero_subtitle = String(body.guest_hero_subtitle || '').trim().slice(0, 400);
    if (body.admin_hero_title !== undefined) patch.admin_hero_title = String(body.admin_hero_title || '').trim().slice(0, 120);
    if (body.admin_hero_subtitle !== undefined) patch.admin_hero_subtitle = String(body.admin_hero_subtitle || '').trim().slice(0, 400);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('settings')
      .update(patch)
      .eq('id', 'main')
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
