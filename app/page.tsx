import Link from 'next/link';
import { cookies } from 'next/headers';
import { CATEGORIES } from '@/lib/categories';
import { listRooms } from '@/lib/store';
import AdSlot from '@/components/AdSlot';
import RoomCard from '@/components/RoomCard';
import Logo from '@/components/Logo';

// 쿠키(cookies())로 "내가 만든 방"인지 매 요청마다 새로 확인해야 하므로,
// 이 페이지는 빌드 시점에 정적으로 캐시되면 안 된다.
export const dynamic = 'force-dynamic';

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

  // 정확한 방장 확인(DB 대조)은 방 상세 페이지에서 하고, 여기 목록에서는 "이 방의
  // 쿠키를 갖고 있는지"만 가볍게 확인해서 삭제 메뉴 노출 여부를 정한다 (방마다 DB를
  // 조회하지 않아도 되어 빠르다). 실제 삭제 실행 시에는 서버 액션이 다시 한번
  // DB 값과 정확히 대조한다.
  const ownedRoomIds = new Set(
    cookies()
      .getAll()
      .filter((c) => c.name.startsWith('host_'))
      .map((c) => c.name.slice('host_'.length))
  );

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
            <RoomCard key={room.id} room={room} isOwner={ownedRoomIds.has(room.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
