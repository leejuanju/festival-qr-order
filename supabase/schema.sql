-- 축제 QR 주문 시스템 Supabase 스키마
-- Supabase SQL Editor에서 이 파일 전체를 한 번에 실행하세요.

create extension if not exists pgcrypto;

-- 기존 객체가 있으면 삭제합니다. 새 프로젝트에서 실행하는 것을 권장합니다.
drop function if exists public.close_table_session(integer, boolean);
drop function if exists public.create_order(integer, jsonb, integer);
drop table if exists public.waitlist_entries cascade;
drop table if exists public.orders cascade;
drop table if exists public.table_sessions cascade;
drop table if exists public.menu_items cascade;
drop table if exists public.booth_tables cascade;
drop table if exists public.settings cascade;

drop function if exists public.set_updated_at();

create table public.settings (
  id text primary key default 'main',
  is_open boolean not null default true,
  wait_time_minutes integer not null default 10 check (wait_time_minutes >= 0 and wait_time_minutes <= 240),
  payment_message text not null default '아래 결제 QR 또는 계좌로 결제 후, 직원에게 결제 완료 화면을 보여주세요. 입금자명에는 주문번호를 적어주세요.',
  notice text not null default '',
  guest_hero_image_url text not null default '',
  admin_hero_image_url text not null default '',
  guest_character_image_url text not null default '',
  order_success_image_url text not null default '/assets/bear-order-complete.png',
  guest_hero_title text not null default '축제 테이블 주문',
  guest_hero_subtitle text not null default '메뉴를 담고 주문을 접수하세요. 추가 주문과 미결제 금액은 주문내역에서 한 번에 확인할 수 있습니다.',
  admin_hero_title text not null default '축제 QR 주문 운영',
  admin_hero_subtitle text not null default '메뉴, 품절, 대기열, 운영 상태를 한곳에서 관리합니다.',
  updated_at timestamptz not null default now()
);

create table public.booth_tables (
  number integer primary key check (number between 1 and 22),
  label text not null,
  public_code text not null unique default ('t-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  hero_image_url text not null default '',
  status text not null default 'available' check (status in ('available', 'occupied')),
  current_session_id uuid,
  updated_at timestamptz not null default now()
);

create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null references public.booth_tables(number),
  session_no integer not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique(table_number, session_no)
);

-- current_session_id is managed by app functions.
-- No extra FK is added here to avoid pending trigger events in some Supabase SQL runs.

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default '메뉴',
  price integer not null check (price >= 0),
  image_url text not null default '',
  serve_components jsonb not null default '[]'::jsonb,
  is_visible boolean not null default true,
  is_sold_out boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  session_id uuid not null references public.table_sessions(id),
  table_number integer not null references public.booth_tables(number),
  sequence_no integer not null,
  items jsonb not null,
  total_amount integer not null check (total_amount >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'cancelled')),
  kitchen_status text not null default 'received' check (kitchen_status in ('received', 'cooking', 'ready', 'served', 'cancelled')),
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(session_id, sequence_no)
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  queue_no integer not null unique,
  name text not null default '',
  party_size integer not null default 1 check (party_size >= 1 and party_size <= 50),
  memo text not null default '',
  status text not null default 'waiting' check (status in ('waiting', 'called', 'seated', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz
);

create index orders_session_idx on public.orders(session_id);
create index orders_table_created_idx on public.orders(table_number, created_at desc);
create index table_sessions_status_idx on public.table_sessions(status);
create index waitlist_status_created_idx on public.waitlist_entries(status, created_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

create trigger booth_tables_set_updated_at
before update on public.booth_tables
for each row execute function public.set_updated_at();

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger waitlist_entries_set_updated_at
before update on public.waitlist_entries
for each row execute function public.set_updated_at();

insert into public.settings (id, is_open, wait_time_minutes, payment_message, notice)
values ('main', true, 10, '아래 결제 QR 또는 계좌로 결제 후, 직원에게 결제 완료 화면을 보여주세요. 입금자명에는 주문번호를 적어주세요.', '');

insert into public.booth_tables(number, label)
select n, n || '번 테이블'
from generate_series(1, 22) as n;

update public.booth_tables
set hero_image_url = '/assets/bear-table-12.png'
where number = 12;

insert into public.menu_items(name, description, category, price, sort_order, image_url, serve_components) values
('닭꼬치 2개', '직화 닭꼬치 2개 구성', '메인', 7000, 10, '', '[]'::jsonb),
('염통꼬치 5개', '염통꼬치 5개 구성', '메인', 7000, 20, '', '[]'::jsonb),
('어묵탕', '따뜻한 어묵탕', '메인', 7000, 30, '', '[]'::jsonb),
('계란찜', '부드러운 계란찜', '메인', 5000, 40, '', '[]'::jsonb),
('김치전', '바삭한 김치전', '메인', 8000, 50, '', '[]'::jsonb),
('부추전', '고소한 부추전', '메인', 8000, 60, '', '[]'::jsonb),
('황도 화채', '시원한 황도 화채', '메인', 7000, 70, '', '[]'::jsonb),
('죠스바 초밥 + 조안나', '죠스바 초밥과 조안나 구성', '메인', 7000, 80, '', '[]'::jsonb),
('닭꼬치 2개 + 염통꼬치 3개 + 하이볼 2잔', '꼬치와 하이볼 2잔 세트', '세트', 25000, 110, '', '[{"name":"닭꼬치","quantity":2},{"name":"염통꼬치","quantity":3},{"name":"하이볼","quantity":2}]'::jsonb),
('랜덤전 + 막걸리 + 계란찜', '전, 막걸리, 계란찜 세트', '세트', 17000, 120, '', '[{"name":"랜덤전","quantity":1},{"name":"막걸리","quantity":1},{"name":"계란찜","quantity":1}]'::jsonb),
('어묵탕 + 닭꼬치 2개 + 소주/맥주', '어묵탕, 닭꼬치, 주류 구성', '세트', 23000, 130, '', '[{"name":"어묵탕","quantity":1},{"name":"닭꼬치","quantity":2},{"name":"소주/맥주","quantity":1}]'::jsonb),
('하이볼', '하이볼 1잔', '음료', 8000, 210, '', '[]'::jsonb),
('소주', '소주 1병', '음료', 5000, 220, '', '[]'::jsonb),
('맥주', '맥주 1병', '음료', 5000, 230, '', '[]'::jsonb),
('막걸리', '막걸리 1병', '음료', 5000, 240, '', '[]'::jsonb);

-- 테이블의 현재 열린 세션을 가져오거나 새로 만들고, 주문을 생성합니다.
create or replace function public.create_order(
  p_table_number integer,
  p_items jsonb,
  p_total_amount integer
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.table_sessions%rowtype;
  v_current_session_id uuid;
  v_next_session_no integer;
  v_next_sequence_no integer;
  v_order_no text;
  v_order public.orders%rowtype;
begin
  if p_table_number < 1 or p_table_number > 22 then
    raise exception 'invalid table number';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'items required';
  end if;

  if p_total_amount < 0 then
    raise exception 'invalid total amount';
  end if;

  select current_session_id
  into v_current_session_id
  from public.booth_tables
  where number = p_table_number
  for update;

  if not found then
    raise exception 'table not found';
  end if;

  if v_current_session_id is not null then
    select *
    into v_session
    from public.table_sessions
    where id = v_current_session_id
      and status = 'open';
  end if;

  if v_session.id is null then
    select coalesce(max(session_no), 0) + 1
    into v_next_session_no
    from public.table_sessions
    where table_number = p_table_number;

    insert into public.table_sessions(table_number, session_no, status)
    values (p_table_number, v_next_session_no, 'open')
    returning * into v_session;

    update public.booth_tables
    set current_session_id = v_session.id,
        status = 'occupied'
    where number = p_table_number;
  end if;

  select coalesce(max(sequence_no), 0) + 1
  into v_next_sequence_no
  from public.orders
  where session_id = v_session.id;

  v_order_no := 'T' || lpad(p_table_number::text, 2, '0') ||
                '-S' || lpad(v_session.session_no::text, 3, '0') ||
                '-O' || lpad(v_next_sequence_no::text, 2, '0');

  insert into public.orders(
    order_no,
    session_id,
    table_number,
    sequence_no,
    items,
    total_amount,
    payment_status,
    kitchen_status
  )
  values (
    v_order_no,
    v_session.id,
    p_table_number,
    v_next_sequence_no,
    p_items,
    p_total_amount,
    'unpaid',
    'received'
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- 테이블 현재 세션을 종료합니다. force=false면 미결제/미제공 주문이 있을 때 막습니다.
create or replace function public.close_table_session(
  p_table_number integer,
  p_force boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_blockers integer;
begin
  select current_session_id
  into v_session_id
  from public.booth_tables
  where number = p_table_number
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'table_not_found');
  end if;

  if v_session_id is null then
    return jsonb_build_object('ok', true, 'message', 'already_empty');
  end if;

  select count(*)
  into v_blockers
  from public.orders
  where session_id = v_session_id
    and (
      payment_status not in ('paid', 'cancelled')
      or kitchen_status not in ('served', 'cancelled')
    );

  if v_blockers > 0 and p_force = false then
    return jsonb_build_object('ok', false, 'message', 'not_clearable', 'blockers', v_blockers);
  end if;

  update public.table_sessions
  set status = 'closed', closed_at = now()
  where id = v_session_id;

  update public.booth_tables
  set current_session_id = null,
      status = 'available'
  where number = p_table_number;

  return jsonb_build_object('ok', true, 'message', 'closed');
end;
$$;

-- 브라우저에서 직접 테이블을 건드리지 못하게 RLS를 켭니다.
alter table public.settings enable row level security;
alter table public.booth_tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.waitlist_entries enable row level security;

-- security definer 함수가 anon에게 직접 호출되는 것을 막습니다.
revoke execute on function public.create_order(integer, jsonb, integer) from public, anon, authenticated;
revoke execute on function public.close_table_session(integer, boolean) from public, anon, authenticated;
grant execute on function public.create_order(integer, jsonb, integer) to service_role;
grant execute on function public.close_table_session(integer, boolean) to service_role;
