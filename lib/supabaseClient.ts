import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 이 파일은 서버 전용 코드(서버 컴포넌트 / 서버 액션)에서만 import 된다.
// SUPABASE_SERVICE_ROLE_KEY는 NEXT_PUBLIC_ 접두사가 없으므로 브라우저 번들에
// 절대 포함되지 않는다. 클라이언트(브라우저)에서 직접 이 파일을 import하면 안 된다.

// Vercel/터미널에 값을 복사-붙여넣기 하다 보면 앞뒤에 공백이나 줄바꿈이
// 섞여 들어가는 경우가 흔하고, 그러면 "Invalid header value" 같은 알기 어려운
// 에러가 난다. trim()으로 그런 실수를 미리 방어한다.
function createSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다. ' +
        '로컬에서는 .env.local 파일에, Vercel에서는 프로젝트 Environment Variables에 설정하세요.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

// 모듈을 import하는 시점(빌드/페이지 로드 시점)에 바로 클라이언트를 만들면,
// 환경변수가 없을 때 이 파일을 참조하는 모든 페이지가 통째로 500 에러가 난다.
// 그래서 실제로 DB를 호출하는 시점(.from(...) 등을 처음 쓰는 순간)까지 생성을
// 미뤄서, 알림처럼 "없어도 나머지 화면은 정상 작동해야 하는" 기능에서
// try/catch로 감쌌을 때 그 catch가 실제로 동작하게 한다.
let cachedClient: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!cachedClient) {
      cachedClient = createSupabaseServiceClient();
    }
    return Reflect.get(cachedClient, prop, receiver);
  },
});
