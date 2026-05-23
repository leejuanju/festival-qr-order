# v6.4 업데이트

## 추가 기능

- 숨겨진 관리자 집계 페이지 추가: `/admin/menu-stats`
- 관리자 PIN 인증 후 접근
- 메뉴별 총 주문수량, 결제완료수량, 미결제수량, 취소수량 표시
- 메뉴별 결제완료금액, 미결제금액 표시
- 전체 요약: 결제완료 금액, 미결제 금액, 총 주문수량, 결제완료 수량
- 카테고리 필터와 메뉴명 검색
- CSV 다운로드

## 집계 기준

- 결제상태가 `paid`인 주문의 메뉴 수량은 결제완료 수량으로 계산
- 결제상태가 `unpaid`인 주문의 메뉴 수량은 미결제 수량으로 계산
- `payment_status = cancelled` 또는 `kitchen_status = cancelled`인 주문은 취소 수량으로 계산
- 메뉴별 집계는 주문 당시 `orders.items`에 저장된 메뉴명, 단가, 수량을 기준으로 계산

## 접속 주소

운영홈에는 노출하지 않는다. 직접 아래 주소로 접속한다.

```text
/admin/menu-stats
```

배포 후:

```text
https://inje-uri-order.netlify.app/admin/menu-stats
```
