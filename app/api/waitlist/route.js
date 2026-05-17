import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function buildSummary(entries) {
  const base = { waiting: 0, called: 0, seated: 0, cancelled: 0, active: 0 };
  for (const entry of entries || []) {
    if (base[entry.status] !== undefined) base[entry.status] += 1;
    if (entry.status === 'waiting' || entry.status === 'called') base.active += 1;
  }
  return base;
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const includeDone = searchParams.get('includeDone') === 'true';

    let query = supabase
      .from('waitlist_entries')
      .select('queue_no,name,party_size,status,memo,created_at,called_at,updated_at,completed_at')
      .order('queue_no', { ascending: true });

    if (!includeDone) query = query.in('status', ['waiting', 'called']);

    const { data, error } = await query;
    if (error) throw error;

    const activeEntries = (data || []).filter((entry) => entry.status === 'waiting' || entry.status === 'called');
    const calledEntries = activeEntries.filter((entry) => entry.status === 'called');
    const waitingEntries = activeEntries.filter((entry) => entry.status === 'waiting');

    return NextResponse.json({
      entries: data || [],
      activeEntries,
      calledEntries,
      waitingEntries,
      summary: buildSummary(data || []),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
