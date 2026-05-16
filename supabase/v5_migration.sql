-- v5 구조 변경 마이그레이션
-- 기존 주문/테이블/메뉴 데이터는 유지하면서 이미지, 배너, 대기열 기능을 추가합니다.
-- Supabase SQL Editor에서 이 파일 전체를 1회 실행하세요.

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

-- 기존 set_updated_at 함수가 이미 있을 때만 트리거를 갱신합니다.
drop trigger if exists waitlist_entries_set_updated_at on public.waitlist_entries;
create trigger waitlist_entries_set_updated_at
before update on public.waitlist_entries
for each row execute function public.set_updated_at();

alter table public.waitlist_entries enable row level security;
