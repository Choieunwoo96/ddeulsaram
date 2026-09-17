import { cookies } from 'next/headers';

// 관리자 로그인 상태를 표시하는 쿠키 이름.
export const ADMIN_COOKIE_NAME = 'admin_session';

/**
 * 로그인 없는 프로토타입이라, "관리자 비밀번호"를 딱 하나 정해서 그걸 아는
 * 사람만 /admin 페이지에서 모든 방·매칭 대기열을 삭제할 수 있게 한다.
 * 비밀번호는 ADMIN_PASSWORD 환경변수로 설정한다 (Vercel / .env.local).
 */
export function isAdminAuthenticated(): boolean {
  const correctPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!correctPassword) return false;
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return !!token && token === correctPassword;
}
