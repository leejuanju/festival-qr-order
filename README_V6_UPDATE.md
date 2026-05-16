# v6 업데이트 요약

이번 버전은 기존 v5에서 다음 구조 변경을 반영한 버전입니다.

## 변경사항

1. 테이블 수를 10개에서 22개로 확장했습니다.
2. 손님용 주문 URL을 `/order/1` 같은 숫자 URL 대신 `booth_tables.public_code` 기반의 비공개 URL로 전환했습니다.
3. `/admin/qr`에서 1~22번 테이블 QR을 public_code 기반으로 출력합니다.
4. 홀 화면의 테이블 상태판을 클릭하면 해당 테이블 주문 세션으로 스크롤 이동합니다.
5. 주방 화면을 칸반형 보드에서 단순 주문 리스트로 변경했습니다.
   - 확인 버튼: 주문 확인 처리
   - 제공완료 버튼: 주문을 제공완료 처리하고 목록에서 숨김
6. 메뉴별 이미지 URL 기능은 유지합니다.
7. 테이블별 상단 이미지 URL 기능을 추가했습니다.
8. 주문완료 화면 이미지 URL 기능을 추가했습니다.
9. 기본 이미지 asset을 추가했습니다.
   - `/assets/bear-order-complete.png`
   - `/assets/bear-table-12.png`

## Supabase 적용 순서

기존 v5 DB에 적용할 때는 `schema.sql`을 다시 실행하지 마세요.
아래 파일만 실행합니다.

```sql
supabase/v6_migration.sql
```

실행 후 확인 SQL:

```sql
select number, public_code, hero_image_url
from public.booth_tables
order by number;
```

1~22번 테이블이 보이면 정상입니다.

## QR 출력

이제 손님 QR은 숫자 URL이 아닙니다.
반드시 Netlify 배포 주소의 관리자 QR 화면에서 다시 출력하세요.

```text
https://inje-uri-order.netlify.app/admin/qr
```

기존 `/order/1` 방식 QR은 운영용으로 사용하지 않는 것을 권장합니다.
숫자 URL fallback은 테스트용으로만 남겨두었습니다.
