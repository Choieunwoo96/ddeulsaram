import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 이 클라이언트는 "로그인한 사용자 본인" 권한으로 동작한다 (RLS 적용).
// 기존 lib/supabaseClient.ts(service_role 키)는 서버가 모든 데이터에 접근할 때 쓰고,
// 이 클라이언트는 회원가입/로그인/로그아웃 등 Supabase Auth 기능 전용이다.
//
// 중요: SUPABASE_ANON_KEY가 아직 설정되지 않았을 수 있다. 이 함수는 루트 레이아웃 등
// 모든 페이지에서 호출되므로, 값이 없다고 에러를 던지면 사이트 전체가 망가진다.
// 그래서 값이 없으면 에러 대신 null을 반환하고, 호출하는 쪽에서 "로그인 기능 꺼짐"으로
// 처리하도록 설계했다.
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 렌더링 중에는 쿠키를 못 바꾸는 게 정상.
          // (실제 세션 쿠키 갱신은 middleware.ts와 Server Action/Route Handler가 담당한다.)
        }
      },
    },
  });
}
