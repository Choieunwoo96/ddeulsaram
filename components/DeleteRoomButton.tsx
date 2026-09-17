'use client';

import { deleteRoomAction } from '@/lib/actions';

// 방장 본인에게만 보이는 방 삭제 버튼. 실수로 누르는 걸 막기 위해 confirm으로 한 번 더 확인한다.
export default function DeleteRoomButton({ roomId }: { roomId: string }) {
  return (
    <form action={deleteRoomAction.bind(null, roomId)}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('이 방을 삭제할까요? 신청 내역도 함께 삭제되고 되돌릴 수 없어요.')) {
            e.preventDefault();
          }
        }}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap"
      >
        방 삭제
      </button>
    </form>
  );
}
