import { NextResponse } from 'next/server';

export function readPin(request) {
  return request.headers.get('x-staff-pin') || '';
}

export function isAdminPin(pin) {
  return Boolean(process.env.ADMIN_PIN) && pin === process.env.ADMIN_PIN;
}

export function isKitchenPin(pin) {
  return Boolean(process.env.KITCHEN_PIN) && pin === process.env.KITCHEN_PIN;
}

export function requireAdmin(request) {
  const pin = readPin(request);
  if (!process.env.ADMIN_PIN) {
    return { ok: false, response: NextResponse.json({ error: '서버에 ADMIN_PIN이 설정되지 않았습니다.' }, { status: 500 }) };
  }
  if (!isAdminPin(pin)) {
    return { ok: false, response: NextResponse.json({ error: '관리자 PIN이 올바르지 않습니다.' }, { status: 401 }) };
  }
  return { ok: true, pin };
}

export function requireKitchenOrAdmin(request) {
  const pin = readPin(request);
  if (!process.env.ADMIN_PIN || !process.env.KITCHEN_PIN) {
    return { ok: false, response: NextResponse.json({ error: '서버에 PIN 환경변수가 설정되지 않았습니다.' }, { status: 500 }) };
  }
  if (!isAdminPin(pin) && !isKitchenPin(pin)) {
    return { ok: false, response: NextResponse.json({ error: 'PIN이 올바르지 않습니다.' }, { status: 401 }) };
  }
  return { ok: true, pin, isAdmin: isAdminPin(pin) };
}
