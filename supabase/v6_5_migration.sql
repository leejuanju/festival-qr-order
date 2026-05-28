-- v6.5: 메뉴별 제공 체크 구성과 세트 구성 요소 추가
-- 기존 주문/테이블/대기열 데이터는 삭제하지 않습니다.

alter table public.menu_items
  add column if not exists serve_components jsonb not null default '[]'::jsonb;

-- 기존 세트 메뉴 기본 제공 체크 구성
update public.menu_items
set serve_components = '[
  {"name":"닭꼬치","quantity":2},
  {"name":"염통꼬치","quantity":3},
  {"name":"하이볼","quantity":2}
]'::jsonb
where name = '닭꼬치 2개 + 염통꼬치 3개 + 하이볼 2잔';

update public.menu_items
set serve_components = '[
  {"name":"랜덤전","quantity":1},
  {"name":"막걸리","quantity":1},
  {"name":"계란찜","quantity":1}
]'::jsonb
where name = '랜덤전 + 막걸리 + 계란찜';

update public.menu_items
set serve_components = '[
  {"name":"어묵탕","quantity":1},
  {"name":"닭꼬치","quantity":2},
  {"name":"소주/맥주","quantity":1}
]'::jsonb
where name = '어묵탕 + 닭꼬치 2개 + 소주/맥주';
