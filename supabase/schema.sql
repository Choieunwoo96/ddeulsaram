-- 뜰사람(DdeulSaram) 기본 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 Run 하세요.

create table if not exists rooms (
  id text primary key,
  title text not null,
  major text not null,
  minor text not null,
  mode text not null check (mode in ('online', 'offline')),
  location text not null default '',
  datetime text not null default '',
  capacity integer not null default 1,
  condition text not null default '',
  description text not null default '',
  host_nickname text not null,
  status text not null default 'open' check (status in ('open', 'closed', 'done')),
  host_token text, -- 방장 본인 확인용 비밀 토큰 (신청 수락/거절 권한 체크에 사용, 브라우저에는 쿠키로만 저장됨)
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id text primary key,
  room_id text not null references rooms(id) on delete cascade,
  nickname text not null,
  spec text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists queue_entries (
  id text primary key,
  nickname text not null,
  major text not null,
  minor text not null,
  mode text not null check (mode in ('online', 'offline')),
  region text not null,
  timeslot text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id text primary key,
  a_entry jsonb not null,
  b_entry jsonb not null,
  matched_at timestamptz not null default now()
);

create index if not exists idx_rooms_major_minor on rooms(major, minor);
create index if not exists idx_applications_room_id on applications(room_id);
create index if not exists idx_queue_lookup on queue_entries(major, minor, mode, region);

-- 이 앱은 브라우저에서 Supabase를 직접 호출하지 않고, Next.js 서버(서버 액션)에서
-- service_role 키로만 접근한다. service_role은 RLS를 무시하므로 서버 쪽 동작에는
-- 영향이 없고, 대신 (만약 유출되더라도) 익명 클라이언트가 이 테이블들을 직접
-- 읽고 쓰지 못하도록 RLS를 켜서 기본적으로 막아둔다.
alter table rooms enable row level security;
alter table applications enable row level security;
alter table queue_entries enable row level security;
alter table matches enable row level security;
