-- 마이그레이션 3: 회원가입/로그인 (Supabase Auth) 지원
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 Run 하세요.
-- (기존 테이블/데이터에는 영향 없습니다. profiles 테이블만 새로 추가됩니다.)

-- 닉네임 등 "공개해도 되는" 사용자 정보를 담는 테이블.
-- Supabase Auth가 관리하는 auth.users 테이블은 비밀번호 등 민감정보가 있어
-- 직접 노출하지 않고, 대신 이 profiles 테이블을 만들어서 쓴다.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- 닉네임은 게시글/방 작성자 표시 등에 쓰이므로 누구나 조회 가능해야 한다.
drop policy if exists "프로필은 누구나 조회 가능" on profiles;
create policy "프로필은 누구나 조회 가능"
  on profiles for select
  using (true);

-- 본인 프로필만 수정 가능 (남의 닉네임을 바꾸지 못하도록).
drop policy if exists "본인 프로필만 수정 가능" on profiles;
create policy "본인 프로필만 수정 가능"
  on profiles for update
  using (auth.uid() = id);

-- 회원가입(auth.users에 새 행 추가)이 일어나면 자동으로 profiles에도
-- 같은 id로 행을 만들어주는 트리거. 회원가입 시 입력한 닉네임을
-- raw_user_meta_data에서 꺼내 쓰고, 없으면 이메일 앞부분을 기본값으로 쓴다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
