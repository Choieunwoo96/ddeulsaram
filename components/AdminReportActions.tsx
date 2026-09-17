'use client';

import { adminResolveReportAction, adminBlockSenderAction } from '@/lib/actions';

// 관리자 대시보드의 신고 항목 하나에 붙는 "처리완료"/"채팅 차단" 버튼.
// 차단은 되돌리기 번거로우니(차단 목록에서 해제는 가능) 누르기 전에 한 번 더 확인한다.
export default function AdminReportActions({
  reportId,
  offenderUserId,
  offenderNickname,
}: {
  reportId: string;
  offenderUserId: string | null;
  offenderNickname: string | null;
}) {
  return (
    <div className="flex gap-1.5">
      <form action={adminResolveReportAction.bind(null, reportId)}>
        <button className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">
          처리완료
        </button>
      </form>
      {(offenderUserId || offenderNickname) && (
        <form
          action={adminBlockSenderAction.bind(null, reportId, offenderUserId, offenderNickname)}
        >
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm(`"${offenderNickname ?? '이 사용자'}"를 채팅에서 차단할까요?`)) {
                e.preventDefault();
              }
            }}
            className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
          >
            채팅 차단
          </button>
        </form>
      )}
    </div>
  );
}
