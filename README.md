# Festival QR Order System v4

단기 축제 음식 부스를 위한 QR 주문 웹앱입니다.

## Main screens

- `/` 운영자 홈
- `/order/1` ~ `/order/10` 손님용 테이블 주문 화면
- `/hall` 홀 / 결제확인 화면
- `/kitchen` 주방 주문표
- `/admin` 관리자 화면
- `/admin/qr` 테이블 QR 출력

## v4 workflow

- 손님은 테이블 QR로 주문합니다.
- 주문은 홀 화면과 주방 화면에 동시에 표시됩니다.
- 주방은 결제 여부와 무관하게 `주문접수 → 조리중 → 준비완료`만 처리합니다.
- 홀은 개별 주문 결제확인 또는 테이블 세션의 미결제 주문 전체 결제확인을 할 수 있습니다.
- 손님은 주문 완료 화면의 `주문내역 보기`에서 현재 테이블 세션의 주문별 결제상태와 남은 결제금액을 확인할 수 있습니다.
- `테이블 비우기`는 현재 세션을 종료하고 다음 손님을 새 세션으로 받습니다. 기록은 삭제되지 않습니다.

## Setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY
ADMIN_PIN=2468
KITCHEN_PIN=1357
```

Install and run:

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```
