export const MAX_TABLE_NUMBER = 22;

export function isValidTableNumber(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAX_TABLE_NUMBER;
}

export async function resolveTableKey(supabase, rawKey) {
  const key = String(rawKey || '').trim();
  if (!key) {
    throw new Error('테이블 QR 코드가 올바르지 않습니다.');
  }

  let query = supabase
    .from('booth_tables')
    .select('*')
    .eq('public_code', key)
    .maybeSingle();

  let { data: table, error } = await query;
  if (error) throw error;

  // 운영 중 기존 숫자 URL로 테스트할 수 있도록 숫자 fallback을 유지합니다.
  // 실제 QR 출력은 public_code 기반 URL을 사용합니다.
  if (!table && /^\d+$/.test(key)) {
    const tableNumber = Number(key);
    if (isValidTableNumber(tableNumber)) {
      const fallback = await supabase
        .from('booth_tables')
        .select('*')
        .eq('number', tableNumber)
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      table = fallback.data;
    }
  }

  if (!table) {
    throw new Error('등록되지 않은 테이블 QR입니다. 직원에게 문의하세요.');
  }
  return table;
}
