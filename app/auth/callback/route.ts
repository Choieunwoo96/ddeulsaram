import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 이메일 인증 링크(그리고 나중에 추가할 구글/카카오 로그인)를 처리하는 라우트.
// "쿠키를 설정하면서 동시에 redirect"가 필요한 경우이므로, 서버 액션이 아니라
// 진짜 Route Handler에서 NextResponse.redirect() + response.cookies.set()으로
// 처리한다 (기존 /api/rooms/[id]/claim 과 동일한, 검증된 방식).
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const redirectTo = request.nextUrl.searchParams.get('redirect_to') || '/';

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (code && supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
