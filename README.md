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
  layout.tsx              공통 레이아웃 (헤더/푸터/AdSense 안내)
components/
  RoomCard.tsx            방 목록 카드
  AdSlot.tsx               광고 영역 placeholder
  Field.tsx                 폼 라벨 wrapper
lib/
  types.ts                 타입 정의
  categories.ts            대/소분류 카테고리 데이터
  supabaseClient.ts        Supabase 서버 클라이언트 (service_role 키 사용)
  store.ts                  데이터 저장/조회 로직 (Supabase/PostgreSQL 기반)
  actions.ts                방 생성/신청/매칭 등 서버 액션
supabase/
  schema.sql                Supabase에 실행할 테이블 생성 SQL
.env.local.example          로컬 실행용 환경변수 템플릿
DEPLOY.md                    GitHub/Supabase/Vercel 배포 단계별 가이드
```

## 지금 상태 (MVP)

- 로그인/회원가입 없음 — 닉네임을 매번 입력하는 방식 (프로토타입 수준)
- 데이터는 Supabase(PostgreSQL)에 저장 — `supabase/schema.sql`로 테이블 생성
- 자동매칭은 "같은 대/소분류 + 같은 온/오프라인 + 같은 지역(서버)"이면 즉시 매칭되는
  단순 규칙 기반 (실력/티어/시간대 유사도는 아직 반영 안 함)
- Google AdSense는 실제 코드가 아니라 자리(placeholder)만 잡아둔 상태
- 배포: Vercel + GitHub 연동, `git push origin main`으로 자동 배포 (`DEPLOY.md` 참고)

## 실제 서비스로 더 키우기 전에 고려할 것

1. **회원가입/로그인 붙이기**
   Supabase Auth를 쓰면 비교적 빠르게 붙일 수 있습니다. 지금은 닉네임을
   그냥 텍스트로 입력받기 때문에 도용/사칭이 가능한 상태입니다.

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

- 로그인/회원가입 붙이기
- 신뢰 점수·리뷰·노쇼 신고 기능
- 실력 기반 자동매칭 고도화
- 실제 도메인 연결
