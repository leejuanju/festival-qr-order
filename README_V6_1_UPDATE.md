# v6.1 업데이트

## 변경사항
- 손님 메뉴판 상단의 곰 이미지를 더 작고 자연스럽게 보이도록 조정했습니다.
- 모바일에서 상단 이미지가 과하게 커지지 않도록 CSS를 수정했습니다.
- 상단 섹션 아래의 중복 안내 카드(예상대기/결제방식/테이블)를 제거했습니다.
- 주문완료 화면의 결제 안내 문구를 더 크고 눈에 띄는 결제 박스로 변경했습니다.
- 1번 테이블 기본 곰 이미지를 `public/assets/bear-table-1.png`로 추가했습니다.

## 적용 순서
1. `.env.local`을 기존 프로젝트에서 복사합니다.
2. Supabase SQL Editor에서 `supabase/v6_1_migration.sql`을 실행합니다.
3. `npm install`, `npm run build`, `npm run dev`로 로컬 테스트합니다.
4. GitHub에 push하면 Netlify가 자동 배포합니다.

## 이미지 URL 입력
- 메뉴 이미지는 `/admin` → 메뉴 관리 → 이미지 URL에 입력합니다.
- 테이블 상단 이미지는 `/admin` → 테이블 이미지 / 비공개 QR 코드 → 각 테이블의 이미지 URL에 입력합니다.
- 프로젝트 내부 public/assets에 넣은 이미지는 `/assets/파일명.png` 형식으로 입력합니다.
