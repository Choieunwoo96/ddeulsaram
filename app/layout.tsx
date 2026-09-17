import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
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
  // Google Search Console에서 소유권 확인을 받으면, 발급된 값을
  // NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION 환경변수로 등록하세요.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
              <Logo className="w-8 h-8" />
              뜰사람
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-indigo-600">
                방 목록
              </Link>
              <Link href="/rooms/new" className="hover:text-indigo-600">
                방 만들기
              </Link>
              <Link href="/match" className="hover:text-indigo-600">
                자동매칭
              </Link>
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
      </body>
    </html>
  );
}
