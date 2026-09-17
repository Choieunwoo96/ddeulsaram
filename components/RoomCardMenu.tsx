'use client';

import { useEffect, useRef, useState } from 'react';
import { deleteRoomAction } from '@/lib/actions';

// 방 목록 카드 오른쪽 위의 "⋮" 메뉴. 이 방을 만든 브라우저(방장)에게만 렌더링된다.
// 카드 전체가 Link가 아니라 이 메뉴는 그 Link와 형제(sibling) 요소로 배치되어 있어서
// 메뉴를 눌러도 방 상세 페이지로 이동하지 않는다.
export default function RoomCardMenu({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="absolute top-2 right-2 z-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 hover:bg-slate-100 text-slate-500 text-lg leading-none"
        aria-label="방 관리 메뉴"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-24 bg-white border rounded-lg shadow-lg py-1">
          <form action={deleteRoomAction.bind(null, roomId)}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm('이 방을 삭제할까요? 되돌릴 수 없어요.')) {
                  e.preventDefault();
                }
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
