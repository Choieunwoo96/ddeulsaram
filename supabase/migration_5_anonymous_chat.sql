-- 마이그레이션 5: 실시간 채팅을 비로그인(익명 닉네임)으로도 쓸 수 있게 변경
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 Run 하세요.
-- (migration_4_features.sql을 먼저 실행해서 chat_messages 테이블이 있어야 합니다.)

-- 로그인 없이 채팅한 메시지는 user_id가 없으므로 NOT NULL 제약을 풀어준다.
alter table chat_messages alter column user_id drop not null;

-- 기존 "로그인한 사용자만 작성 가능" 정책을 "비로그인은 user_id 없이, 로그인은
-- 본인 id로만" 작성 가능하도록 바꾼다. (다른 사람인 척 user_id를 위조하는 것만 막고,
-- 익명 채팅 자체는 막지 않음 — 방/신청과 마찬가지로 닉네임만 있으면 참여 가능.)
drop policy if exists "로그인한 사용자만 채팅 작성 가능" on chat_messages;
create policy "누구나 채팅 작성 가능(로그인 시 본인 id만 사용)"
  on chat_messages for insert
  with check (user_id is null or auth.uid() = user_id);
