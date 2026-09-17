# 뜰사람 배포 가이드 (계정 하나도 없는 상태부터)

이 문서만 순서대로 따라 하면 실제로 인터넷에서 접속 가능한 사이트가 만들어집니다.
전체 흐름은: **① GitHub에 코드 올리기 → ② Supabase에 데이터베이스 만들기 →
③ Vercel로 배포하기** 입니다. 지금은 무료 주소(`ddeulsaram.vercel.app` 같은 형태)로
시작하고, 나중에 원하시면 실제 도메인을 연결할 수 있어요.

> 이전에 로컬(`npm run dev`)에서 보셨던 버전은 데이터를 파일에 저장하는
> 임시 방식이었어요. 이번에 진짜 데이터베이스(Supabase)를 쓰도록 코드를 바꿨기
> 때문에, **아래 2번(Supabase) 단계를 마치고 `.env.local`을 만들기 전까지는
> 로컬 실행이 에러가 납니다.** 정상입니다, 당황하지 마세요.

---

## 0. 준비물 확인

- Node.js (이미 설치하셨죠 - 지난번에 `npm run dev` 성공하신 그 컴퓨터 그대로 쓰시면 됩니다)
- Git — 없으면 https://git-scm.com/download/win 에서 설치 (그냥 계속 다음 눌러서 설치)
- 이메일 주소 하나 (GitHub / Supabase / Vercel 가입에 사용)

---

## 1. GitHub — 코드를 올려둘 저장소 만들기

1. https://github.com 접속 → 오른쪽 위 **Sign up** → 이메일/비밀번호/아이디 입력해서 가입
   (이메일 인증 코드가 오면 입력)
2. 로그인 후 오른쪽 위 **+** 버튼 → **New repository**
   - Repository name: `ddeulsaram`
   - Public/Private 아무거나 상관없음 (처음엔 Private 추천)
   - 나머지 옵션(README 추가 등)은 전부 체크 해제한 채로 **Create repository**
3. 저장소가 만들어지면 나오는 화면은 무시하고, 여러분 컴퓨터에서 터미널(cmd)을 열어
   `ddeulsaram` 폴더로 이동한 뒤 아래를 순서대로 입력하세요.

   ```
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/여러분아이디/ddeulsaram.git
   git push -u origin main
   ```

   - `여러분아이디` 부분만 실제 GitHub 아이디로 바꾸세요.
   - 중간에 GitHub 로그인 창이 뜨면 로그인하시면 됩니다.
   - 완료되면 GitHub 저장소 페이지를 새로고침했을 때 폴더/파일들이 보입니다.

---

## 2. Supabase — 진짜 데이터베이스 만들기

1. https://supabase.com 접속 → **Start your project** → GitHub 계정으로 로그인(가장 간편)
2. **New project**
   - Name: `ddeulsaram`
   - Database Password: 아무거나 강력한 비밀번호 설정 후 **꼭 메모장에 저장**해두세요
   - Region: 가능하면 `Northeast Asia (Seoul)` 선택 (없으면 가까운 지역 아무거나)
   - **Create new project** (1~2분 정도 기다림)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭 → **New query**
4. 이 프로젝트 폴더 안의 `supabase/schema.sql` 파일을 메모장으로 열어서 내용 전체를 복사 →
   SQL Editor에 붙여넣고 **Run** 버튼 클릭
   - "Success. No rows returned" 같은 메시지가 뜨면 성공입니다. (테이블 5개가 만들어졌어요 —
     회원가입/로그인용 `profiles` 테이블 포함)
5. Project URL과 키는 화면 위쪽 **Connect** 버튼(또는 **Project Settings → API**)을 누르면
   나오는 창에서 확인할 수 있습니다. (Supabase가 최근에 이 화면 위치를 바꿔서, 예전
   가이드와 메뉴 이름이 조금 다를 수 있습니다.)
   - **Project URL** 복사해서 메모장에 저장
   - **API keys** 중 **secret**(예전 이름: `service_role`) 키 — 복사 아이콘을 눌러 그대로
     복사해서 메모장에 저장 (Notepad에 붙였다가 다시 복사하면 줄바꿈이 섞여 들어갈 수
     있으니, 가능하면 복사 아이콘 → 바로 Vercel에 붙여넣기를 권장합니다)
   - **API keys** 중 **anon**(예전 이름: `anon`/`public`, 새 화면에서는 **publishable** 이라고
     나올 수도 있어요) 키도 똑같이 복사해서 메모장에 저장해두세요 — 회원가입/로그인
     기능에 필요합니다.
   - ⚠️ **secret**(`service_role`) 키는 절대 다른 사람에게 보여주거나 GitHub에 올리면
     안 됩니다. **anon**(`publishable`) 키는 원래 외부에 노출돼도 되는 종류의 키라
     상대적으로 안전하지만, 그래도 두 키를 헷갈리지 않게 주의하세요.
6. 회원가입 시 보내는 이메일 인증 링크가 정확한 주소로 오게 하려면: 왼쪽 메뉴 **Authentication**
   → **URL Configuration** 으로 이동해서
   - **Site URL**: 실제 배포 주소 (예: `https://ddeulsaram96.vercel.app`)
   - **Redirect URLs**: 같은 주소 뒤에 `/auth/callback`을 붙인 값
     (예: `https://ddeulsaram96.vercel.app/auth/callback`) 을 추가로 등록해주세요.
   - 나중에 실제 도메인을 연결하면 이 두 값도 새 도메인으로 바꿔줘야 합니다.

---

## 3. Vercel — 실제로 배포하기

1. https://vercel.com 접속 → **Sign Up** → GitHub 계정으로 로그인
2. **Add New...** → **Project**
3. 방금 만든 `ddeulsaram` 저장소를 찾아서 **Import**
4. **Environment Variables** 섹션에서 아래 항목들을 추가:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | (2단계에서 복사한 Project URL) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (2단계에서 복사한 service_role 키) |
   | `SUPABASE_ANON_KEY` | (2단계에서 복사한 anon/publishable 키 — 회원가입/로그인용) |

5. **Deploy** 클릭 → 1~2분 기다리면 완료
6. 완료되면 `https://ddeulsaram-xxxx.vercel.app` 같은 주소가 생깁니다. 클릭해서 접속해보세요.
7. 주소를 더 깔끔하게 바꾸고 싶으면: 프로젝트 화면 → **Settings** → **Domains** →
   `ddeulsaram.vercel.app` 처럼 원하는 이름 입력 (다른 사람이 선점하지 않았다면 바로 사용 가능)

여기까지 하면 실제로 인터넷 주소로 접속 가능한 사이트가 완성됩니다. 이후 코드를 수정해서
`git push`만 하면 Vercel이 자동으로 다시 배포해줘요 (CLAUDE.md에 적어둔 배포 규칙과 동일합니다).

---

## 4. 내 컴퓨터에서 계속 테스트하고 싶다면

프로젝트 폴더 최상단에 `.env.local` 파일을 새로 만들고 (메모장으로 만들어도 됨,
`.env.local.example` 파일을 복사해서 이름만 바꿔도 됩니다) 아래처럼 채워 넣으세요.

```
SUPABASE_URL=여러분의 Project URL
SUPABASE_SERVICE_ROLE_KEY=여러분의 service_role 키
SUPABASE_ANON_KEY=여러분의 anon(publishable) 키
```

그 다음:

```
npm install
npm run dev
```

`localhost:3000`으로 접속하면 이제는 Supabase(진짜 데이터베이스)에 저장되는 버전으로 동작합니다.

---

## 5. 나중에 실제 도메인(예: ddeulsaram.com)을 쓰고 싶다면

1. 가비아, 후이즈, Cloudflare 등에서 원하는 도메인 구매 (연 1~2만원 대)
2. Vercel 프로젝트 → **Settings** → **Domains** → 구매한 도메인 입력
3. Vercel이 알려주는 DNS 설정값을, 도메인을 구매한 사이트의 DNS 관리 화면에 그대로 입력
4. 보통 몇 분~몇 시간 내로 반영됩니다

---

## 막히면

각 단계마다 화면 캡처해서 보내주시면 바로 확인해드릴게요. 에러 메시지가 뜨면
전체 문구를 그대로 복사해서 보내주시는 게 가장 빠릅니다.
