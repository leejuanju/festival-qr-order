-- v5 메뉴 교체 SQL
-- 현재 테스트 메뉴를 행사 메뉴로 교체합니다.
-- 실행 전 테스트 주문을 초기화하는 것을 권장합니다.

-- 선택: 테스트 주문 초기화
-- delete from public.orders;
-- delete from public.table_sessions;
-- update public.booth_tables set status = 'available', current_session_id = null;

truncate table public.menu_items;

insert into public.menu_items
  (name, description, category, price, is_visible, is_sold_out, sort_order, image_url)
values
  ('닭꼬치 2개', '직화 닭꼬치 2개 구성', '메인', 7000, true, false, 10, ''),
  ('염통꼬치 5개', '염통꼬치 5개 구성', '메인', 7000, true, false, 20, ''),
  ('어묵탕', '따뜻한 어묵탕', '메인', 7000, true, false, 30, ''),
  ('계란찜', '부드러운 계란찜', '메인', 5000, true, false, 40, ''),
  ('김치전', '바삭한 김치전', '메인', 8000, true, false, 50, ''),
  ('부추전', '고소한 부추전', '메인', 8000, true, false, 60, ''),
  ('황도 화채', '시원한 황도 화채', '메인', 7000, true, false, 70, ''),
  ('죠스바 초밥 + 조안나', '죠스바 초밥과 조안나 구성', '메인', 7000, true, false, 80, ''),

  ('닭꼬치 2개 + 염통꼬치 3개 + 하이볼 2잔', '꼬치와 하이볼 2잔 세트', '세트', 25000, true, false, 110, ''),
  ('랜덤전 + 막걸리 + 계란찜', '전, 막걸리, 계란찜 세트', '세트', 17000, true, false, 120, ''),
  ('어묵탕 + 닭꼬치 2개 + 소주/맥주', '어묵탕, 닭꼬치, 주류 구성', '세트', 23000, true, false, 130, ''),

  ('하이볼', '하이볼 1잔', '음료', 8000, true, false, 210, ''),
  ('소주', '소주 1병', '음료', 5000, true, false, 220, ''),
  ('맥주', '맥주 1병', '음료', 5000, true, false, 230, ''),
  ('막걸리', '막걸리 1병', '음료', 5000, true, false, 240, '');
