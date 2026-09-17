import { NextRequest, NextResponse } from 'next/server';
import { verifyRoomHostToken } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * 방을 만든 직후 이 라우트를 거쳐서 방 상세 페이지로 이동한다.
 * 서버 액션 안에서 cookies().set() 직후 redirect()를 하면 일부 환경에서
 * Set-Cookie가 누락되는 경우가 있어서, 진짜 HTTP 리다이렉트(NextResponse.redirect)로
 * 쿠키를 확실하게 심어주는 별도 라우트를 둔 것이다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.nextUrl.searchParams.get('token');
  const roomId = params.id;
  const redirectUrl = new URL(`/rooms/${roomId}`, request.url);

  if (token) {
    const isValid = await verifyRoomHostToken(roomId, token);
    if (isValid) {
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(`host_${roomId}`, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }
  }

  return NextResponse.redirect(redirectUrl);
}
