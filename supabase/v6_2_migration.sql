-- v6.2: 테이블별 투명 곰 이미지 기본 경로 적용
-- 사용자가 public/assets/bear_1_transparent.png ~ bear_22_transparent.png 파일을 프로젝트에 넣어둔 경우 사용합니다.
-- 기존 hero_image_url을 덮어써서 1~22번 테이블을 일괄 연결합니다.

update public.booth_tables
set hero_image_url = '/assets/bear_' || number::text || '_transparent.png'
where number between 1 and 22;
