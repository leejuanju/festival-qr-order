-- v6 마이그레이션
-- 목적:
-- 1) 테이블 수 10개 -> 22개 확장
-- 2) 손님용 URL을 /order/1 같은 숫자 URL이 아니라 public_code 기반 URL로 전환
-- 3) 테이블별 상단 이미지, 주문완료 이미지 설정 추가
-- 4) 기존 create_order 함수의 테이블 번호 허용 범위를 22번까지 확장
-- 기존 주문/메뉴/대기열 데이터는 삭제하지 않습니다.

create extension if not exists pgcrypto;

-- v5를 건너뛴 환경에서도 안전하게 동작하도록 기본 이미지/대기열 관련 컬럼을 보장합니다.
alter table public.menu_items
  add column if not exists image_url text not null default '';

alter table public.settings
  add column if not exists guest_hero_image_url text not null default '',
  add column if not exists admin_hero_image_url text not null default '',
  add column if not exists guest_hero_title text not null default '축제 테이블 주문',
  add column if not exists guest_hero_subtitle text not null default '메뉴를 담고 주문을 접수하세요. 추가 주문과 미결제 금액은 주문내역에서 한 번에 확인할 수 있습니다.',
  add column if not exists admin_hero_title text not null default '축제 QR 주문 운영',
  add column if not exists admin_hero_subtitle text not null default '메뉴, 품절, 대기열, 운영 상태를 한곳에서 관리합니다.';

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  queue_no integer not null,
  name text not null default '',
  party_size integer not null default 1 check (party_size >= 1 and party_size <= 50),
  memo text not null default '',
  status text not null default 'waiting' check (status in ('waiting', 'called', 'seated', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz,
  unique(queue_no)
);

create index if not exists waitlist_status_created_idx on public.waitlist_entries(status, created_at asc);
alter table public.waitlist_entries enable row level security;

-- booth_tables.number CHECK 제약을 1~22로 교체합니다.
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.booth_tables'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%number%'
  loop
    execute format('alter table public.booth_tables drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.booth_tables
  add constraint booth_tables_number_check check (number between 1 and 22);

alter table public.booth_tables
  add column if not exists public_code text,
  add column if not exists hero_image_url text not null default '';

-- 1~22번 테이블을 보장합니다. 기존 1~10번은 유지하고, public_code가 비어 있으면 생성합니다.
insert into public.booth_tables(number, label, status, public_code, hero_image_url)
select
  n,
  n || '번 테이블',
  'available',
  't-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  case when n = 12 then '/assets/bear-table-12.png' else '' end
from generate_series(1, 22) as n
on conflict (number) do update
set label = excluded.label,
    public_code = coalesce(nullif(public.booth_tables.public_code, ''), excluded.public_code),
    hero_image_url = case
      when public.booth_tables.number = 12 and coalesce(public.booth_tables.hero_image_url, '') = '' then '/assets/bear-table-12.png'
      else public.booth_tables.hero_image_url
    end;

update public.booth_tables
set public_code = 't-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
where public_code is null or public_code = '';

alter table public.booth_tables
  alter column public_code set not null;

create unique index if not exists booth_tables_public_code_key
on public.booth_tables(public_code);

alter table public.settings
  add column if not exists guest_character_image_url text not null default '',
  add column if not exists order_success_image_url text not null default '/assets/bear-order-complete.png';

update public.settings
set order_success_image_url = case
      when coalesce(order_success_image_url, '') = '' then '/assets/bear-order-complete.png'
      else order_success_image_url
    end
where id = 'main';

-- create_order 함수의 허용 테이블 범위를 22번까지 확장합니다.
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

revoke execute on function public.create_order(integer, jsonb, integer) from public, anon, authenticated;
grant execute on function public.create_order(integer, jsonb, integer) to service_role;
