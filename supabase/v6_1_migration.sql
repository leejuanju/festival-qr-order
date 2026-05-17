-- v6.1 마이그레이션
-- 목적: 1번 테이블 기본 곰 이미지를 추가합니다. 기존에 직접 지정한 이미지가 있으면 덮어쓰지 않습니다.

update public.booth_tables
set hero_image_url = '/assets/bear-table-1.png'
where number = 1
  and coalesce(hero_image_url, '') = '';
