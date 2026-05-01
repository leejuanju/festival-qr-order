import { NextResponse } from 'next/server';
import { isAdminPin, isKitchenPin } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!process.env.ADMIN_PIN || !process.env.KITCHEN_PIN) {
      return NextResponse.json({ error: '서버에 PIN 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const body = await request.json();
    const role = String(body.role || '');
    const pin = String(body.pin || '');

    const allowed = role === 'admin'
      ? isAdminPin(pin)
      : role === 'kitchen'
        ? isKitchenPin(pin) || isAdminPin(pin)
        : false;

    if (!allowed) {
      return NextResponse.json({ error: 'PIN이 올바르지 않습니다. 다시 입력하세요.' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
