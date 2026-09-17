-- 마이그레이션 6: 방/채팅 신고 기능 + 채팅 차단(밴) 기능
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 Run 하세요.
-- (기존 테이블/데이터에는 영향 없습니다. 테이블 2개 신규 생성 + chat_messages에 트리거 1개 추가.)

-- ---------------------------------------------------------------------------
-- 신고
--    방 상세페이지 / 채팅 메시지에서 "신고" 버튼을 누르면 여기에 쌓인다.
--    신고 대상(방 제목, 채팅 내용 등)은 나중에 원본이 삭제돼도 알아볼 수 있게
--    target_label에 그대로 복사해서 저장해둔다. offender_* 는 "누구를 차단할지"
--    관리자가 바로 판단할 수 있도록 신고 시점의 작성자 정보를 같이 저장한다.
-- ---------------------------------------------------------------------------

create table if not exists reports (
  id text primary key,
  target_type text not null check (target_type in ('room', 'chat_message')),
  target_id text not null,
  target_label text not null default '',
  offender_nickname text,
  offender_user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  detail text not null default '',
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_status on reports(status, created_at desc);

alter table reports enable row level security;
-- 다른 테이블과 동일하게, 서버(service_role)에서만 읽고 쓴다. 정책을 만들지 않아서
-- 익명 클라이언트(anon key)는 직접 접근할 수 없다.

-- ---------------------------------------------------------------------------
-- 차단(밴)
--    관리자가 신고를 보고 "이 사람 채팅 금지" 처리하면 여기 한 줄이 추가된다.
--    로그인한 사용자는 user_id로, 비로그인(닉네임)은 nickname으로 차단한다.
-- ---------------------------------------------------------------------------

create table if not exists blocked_senders (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  nickname text,
  reason text not null default '',
  created_at timestamptz not null default now()
);

alter table blocked_senders enable row level security;
-- 이 테이블도 서버 전용. 다만 아래 트리거 함수는 security definer로 만들어서,
-- anon key로 들어오는 채팅 INSERT 요청이라도 이 테이블을 조회해 차단 여부를
-- 확인할 수 있게 한다 (RLS로 막혀 있어도 트리거 함수 자체는 우회해서 읽음).

create or replace function public.reject_blocked_chat_sender()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.user_id is not null then
    if exists (select 1 from blocked_senders where user_id = new.user_id) then
      raise exception '차단된 계정은 채팅을 작성할 수 없습니다.';
    end if;
  else
    if exists (
      select 1 from blocked_senders
      where nickname is not null and lower(nickname) = lower(new.nickname)
    ) then
      raise exception '차단된 닉네임은 채팅을 작성할 수 없습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reject_blocked_chat_sender on chat_messages;
create trigger trg_reject_blocked_chat_sender
  before insert on chat_messages
  for each row execute procedure public.reject_blocked_chat_sender();
