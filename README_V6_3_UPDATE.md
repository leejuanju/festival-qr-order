# v6.3 변경사항

- 손님용 대기현황 화면에서 본인 번호 호출 시 최대 10회 진동/알림을 시도합니다.
- 대기현황 상단에 곰 이미지를 추가했습니다. 기본 파일: `/assets/waitlist-bear.png`.
- 모바일에서도 대기현황 통계 3개가 1행 3열로 유지됩니다.
- 홀/결제확인 통계와 주문 요약을 모바일에서도 1행 3열 중심으로 압축했습니다.
- 테이블 상태판은 모바일에서 2열 배치가 유지되도록 조정했습니다.
- 관리자 화면에서 테이블 이미지 관리 섹션을 분리했습니다. 새 주소: `/admin/tables`.
- 관리자 화면에 `팔린 총액`을 표시합니다. 기준은 결제확인된 주문 합계입니다.
- `next.config.js`를 추가해 중첩 폴더의 lockfile 경고와 dev root 추론 문제를 줄였습니다.
- `.npmrc`는 공식 npm registry만 사용하도록 정리했습니다.

## 22번 이미지 점검

22번 테이블 이미지는 아래 파일이 있어야 표시됩니다.

```text
public/assets/bear_22_transparent.png
```

Supabase `booth_tables.hero_image_url`은 아래 값이어야 합니다.

```text
/assets/bear_22_transparent.png
```

SQL 확인:

```sql
select number, hero_image_url
from public.booth_tables
where number = 22;
```
