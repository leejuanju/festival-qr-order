-- v6.3: 1~22번 테이블 이미지를 /assets/bear_번호_transparent.png 경로로 재설정합니다.
-- 기존 테이블 public_code는 유지합니다.

update public.booth_tables
set hero_image_url = '/assets/bear_' || number::text || '_transparent.png'
where number between 1 and 22;

-- 확인용
select number, hero_image_url
from public.booth_tables
where number between 1 and 22
order by number;
