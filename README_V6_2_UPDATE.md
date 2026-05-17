# v6.2 업데이트

## 포함 사항

- `/waitlist` 손님용 대기현황 화면 추가
- 관리자 대기열과 `/waitlist` 화면 연동
- 손님이 자기 대기번호를 입력하면 호출 상태 확인 가능
- 호출 시 진동/알림/간단한 사운드 시도
- 테이블별 이미지 기본 경로를 `/assets/bear_1_transparent.png` ~ `/assets/bear_22_transparent.png`로 변경
- 테이블 주문 화면 상단 곰 이미지 크기 축소 및 모바일 배치 개선

## 알림/진동 제한

브라우저 보안 정책상 손님 휴대폰을 강제로 울리게 할 수 없습니다.
다음 조건에서만 진동/알림이 동작합니다.

- 손님이 `/waitlist` 화면을 열어둠
- 대기번호를 입력함
- `진동/알림 활성화` 버튼을 직접 누름
- 브라우저와 기기가 vibration/notification을 지원함

전화번호 기반 SMS, 카카오 알림톡, 웹푸시를 넣지 않는 이상 화면을 닫은 사용자에게 강제 알림을 보내는 것은 어렵습니다.

## Supabase 적용

SQL Editor에서 실행:

```sql
supabase/v6_2_migration.sql
```

## 이미지 파일 위치

아래 파일들이 프로젝트에 있어야 합니다.

```text
public/assets/bear_1_transparent.png
...
public/assets/bear_22_transparent.png
```

웹에서 쓰는 URL은 다음과 같습니다.

```text
/assets/bear_1_transparent.png
```
