# v5 변경사항 적용 가이드

## 추가된 기능

1. 메뉴 카테고리: 메인 / 세트 / 음료
2. 메뉴 이미지 URL 관리
3. 손님 메뉴판 상단 이미지/문구 변경
4. 관리자 상단 이미지/문구 변경
5. 관리자 대기열 번호표 기능

## Supabase 적용 순서

기존 프로젝트에 적용할 때는 반드시 아래 순서로 진행한다.

### 1. 구조 변경 SQL 실행

Supabase SQL Editor에서 실행:

```sql
-- 파일: supabase/v5_migration.sql
```

이 SQL은 기존 주문 데이터는 건드리지 않고 컬럼과 대기열 테이블만 추가한다.

### 2. 메뉴 교체 SQL 실행

테스트 주문을 정리한 뒤 새 메뉴로 교체하려면 실행:

```sql
-- 파일: supabase/v5_menu_seed.sql
```

주의: 이 SQL은 menu_items를 비우고 새 메뉴를 넣는다.

## 이미지 입력 방식

현재 v5는 파일 업로드 방식이 아니라 이미지 URL 방식이다.

예:

```text
https://example.com/image.jpg
```

관리자 화면에서 메뉴별 이미지 URL, 손님 메뉴판 상단 이미지 URL, 관리자 상단 이미지 URL을 입력할 수 있다.

## 배포 순서

1. GitHub에 v5 코드 push
2. Netlify 자동 배포 확인
3. Supabase에서 v5_migration.sql 실행
4. v5_menu_seed.sql 실행 여부 결정
5. Netlify 재배포
6. /admin에서 이미지/문구/대기열 테스트
7. /order/1에서 메뉴 이미지와 카테고리 확인
