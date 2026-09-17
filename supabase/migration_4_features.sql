-- 마이그레이션 4: 검색/알림/관리자 대시보드/실시간 채팅 기능 추가
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 Run 하세요.
-- (기존 테이블/데이터에는 영향 없습니다. 컬럼 2개 추가 + 테이블 2개 신규 생성입니다.)

-- ---------------------------------------------------------------------------
-- 1) 검색 기능: 별도 스키마 변경 없음 (기존 rooms.title / description으로 검색)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2) 알림 기능
--    로그인한 사용자가 방을 만들거나 신청하면, 그 사용자의 auth.users id를
--    rooms.host_user_id / applications.applicant_user_id 에 같이 저장해두고,
--    "누가 내 방에 신청했다 / 내 신청이 수락·거절됐다" 같은 알림을 notifications
--    테이블에 쌓는다. 로그인 없이 방을 만들거나 신청한 경우엔 이 값이 비어있어서
--    알림이 발생하지 않는다 (기존 익명 이용 흐름은 그대로 유지됨).
-- ---------------------------------------------------------------------------

alter table rooms add column if not exists host_user_id uuid references auth.users(id) on delete set null;
alter table applications add column if not exists applicant_user_id uuid references auth.users(id) on delete set null;

create table if not exists notifications (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications(user_id, created_at desc);

-- 이 앱은 알림도 다른 테이블처럼 서버(service_role)에서만 읽고 쓴다.
-- RLS를 켜두고 정책은 만들지 않아서, 익명 클라이언트(anon key)는 직접 접근할 수 없다.
alter table notifications enable row level security;

-- ---------------------------------------------------------------------------
-- 3) 관리자 대시보드: 별도 스키마 변경 없음 (기존 테이블 집계로 통계 표시)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4) 실시간 채팅
--    사이트 전역 채팅 1개 방. 메시지는 누구나 실시간으로 읽을 수 있지만,
--    작성은 로그인한 사용자만 가능하다 (스팸/신고 대응을 쉽게 하기 위해).
--    브라우저가 Supabase Realtime으로 이 테이블을 직접 구독하므로,
--    RLS 정책과 supabase_realtime publication 등록이 둘 다 필요하다.
-- ---------------------------------------------------------------------------

create table if not exists chat_messages (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_created_at on chat_messages(created_at desc);

alter table chat_messages enable row level security;

drop policy if exists "채팅은 누구나 조회 가능" on chat_messages;
create policy "채팅은 누구나 조회 가능"
  on chat_messages for select
  using (true);

drop policy if exists "로그인한 사용자만 채팅 작성 가능" on chat_messages;
create policy "로그인한 사용자만 채팅 작성 가능"
  on chat_messages for insert
  with check (auth.uid() = user_id);

-- 브라우저가 실시간으로 새 메시지를 받으려면 이 테이블이 supabase_realtime
-- publication에 등록되어 있어야 한다. (Supabase 대시보드 Database > Replication
-- 에서 토글을 켜는 것과 동일한 효과. 이미 등록되어 있으면 아무 일도 안 함.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
end $$;
