# 뜰사람 (DdeulSaram)

온라인 게임부터 오락실, 오프라인 액티비티까지 — 배틀 상대를 구하는 매칭 플랫폼 MVP입니다.
사이트 안에서 게임을 하는 것이 아니라, "방(포스팅)"을 만들어 상대를 모집하거나
조건을 등록해두면 자동으로 매칭해주는 것이 핵심 기능입니다.

## 실행 방법

실제 배포(GitHub → Supabase → Vercel)까지 처음부터 따라 하시려면
**`DEPLOY.md`** 를 순서대로 보세요. 계정이 하나도 없는 상태부터 안내되어 있습니다.

로컬에서만 실행하려면:

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드 후 실행

> **주의:** 이 앱은 이제 Supabase(PostgreSQL)를 사용합니다. Supabase 프로젝트를
> 만들고 `.env.local`에 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`를 채워 넣기
> 전까지는 `npm run dev`를 실행해도 에러가 납니다. `DEPLOY.md`의 2번, 4번
> 항목을 먼저 진행하세요. (`.env.local.example` 파일을 참고해서 만들면 됩니다.)
>
> 이 코드는 클라우드 샌드박스의 네트워크 정책상 `npm install`을 직접 실행해
> 검증하지 못했습니다 (`registry.npmjs.org` 접근이 403으로 차단됨). TypeScript
> 문법 검사는 통과했지만, 로컬/배포 환경에서 `npm install && npm run build`로
> 한 번 더 확인해보시길 권장합니다. 에러가 나면 메시지를 그대로 알려주세요.

## 폴더 구조

```
app/
  page.tsx              홈 - 카테고리 필터 + 방 목록
  rooms/new/page.tsx     방 만들기 폼
  rooms/[id]/page.tsx    방 상세 + 참가 신청 / 수락·거절
  match/page.tsx          자동매칭 대기열 등록 + 결과 확인
  admin/page.tsx           관리자 전용 방/대기열 삭제 페이지 (비밀번호 보호)
  login/page.tsx            로그인 페이지
  signup/page.tsx           회원가입 페이지
  auth/callback/route.ts    이메일 인증 링크(추후 구글/카카오 로그인도) 처리
  api/rooms/[id]/claim/    방 생성 직후 방장 쿠키를 확실하게 심어주는 라우트
  layout.tsx              공통 레이아웃 (헤더/푸터/AdSense 안내, 로그인 상태 표시)
components/
  RoomCard.tsx            방 목록 카드
  RoomCardMenu.tsx        방 카드의 점 3개(⋮) 삭제 메뉴 (방장에게만 표시)
  DeleteRoomButton.tsx    방 상세 페이지의 삭제 버튼 (방장에게만 표시)
  QueueEntryMenu.tsx      매칭 대기열 항목의 점 3개(⋮) 삭제 메뉴 (등록 본인에게만 표시)
  MatchForm.tsx            매칭 등록 폼 (대/소분류 드롭다운)
  LoginForm.tsx             로그인 폼 (클라이언트 컴포넌트)
  SignupForm.tsx            회원가입 폼 (클라이언트 컴포넌트)
  Logo.tsx                  인라인 SVG 로고
  AdSlot.tsx               광고 영역 placeholder
  Field.tsx                 폼 라벨 wrapper
lib/
  types.ts                 타입 정의
  categories.ts            대/소분류 카테고리 데이터
  supabaseClient.ts        Supabase 서버 클라이언트 (service_role 키 사용, 방/매칭 데이터용)
  supabase/server.ts        Supabase Auth 서버 클라이언트 (anon 키 + 쿠키 세션, 로그인용)
  store.ts                  데이터 저장/조회 로직 (Supabase/PostgreSQL 기반)
  actions.ts                방 생성/신청/매칭/관리자 등 서버 액션
  auth-actions.ts           회원가입/로그인/로그아웃 서버 액션
  admin.ts                  관리자 로그인 상태 확인 (ADMIN_PASSWORD 환경변수 사용)
middleware.ts                모든 요청마다 로그인 세션을 갱신해주는 미들웨어
supabase/
  schema.sql                Supabase에 실행할 테이블 생성 SQL (신규 프로젝트용, profiles 포함)
  migration_3_auth.sql      기존 프로젝트에 회원가입/로그인 기능을 추가하는 SQL
.env.local.example          로컬 실행용 환경변수 템플릿
DEPLOY.md                    GitHub/Supabase/Vercel 배포 단계별 가이드
```

## 지금 상태 (MVP)

- **회원가입/로그인 있음** (Supabase Auth 기반) — 이메일+비밀번호+닉네임으로 가입.
  `SUPABASE_ANON_KEY` 환경변수를 설정해야 켜지고, 안 켜놨으면 로그인/회원가입 버튼을
  눌러도 "아직 설정 안 됨" 안내만 뜨고 나머지 기능(방 만들기, 매칭 등)은 예전처럼
  닉네임 직접 입력 방식으로 정상 작동함. 방 만들기/매칭 신청 자체는 아직 로그인
  여부와 상관없이 닉네임을 입력하는 방식 그대로임 (로그인 연동은 다음 단계 예정).
- 데이터는 Supabase(PostgreSQL)에 저장 — `supabase/schema.sql`로 테이블 생성
- 자동매칭은 "같은 대/소분류 + 같은 온/오프라인 + 같은 지역(서버)"이면 즉시 매칭되는
  단순 규칙 기반 (실력/티어/시간대 유사도는 아직 반영 안 함). 소분류는 자유입력이
  아니라 드롭다운(`components/MatchForm.tsx`)이라 오타/공백 때문에 매칭이 안 걸리는
  문제를 방지했고, 저장되는 값들도 항상 trim되어 저장됨
- 방장이 수락(accepted)한 인원이 모집 인원(capacity)에 도달하면 방 상태가 자동으로
  `done`으로 바뀌고 홈 목록에서 사라짐 (`lib/store.ts`의 `autoCompleteRoomIfFull`)
- 신청 수락/거절, 방 삭제, 매칭 대기열 취소는 각각 그것을 만든 브라우저에서만 가능
  — 로그인이 없는 프로토타입이라 생성 시 발급한 비밀 토큰을 httpOnly 쿠키로
  저장해두고 서버 액션/라우트에서 확인함 (`lib/store.ts`의 `verifyRoomHostToken`,
  `verifyQueueEntryToken`; 방 생성 직후 쿠키는 `app/api/rooms/[id]/claim/route.ts`를
  거쳐서 심어짐 — 서버 액션 안에서 바로 심는 것보다 더 확실하게 동작함)
- 카테고리별 이모지 아이콘 + 인라인 SVG 로고/배너 적용 (별도 이미지 파일 업로드 없이 동작)
- `/admin` 페이지에서 비밀번호(`ADMIN_PASSWORD` 환경변수)로 로그인하면 방장/등록자
  구분 없이 모든 방·매칭 대기열을 삭제할 수 있음 (테스트 데이터 정리용)
- Google AdSense는 실제 코드가 아니라 자리(placeholder)만 잡아둔 상태
- 배포: Vercel + GitHub 연동, `git push origin main`으로 자동 배포 (`DEPLOY.md` 참고)

## 실제 서비스로 더 키우기 전에 고려할 것

1. **방 만들기/매칭 신청에 로그인 연동하기**
   지금은 로그인 기능만 따로 붙은 상태이고, 방 만들기/신청/매칭 폼은 여전히
   닉네임을 직접 입력받습니다. 로그인한 사용자는 닉네임 입력칸을 없애고
   자동으로 본인 닉네임을 쓰도록 연결하면 도용/사칭 문제를 줄일 수 있습니다.

2. **Google AdSense 실제 연동**
   `app/layout.tsx`와 `components/AdSlot.tsx`에 안내 주석을 남겨뒀습니다.
   AdSense 승인을 받은 뒤 publisher ID로 스크립트와 `<ins>` 태그를 넣으면 됩니다.
   승인 심사를 위해서는 실제 콘텐츠(방 목록)와 트래픽이 어느 정도 있어야
   유리합니다.

3. **오프라인 매칭 안전장치**
   노쇼/비매너 신고, 최소한의 신뢰 점수, 공공장소 만남 권장 문구 등을
   추가하는 것을 권장합니다. 아직 구현되어 있지 않습니다.

4. **실제 도메인 연결**
   지금은 무료 `*.vercel.app` 주소로 시작합니다. 나중에 실제 도메인을 사면
   `DEPLOY.md` 5번 항목대로 Vercel에 연결하면 됩니다.

## 다음에 요청하시면 좋을 것들

- 구글/카카오 소셜 로그인
- 마이페이지, 검색, 글쓰기·게시판, 댓글·좋아요, 알림, 실시간 채팅
- 신뢰 점수·리뷰·노쇼 신고 기능
- 실력 기반 자동매칭 고도화
- 실제 도메인 연결
