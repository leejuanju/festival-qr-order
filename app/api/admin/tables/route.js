import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';
import { MAX_TABLE_NUMBER } from '@/lib/tables';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('booth_tables')
      .select('number,label,status,current_session_id,public_code,hero_image_url,updated_at')
      .order('number', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ tables: data || [], maxTableNumber: MAX_TABLE_NUMBER });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const number = Number(body.number);
    if (!Number.isInteger(number) || number < 1 || number > MAX_TABLE_NUMBER) {
      return NextResponse.json({ error: '테이블 번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const patch = {};
    if (body.label !== undefined) patch.label = String(body.label || `${number}번 테이블`).trim().slice(0, 60) || `${number}번 테이블`;
    if (body.hero_image_url !== undefined) patch.hero_image_url = String(body.hero_image_url || '').trim().slice(0, 1000);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('booth_tables')
      .update(patch)
      .eq('number', number)
      .select('number,label,status,current_session_id,public_code,hero_image_url,updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ table: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
