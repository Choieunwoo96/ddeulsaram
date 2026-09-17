# 이번 업데이트 적용 방법 (회원가입 · 로그인 기능 추가)

## 이번에 바뀐 것

1. **회원가입 / 로그인 기능 추가** — 이메일 + 비밀번호 + 닉네임으로 가입할 수
   있어요. 헤더 오른쪽에 "로그인 / 회원가입" 버튼이 새로 생기고, 로그인하면
   "닉네임님" + "로그아웃" 버튼으로 바뀝니다.
2. 이번 업데이트에서는 **로그인 기능 자체만** 붙었어요. 방 만들기 / 매칭 신청
   폼은 아직 예전처럼 닉네임을 직접 입력하는 방식 그대로입니다 (다음 단계에서
   연결할 예정이에요).
3. **환경변수 1개 추가 필요** (`SUPABASE_ANON_KEY`) — 아래 순서대로 넣어주셔야
   로그인/회원가입이 실제로 동작해요. 안 넣어도 사이트가 깨지지는 않고,
   로그인/회원가입 버튼을 누르면 "아직 설정 안 됐어요"라는 안내만 뜨고 나머지
   기능(방 목록, 방 만들기, 매칭 등)은 지금처럼 그대로 작동합니다.
4. **SQL 실행 필요** — `profiles`라는 새 테이블을 하나 추가해야 해요 (닉네임
   저장용). 기존 테이블(rooms, applications, queue_entries, matches)에는 전혀
   영향이 없습니다.

## 적용 순서

### 1) Supabase에서 anon 키 확인하고 SQL 실행하기

1. https://supabase.com 로그인 → 이 프로젝트 선택
2. 왼쪽 메뉴 **SQL Editor** → **New query**
3. 이번에 받은 폴더 안의 `supabase/migration_3_auth.sql` 파일을 메모장으로 열어서
   내용 전체 복사 → SQL Editor에 붙여넣고 **Run** 클릭
   - "Success" 메시지가 뜨면 성공이에요.
4. 화면 위쪽 **Connect** 버튼 (또는 **Project Settings → API**) 클릭
   - **API keys** 목록에서 **anon**(또는 **publishable**) 이라고 써있는 키를
     복사해서 메모장에 저장해두세요. (이전에 쓰던 **secret**/`service_role` 키와는
     다른 키예요 — 헷갈리지 않게 주의!)
5. 왼쪽 메뉴 **Authentication** → **URL Configuration**
   - **Site URL**: 지금 쓰고 계신 사이트 주소 (예: `https://ddeulsaram96.vercel.app`)
   - **Redirect URLs**: 그 주소 뒤에 `/auth/callback`을 붙인 값을 추가
     (예: `https://ddeulsaram96.vercel.app/auth/callback`)
   - 이 설정이 안 되어 있으면, 회원가입 후 오는 인증 메일의 링크를 눌렀을 때
     엉뚱한 주소로 연결될 수 있어요.

### 2) Vercel에 환경변수 추가

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 아래 값을 추가:
   - Name: `SUPABASE_ANON_KEY`
   - Value: 위 1)-4에서 복사한 anon 키
   - Production / Preview / Development 다 체크 → **Save**

### 3) 코드 적용

1. 압축 해제한 새 `ddeulsaram` 폴더 안의 내용물을 전부 복사합니다.
2. 기존 `ddeulsaram` 폴더에 붙여넣고 **모두 덮어쓰기**. (`app/login`, `app/signup`,
   `app/auth`, `lib/supabase`, `middleware.ts` 처럼 새로 생긴 파일/폴더가 있으니
   "폴더 구조 그대로" 풀어주세요.)
3. 터미널에서:

   ```
   git add .
   git commit -m "회원가입/로그인 기능 추가"
   git push
   ```

4. Vercel 배포가 끝나면(1~2분) 사이트에서 **회원가입** 버튼을 눌러 테스트
   계정을 하나 만들어보세요. 가입 직후 이메일 인증이 필요하다는 안내가 뜨면,
   가입할 때 쓴 이메일함(스팸함도 확인)에서 인증 링크를 눌러야 로그인이 됩니다.
   (Supabase 기본 설정이 이메일 인증을 요구해서 그래요. 테스트만 빨리 해보고
   싶으시면 Supabase → Authentication → Providers → Email에서 "Confirm email"을
   꺼두셔도 됩니다. 실제 서비스에서는 켜두는 걸 권장해요.)

## 확인해볼 것

- 헤더에 "로그인 / 회원가입" 버튼이 보이는지
- 회원가입 → 이메일 인증 → 로그인이 되는지
- 로그인 후 헤더에 "닉네임님" + "로그아웃"이 보이는지
- 로그아웃하면 다시 "로그인 / 회원가입"으로 바뀌는지
- 로그인 안 한 상태에서도 방 목록 / 방 만들기 / 매칭 기능이 예전처럼 잘 되는지
