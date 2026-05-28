-- v6.6: 세트 메뉴 제공 체크 구성 보정
-- 기존 세트 메뉴 또는 이름에 +가 들어간 세트 메뉴의 serve_components를 명시적으로 맞춥니다.

alter table public.menu_items
  add column if not exists serve_components jsonb not null default '[]'::jsonb;

update public.menu_items
set serve_components = '[
  {"name":"닭꼬치", "quantity":2},
  {"name":"염통볶음", "quantity":1},
  {"name":"하이볼", "quantity":2}
]'::jsonb
where name ilike '%닭꼬치%'
  and name ilike '%염통%'
  and name ilike '%하이볼%';

update public.menu_items
set serve_components = '[
  {"name":"랜덤전", "quantity":1},
  {"name":"막걸리", "quantity":1},
  {"name":"계란찜", "quantity":1}
]'::jsonb
where name ilike '%랜덤전%'
  and name ilike '%막걸리%'
  and name ilike '%계란찜%';

update public.menu_items
set serve_components = '[
  {"name":"어묵탕", "quantity":1},
  {"name":"닭꼬치", "quantity":2},
  {"name":"소주/맥주", "quantity":1}
]'::jsonb
where name ilike '%어묵탕%'
  and name ilike '%닭꼬치%'
  and (name ilike '%소주%' or name ilike '%맥주%');
