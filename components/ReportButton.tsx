'use client';

import { useState, useTransition } from 'react';
import { reportAction } from '@/lib/actions';

const REPORT_REASONS = ['도배/광고', '부적절한 내용', '노쇼/비매너', '사기 의심', '기타'];

export default function ReportButton({
  targetType,
  targetId,
  className = '',
}: {
  targetType: 'room' | 'chat_message';
  targetId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <span className={`text-xs text-slate-400 ${className}`}>신고 접수됐어요</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs text-slate-400 hover:text-rose-500 ${className}`}
      >
        🚩 신고
      </button>
    );
  }

  return (
    <div
      className={`text-xs bg-white border rounded-lg p-2.5 space-y-1.5 w-60 shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input !py-1 !text-xs"
      >
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="자세한 내용 (선택)"
        rows={2}
        className="input !text-xs"
      />
      <div className="flex gap-1.5 justify-end pt-0.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 px-2 hover:text-slate-600"
        >
          취소
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set('reason', reason);
            fd.set('detail', detail);
            startTransition(async () => {
              await reportAction(targetType, targetId, fd);
              setDone(true);
            });
          }}
          className="bg-rose-500 text-white px-2.5 py-1 rounded disabled:opacity-50"
        >
          신고하기
        </button>
      </div>
    </div>
  );
}
