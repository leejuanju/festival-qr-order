import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveTableKey } from '@/lib/tables';

export async function GET(_request, context) {
  try {
    const { tableKey } = await context.params;
    const supabase = getSupabaseAdmin();
    const table = await resolveTableKey(supabase, tableKey);
    return NextResponse.json({ table });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
