# v6 Validation

아래 검증을 완료했습니다.

- `npm install --no-audit --no-fund` 성공
- `npm run build` 성공
- Next.js production build compile 성공
- `/api/admin/tables`, `/api/tables/[tableKey]` route 포함 확인
- `/order/[tableNumber]`는 public_code 기반 tableKey를 처리하도록 변경
- `/admin/qr`는 1~22번 테이블의 public_code 기반 QR을 생성하도록 변경
- 주방 화면은 단순 리스트형으로 변경

주의:
- 실제 Supabase DB에는 `supabase/v6_migration.sql`을 반드시 1회 실행해야 합니다.
- 기존 운영 DB에서는 `schema.sql`을 다시 실행하지 마세요.
- Secret key는 ZIP에 포함되어 있지 않습니다. 기존 `.env.local`을 새 폴더에 복사해야 합니다.
