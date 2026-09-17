import { createClient } from '@supabase/supabase-js';

// 이 파일은 서버 전용 코드(서버 컴포넌트 / 서버 액션)에서만 import 된다.
// SUPABASE_SERVICE_ROLE_KEY는 NEXT_PUBLIC_ 접두사가 없으므로 브라우저 번들에
// 절대 포함되지 않는다. 클라이언트(브라우저)에서 직접 이 파일을 import하면 안 된다.

// Vercel/터미널에 값을 복사-붙여넣기 하다 보면 앞뒤에 공백이나 줄바꿈이
// 섞여 들어가는 경우가 흔하고, 그러면 "Invalid header value" 같은 알기 어려운
// 에러가 난다. trim()으로 그런 실수를 미리 방어한다.
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다. ' +
      '로컬에서는 .env.local 파일에, Vercel에서는 프로젝트 Environment Variables에 설정하세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
