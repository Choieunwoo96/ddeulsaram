import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { listRooms } from '@/lib/store';
import AdSlot from '@/components/AdSlot';
import RoomCard from '@/components/RoomCard';
import Logo from '@/components/Logo';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { major?: string; minor?: string; mode?: string };
}) {
  const rooms = await listRooms({
    major: searchParams.major,
    minor: searchParams.minor,
    mode: searchParams.mode,
    status: 'open',
  });
  const selectedMajor = CATEGORIES.find((c) => c.major === searchParams.major);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white px-6 py-8 flex items-center gap-4">
        <Logo className="w-14 h-14 shrink-0" variant="light" />
        <div>
          <h1 className="text-2xl font-bold mb-1">배틀 상대를 구해보세요</h1>
          <p className="text-indigo-100 text-sm">
            온라인 게임부터 오락실, 오프라인 액티비티까지 — 방을 만들거나 참가해보세요.
          </p>
        </div>
      </section>

      <AdSlot />

      <section>
        <h2 className="text-sm font-semibold text-slate-500 mb-2">카테고리</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-full text-sm border ${
              !searchParams.major
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            전체
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.major}
              href={`/?major=${encodeURIComponent(c.major)}`}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                searchParams.major === c.major
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="mr-1">{c.icon}</span>
              {c.major}
            </Link>
          ))}
        </div>

        {selectedMajor && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedMajor.minors.map((m) => (
              <Link
                key={m}
                href={`/?major=${encodeURIComponent(selectedMajor.major)}&minor=${encodeURIComponent(
                  m
                )}`}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  searchParams.minor === m
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {m}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500">모집중인 방 ({rooms.length})</h2>
        {rooms.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center border rounded-lg bg-white">
            조건에 맞는 방이 없어요. 첫 번째 방을 만들어보세요!
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>
    </div>
  );
}
