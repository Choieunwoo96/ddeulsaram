import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import './globals.css';

export const metadata = {
  title: '뜰사람 - 온오프라인 배틀 매칭',
  description:
    '온라인 게임부터 오락실, 오프라인 액티비티까지 — 배틀 상대를 구하는 매칭 플랫폼',
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

        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-400">
          뜰사람은 배틀 상대를 구하는 매칭 서비스입니다. 금전이 걸린 내기·도박
          성격의 게시물은 금지됩니다.
        </footer>
      </body>
    </html>
  );
}
