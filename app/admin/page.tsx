import { listRooms, listQueue } from '@/lib/store';
import { isAdminAuthenticated } from '@/lib/admin';
import {
  adminLoginAction,
  adminLogoutAction,
  adminDeleteRoomAction,
  adminDeleteQueueEntryAction,
} from '@/lib/actions';
import AdminDeleteButton from '@/components/AdminDeleteButton';

// 로그인 상태를 쿠키로 매 요청마다 확인해야 하므로 정적 캐시되면 안 된다.
export const dynamic = 'force-dynamic';

const LOGIN_ERROR_MESSAGE: Record<string, string> = {
  wrong_password: '비밀번호가 올바르지 않아요. 다시 입력해주세요.',
  no_password_env:
    'ADMIN_PASSWORD 환경변수가 설정되어 있지 않아요. Vercel(또는 .env.local)에 먼저 추가해주세요.',
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const authed = isAdminAuthenticated();

  if (!authed) {
    const errorMessage = searchParams.error ? LOGIN_ERROR_MESSAGE[searchParams.error] : undefined;

    return (
      <div className="max-w-sm mx-auto mt-12 space-y-4">
        <div>
          <h1 className="text-xl font-bold mb-1">관리자 로그인</h1>
          <p className="text-sm text-slate-500">
            비밀번호를 아는 사람만 모든 방·매칭 대기열을 정리할 수 있어요.
          </p>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errorMessage}
          </p>
        )}
        <form action={adminLoginAction} className="space-y-3">
          <input
            type="password"
            name="password"
            required
            placeholder="관리자 비밀번호"
            className="input"
          />
          <button
            type="submit"
            className="w-full bg-slate-800 text-white rounded-lg py-2.5 font-semibold hover:bg-slate-900"
          >
            로그인
          </button>
        </form>
      </div>
    );
  }

  const [rooms, queue] = await Promise.all([listRooms(), listQueue()]);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">관리자 페이지</h1>
          <p className="text-sm text-slate-500">
            방장/등록자 구분 없이 모든 방과 매칭 대기열을 여기서 지울 수 있어요.
          </p>
        </div>
        <form action={adminLogoutAction}>
          <button className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap">
            로그아웃
          </button>
        </form>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm text-slate-500">방 목록 ({rooms.length})</h2>
        {rooms.length === 0 && (
          <p className="text-sm text-slate-400">방이 없어요.</p>
        )}
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white border rounded-lg p-3 flex items-center justify-between gap-2 text-sm"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{room.title}</div>
              <div className="text-slate-400 text-xs">
                {room.major} / {room.minor} · {room.status} · 방장 {room.hostNickname}
              </div>
            </div>
            <AdminDeleteButton
              action={adminDeleteRoomAction.bind(null, room.id)}
              confirmText={`"${room.title}" 방을 삭제할까요? 되돌릴 수 없어요.`}
            />
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm text-slate-500">매칭 대기열 ({queue.length})</h2>
        {queue.length === 0 && (
          <p className="text-sm text-slate-400">대기중인 항목이 없어요.</p>
        )}
        {queue.map((q) => (
          <div
            key={q.id}
            className="bg-white border rounded-lg p-3 flex items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 truncate">
              {q.nickname} · {q.major} / {q.minor} · {q.mode === 'online' ? '온라인' : '오프라인'}
            </span>
            <AdminDeleteButton
              action={adminDeleteQueueEntryAction.bind(null, q.id)}
              confirmText={`${q.nickname}님의 등록을 삭제할까요?`}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
