import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const tableNumber = Number(body.tableNumber);
    const force = Boolean(body.force);

    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 22) {
      return NextResponse.json({ error: '테이블 번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('close_table_session', {
      p_table_number: tableNumber,
      p_force: force
    });

    if (error) throw error;

    const status = data?.ok === false ? 409 : 200;
    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
