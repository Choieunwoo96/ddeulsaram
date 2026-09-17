import Link from 'next/link';
import { Room } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import RoomCardMenu from './RoomCardMenu';

const STATUS_LABEL: Record<Room['status'], string> = {
  open: '모집중',
  closed: '마감',
  done: '완료',
};

export default function RoomCard({ room, isOwner = false }: { room: Room; isOwner?: boolean }) {
  const icon = CATEGORIES.find((c) => c.major === room.major)?.icon ?? '⚔️';

  return (
    <div className="relative">
      <Link
        href={`/rooms/${room.id}`}
        className="block border rounded-lg bg-white p-4 hover:border-indigo-300 transition"
      >
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span className="px-2 py-0.5 rounded bg-slate-100">
            {icon} {room.major}
          </span>
          <span>{room.minor}</span>
          <span>· {room.mode === 'online' ? '온라인' : '오프라인'}</span>
        </div>
        <h3 className="font-semibold mb-1 pr-6">{room.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-2">{room.description}</p>
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            {room.location} · {room.datetime}
          </span>
          <span>{STATUS_LABEL[room.status]}</span>
        </div>
      </Link>
      {isOwner && <RoomCardMenu roomId={room.id} />}
    </div>
  );
}
