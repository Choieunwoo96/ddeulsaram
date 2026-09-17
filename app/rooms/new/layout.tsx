import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// rooms/new/page.tsx는 클라이언트 컴포넌트('use client')라 metadata를 직접
// export할 수 없어서, 같은 경로의 layout.tsx(서버 컴포넌트)에서 대신 설정한다.
export const metadata: Metadata = {
  title: '방 만들기',
  description: '같이 배틀할 상대를 구하는 방을 올려보세요.',
};

export default function NewRoomLayout({ children }: { children: ReactNode }) {
  return children;
}
