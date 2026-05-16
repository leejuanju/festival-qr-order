# 축제 QR 주문 시스템

테이블별 QR 주문, 홀 결제확인, 주방 주문표, 관리자 메뉴·대기열 관리를 위한 Next.js + Supabase 프로젝트입니다.

## 주요 화면

- `/` 운영자 홈
- `/order/[public_code]` 손님용 테이블 주문 화면
- `/hall` 홀 / 결제확인 화면
- `/kitchen` 주방 주문표
- `/admin` 관리자 화면
- `/admin/qr` 1~22번 테이블 QR 출력 화면

## v6 핵심사항

- 테이블은 22개입니다.
- 손님 QR은 숫자 URL이 아니라 `booth_tables.public_code` 기반 URL입니다.
- 기존 `/order/1` 같은 숫자 URL fallback은 테스트용으로만 남겨두었습니다.
- QR은 반드시 배포 주소의 `/admin/qr`에서 출력하세요.
- 주방 화면은 단순 리스트형으로 구성되어 확인/제공완료만 처리합니다.

## 환경변수

`.env.local` 파일은 프로젝트 루트에 직접 생성합니다. GitHub에 올리면 안 됩니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
ADMIN_PIN=1538
KITCHEN_PIN=1539
```

## Supabase 업데이트

기존 v5 DB에는 `supabase/v6_migration.sql`만 실행합니다.
`schema.sql`은 새 Supabase 프로젝트를 처음부터 만들 때만 사용합니다.
