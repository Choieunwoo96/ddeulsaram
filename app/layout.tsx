import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/auth-actions';
import { listNotifications, countUnreadNotifications } from '@/lib/store';
import NotificationBell from '@/components/NotificationBell';
import ChatWidget from '@/components/ChatWidget';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 온오프라인 배틀 매칭`,
    // 하위 페이지에서 title만 짧게 넘기면 "짧은제목 | 뜰사람" 형태로 자동 완성된다.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - 온오프라인 배틀 매칭`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} - 온오프라인 배틀 매칭`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  // 구글 서치 콘솔 / 네이버 서치어드바이저에서 "HTML 태그" 방식으로 소유 확인하면
  // 발급되는 코드를 각각 NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION /
  // NEXT_PUBLIC_NAVER_SITE_VERIFICATION 환경변수로 등록하세요.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { 'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION }
      : undefined,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // 로그인 기능이 아직 설정 안 됐으면(SUPABASE_ANON_KEY 없음) supabase가 null이고,
  // 그럴 땐 항상 "로그아웃 상태"로 취급해서 로그인/회원가입 링크만 보여준다.
  const supabase = createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const nickname = (user?.user_metadata?.nickname as string | undefined) || user?.email;

  // 알림 조회는 부가 기능이라, 여기서 에러가 나도 헤더/페이지 전체가 죽지 않게 방어한다.
  let notifications: Awaited<ReturnType<typeof listNotifications>> = [];
  let unreadCount = 0;
  if (user) {
    try {
      [notifications, unreadCount] = await Promise.all([
        listNotifications(user.id, 10),
        countUnreadNotifications(user.id),
      ]);
    } catch {
      // 알림 테이블이 아직 없거나(마이그레이션 전) DB 오류가 나도 무시한다.
    }
  }

  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center">
                <Image src="/logo.png" alt="뜰사람" width={160} height={107} className="h-9 w-auto" priority />
              </Link>
              {/* 로그인/회원가입(또는 닉네임)은 화면이 좁을 땐 로고 옆에 붙여서 항상 보이게 한다. */}
              <div className="sm:hidden">
                {user ? (
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
                    <span className="text-slate-400">{nickname}님</span>
                    <form action={signOutAction}>
                      <button type="submit" className="hover:text-indigo-600">
                        로그아웃
                      </button>
                    </form>
                  </span>
                ) : (
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <Link href="/login" className="text-slate-600 hover:text-indigo-600">
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700"
                    >
                      회원가입
                    </Link>
                  </span>
                )}
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-indigo-600">
                방 목록
              </Link>
              <Link href="/rooms/new" className="hover:text-indigo-600">
                방 만들기
              </Link>
              <Link href="/match" className="hover:text-indigo-600">
                자동매칭
              </Link>
              {/* 화면이 넓을 땐(sm 이상) 로그인/회원가입(또는 닉네임)을 나머지 메뉴들과 같은 줄에 보여준다. */}
              <div className="hidden sm:block">
                {user ? (
                  <span className="flex items-center gap-3">
                    <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />
                    <span className="text-slate-400">{nickname}님</span>
                    <form action={signOutAction}>
                      <button type="submit" className="hover:text-indigo-600">
                        로그아웃
                      </button>
                    </form>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Link href="/login" className="hover:text-indigo-600">
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700"
                    >
                      회원가입
                    </Link>
                  </span>
                )}
              </div>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        {/*
          Google AdSense 연동 위치 (실제 배포 시):
          1) AdSense 승인 후 발급받은 publisher ID로 아래 스크립트를 <head>에 추가
             <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous" />
          2) components/AdSlot.tsx의 placeholder를 실제 <ins class="adsbygoogle"> 태그로 교체
        */}

        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-400 space-y-2">
          <p>
            뜰사람은 배틀 상대를 구하는 매칭 서비스입니다. 금전이 걸린 내기·도박
            성격의 게시물은 금지됩니다.
          </p>
          <nav className="flex gap-3">
            <Link href="/privacy" className="hover:text-slate-600 underline">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="hover:text-slate-600 underline">
              이용약관
            </Link>
          </nav>
        </footer>

        <ChatWidget userId={user?.id} nickname={nickname} />
      </body>
    </html>
  );
}
