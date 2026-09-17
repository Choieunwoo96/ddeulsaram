'use client';

import { useEffect, useRef, useState } from 'react';
import { deleteQueueEntryAction } from '@/lib/actions';

// 매칭 대기열 항목 오른쪽의 "⋮" 메뉴. 본인이 등록한 항목에만 렌더링된다.
export default function QueueEntryMenu({ entryId }: { entryId: string }) {
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
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-lg leading-none"
        aria-label="대기열 관리 메뉴"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-24 bg-white border rounded-lg shadow-lg py-1 z-10">
          <form action={deleteQueueEntryAction.bind(null, entryId)}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm('대기열 등록을 취소할까요?')) {
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
