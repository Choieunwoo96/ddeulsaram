import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// 모든 요청마다 Supabase Auth 세션(로그인 상태)을 최신으로 갱신해주는 미들웨어.
// 이게 없으면 로그인 세션이 만료 시각 근처에서 갑자기 끊긴 것처럼 보일 수 있다.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  // 아직 SUPABASE_ANON_KEY를 설정하지 않았다면 로그인 기능 자체가 꺼져있는
  // 상태이므로, 미들웨어는 아무것도 하지 않고 그냥 통과시킨다.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 정적 파일(이미지, 파비콘 등)에는 미들웨어를 실행할 필요가 없다.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
