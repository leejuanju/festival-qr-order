import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth';

const VALID_STATUS = new Set(['waiting', 'called', 'seated', 'cancelled']);

function normalizeText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function buildSummary(entries) {
  const base = { waiting: 0, called: 0, seated: 0, cancelled: 0, active: 0 };
  for (const entry of entries) {
    if (base[entry.status] !== undefined) base[entry.status] += 1;
    if (entry.status === 'waiting' || entry.status === 'called') base.active += 1;
  }
  return base;
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const includeDone = searchParams.get('includeDone') === 'true';

    let query = supabase
      .from('waitlist_entries')
      .select('*')
      .order('queue_no', { ascending: true });

    if (!includeDone) query = query.in('status', ['waiting', 'called']);

    const { data, error } = await query;
    if (error) throw error;

    const { data: allActive, error: summaryError } = await supabase
      .from('waitlist_entries')
      .select('status')
      .in('status', ['waiting', 'called']);
    if (summaryError) throw summaryError;

    return NextResponse.json({
      entries: data || [],
      summary: buildSummary([...(allActive || []), ...((includeDone ? data : []) || []).filter((e) => ['seated', 'cancelled'].includes(e.status))])
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const partySize = Number(body.party_size ?? body.partySize ?? 1);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 50) {
      return NextResponse.json({ error: '인원수는 1~50 사이 정수여야 합니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: maxRows, error: maxError } = await supabase
      .from('waitlist_entries')
      .select('queue_no')
      .order('queue_no', { ascending: false })
      .limit(1);
    if (maxError) throw maxError;

    const nextNo = (maxRows?.[0]?.queue_no || 0) + 1;
    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert({
        queue_no: nextNo,
        name: normalizeText(body.name, 80),
        party_size: partySize,
        memo: normalizeText(body.memo, 300),
        status: 'waiting'
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data }, { status: 201 });
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
    if (!id) return NextResponse.json({ error: '대기 항목 ID가 필요합니다.' }, { status: 400 });

    const patch = {};
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!VALID_STATUS.has(status)) return NextResponse.json({ error: '대기 상태가 올바르지 않습니다.' }, { status: 400 });
      patch.status = status;
      if (status === 'called') patch.called_at = new Date().toISOString();
      if (status === 'seated' || status === 'cancelled') patch.completed_at = new Date().toISOString();
    }
    if (body.name !== undefined) patch.name = normalizeText(body.name, 80);
    if (body.memo !== undefined) patch.memo = normalizeText(body.memo, 300);
    if (body.party_size !== undefined || body.partySize !== undefined) {
      const partySize = Number(body.party_size ?? body.partySize);
      if (!Number.isInteger(partySize) || partySize < 1 || partySize > 50) {
        return NextResponse.json({ error: '인원수는 1~50 사이 정수여야 합니다.' }, { status: 400 });
      }
      patch.party_size = partySize;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('waitlist_entries')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'done';
    const supabase = getSupabaseAdmin();

    let query = supabase.from('waitlist_entries').delete();
    if (mode === 'done') query = query.in('status', ['seated', 'cancelled']);
    else if (mode === 'all') query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    else return NextResponse.json({ error: '삭제 모드가 올바르지 않습니다.' }, { status: 400 });

    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
