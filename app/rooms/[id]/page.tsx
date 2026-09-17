import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getRoom, verifyRoomHostToken } from '@/lib/store';
import { applyAction, updateApplicationStatusAction } from '@/lib/actions';
import { Application, Room } from '@/lib/types';
import DeleteRoomButton from '@/components/DeleteRoomButton';

// 쿠키(cookies())로 방장 여부를 매 요청마다 새로 확인해야 하므로, 이 페이지는
// 절대 빌드 시점에 정적으로 캐시되면 안 된다.
export const dynamic = 'force-dynamic';

// 방 상세 페이지는 실제 검색 유입이 들어올 수 있는 핵심 페이지라, 방 제목/내용으로
// 검색엔진에 노출되는 제목·설명을 방마다 다르게 만들어준다.
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const room = await getRoom(params.id);
  if (!room) return {};

  const title = `${room.title} - ${room.major}/${room.minor} 상대 모집`;
  const description =
    room.description?.trim().slice(0, 150) ||
    `${room.major} · ${room.minor} · ${room.mode === 'online' ? '온라인' : '오프라인'} 배틀 상대를 구하는 방입니다.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

const STATUS_LABEL: Record<Room['status'], string> = {
  open: '모집중',
  closed: '마감',
  done: '완료',
};

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  const room = await getRoom(params.id);
  if (!room) notFound();

  const hostToken = cookies().get(`host_${room.id}`)?.value;
  const isHost = await verifyRoomHostToken(room.id, hostToken);

  const applyWithId = applyAction.bind(null, room.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span className="px-2 py-0.5 rounded bg-slate-100">{room.major}</span>
          <span>{room.minor}</span>
          <span>· {room.mode === 'online' ? '온라인' : '오프라인'}</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{room.title}</h1>
          {isHost && <DeleteRoomButton roomId={room.id} />}
        </div>
        <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{room.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm bg-white border rounded-lg p-4">
        <div>
          <span className="text-slate-400">장소/서버</span>
          <div>{room.location}</div>
        </div>
        <div>
          <span className="text-slate-400">일시</span>
          <div>{room.datetime}</div>
        </div>
        <div>
          <span className="text-slate-400">모집 인원</span>
          <div>{room.capacity}명</div>
        </div>
        <div>
          <span className="text-slate-400">상대 조건</span>
          <div>{room.condition || '무관'}</div>
        </div>
        <div>
          <span className="text-slate-400">방장</span>
          <div>{room.hostNickname}</div>
        </div>
        <div>
          <span className="text-slate-400">상태</span>
          <div>{STATUS_LABEL[room.status]}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-sm">참가 신청</h2>
        <form action={applyWithId} className="flex flex-col gap-2 sm:flex-row">
          <input name="nickname" required placeholder="닉네임" className="input sm:w-32" />
          <input
            name="spec"
            required
            placeholder="실력/지역/나이대 등 간단히"
            className="input flex-1"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 whitespace-nowrap"
          >
            신청하기
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-slate-500">신청자 ({room.applications.length})</h2>
        {room.applications.length === 0 && (
          <p className="text-sm text-slate-400">아직 신청자가 없어요.</p>
        )}
        {room.applications.map((application) => (
          <ApplicationRow
            key={application.id}
            roomId={room.id}
            application={application}
            isHost={isHost}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationRow({
  roomId,
  application,
  isHost,
}: {
  roomId: string;
  application: Application;
  isHost: boolean;
}) {
  return (
    <div className="bg-white border rounded-lg p-3 flex items-center justify-between text-sm">
      <div>
        <span className="font-medium">{application.nickname}</span>
        <span className="text-slate-400 ml-2">{application.spec}</span>
      </div>
      <StatusBadge roomId={roomId} application={application} isHost={isHost} />
    </div>
  );
}

function StatusBadge({
  roomId,
  application,
  isHost,
}: {
  roomId: string;
  application: Application;
  isHost: boolean;
}) {
  if (application.status === 'pending') {
    if (!isHost) {
      return <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500">대기중</span>;
    }
    const accept = updateApplicationStatusAction.bind(null, roomId, application.id, 'accepted');
    const reject = updateApplicationStatusAction.bind(null, roomId, application.id, 'rejected');
    return (
      <div className="flex gap-1">
        <form action={accept}>
          <button className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">수락</button>
        </form>
        <form action={reject}>
          <button className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">거절</button>
        </form>
      </div>
    );
  }

  const label = application.status === 'accepted' ? '수락됨' : '거절됨';
  const cls =
    application.status === 'accepted'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{label}</span>;
}
