'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { markNotificationsReadAction } from '@/lib/actions';
import type { Notification } from '@/lib/types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      startTransition(async () => {
        await markNotificationsReadAction();
        router.refresh();
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="알림"
        className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-600"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a6 6 0 0 0-6 6v3.09c0 .53-.21 1.04-.59 1.41L4 15h16l-1.41-1.5a2 2 0 0 1-.59-1.41V9a6 6 0 0 0-6-6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 18a2.5 2.5 0 0 0 5 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-30 text-sm">
            <div className="px-3 py-2 border-b font-semibold text-slate-700">알림</div>
            {initialNotifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-slate-400 text-xs">알림이 없어요.</p>
            ) : (
              initialNotifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? '#'}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2.5 border-b last:border-b-0 hover:bg-slate-50 ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-slate-700">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
