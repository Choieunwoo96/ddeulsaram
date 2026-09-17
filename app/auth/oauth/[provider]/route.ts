import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SITE_URL } from '@/lib/site';

// 구글/카카오 로그인 시작 라우트. /auth/oauth/google, /auth/oauth/kakao 로
// 링크만 걸면 되고, 여기서 Supabase가 만들어주는 실제 로그인 화면(구글/카카오)
// 주소로 리다이렉트한다.
//
// 왜 서버 액션이 아니라 Route Handler인가?
// signInWithOAuth()는 PKCE 방식으로 동작하는데, 이때 "code_verifier"라는 값을
// 쿠키에 저장해뒀다가 나중에 /auth/callback에서 다시 읽어야 한다. 이 프로젝트에서는
// "쿠키를 설정하면서 동시에 redirect"가 필요한 경우, 서버 액션의 redirect() 대신
// 진짜 Route Handler에서 NextResponse로 직접 처리하는 게 검증된 방식이다
// (기존 /api/rooms/[id]/claim, /auth/callback 과 동일한 패턴).
export const dynamic = 'force-dynamic';

const ALLOWED_PROVIDERS = ['google', 'kakao'] as const;
type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number];

function isAllowedProvider(value: string): value is AllowedProvider {
  return (ALLOWED_PROVIDERS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider;

  if (!isAllowedProvider(provider)) {
    return NextResponse.redirect(new URL('/login?error=oauth', request.url));
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/login?error=not_configured', request.url));
  }

  // 목적지는 아래에서 실제 OAuth URL을 받은 뒤 Location 헤더만 바꿔치기한다.
  // (쿠키를 먼저 이 응답 객체에 심어두고, 같은 응답을 그대로 재사용하기 위해서다.)
  const response = NextResponse.redirect(new URL('/login', request.url));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${SITE_URL}/auth/callback`,
      // 서버(Route Handler)에는 브라우저가 없으므로, Supabase가 자동으로
      // 리다이렉트하지 않고 URL만 돌려주게 한다. 그 URL로는 우리가 직접 보낸다.
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(new URL('/login?error=oauth', request.url));
  }

  response.headers.set('Location', data.url);
  return response;
}
