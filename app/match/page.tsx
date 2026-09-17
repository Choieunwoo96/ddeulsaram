import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { listQueue, listMatchesForNickname } from '@/lib/store';
import MatchForm from '@/components/MatchForm';
import QueueEntryMenu from '@/components/QueueEntryMenu';

// 쿠키(cookies())로 "내가 등록한 대기열"인지 매 요청마다 새로 확인해야 하므로,
// 이 페이지는 빌드 시점에 정적으로 캐시되면 안 된다.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '자동매칭 대기열',
  description:
    '조건을 등록해두면 같은 종목·지역·진행방식의 상대가 나타났을 때 자동으로 매칭돼요.',
};

export default async function MatchPage({
  searchParams,
}: {
  searchParams: { nickname?: string };
}) {
  const queue = await listQueue();
  const myMatches = searchParams.nickname
    ? await listMatchesForNickname(searchParams.nickname)
    : [];

  // 방 목록과 같은 방식: 쿠키 존재 여부로 가볍게 "내 등록"인지만 판단하고,
  // 실제 삭제는 서버 액션에서 DB 값과 정확히 대조한다.
  const ownedEntryIds = new Set(
    cookies()
      .getAll()
      .filter((c) => c.name.startsWith('entry_'))
      .map((c) => c.name.slice('entry_'.length))
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-1">자동매칭 대기열</h1>
        <p className="text-sm text-slate-500">
          조건을 등록하면 같은 종목·지역·진행방식의 상대가 있을 때 자동으로 매칭돼요.
        </p>
      </div>

      <MatchForm />

      <div>
        <h2 className="font-semibold text-sm text-slate-500 mb-2">현재 대기열 ({queue.length}명)</h2>
        <div className="space-y-2">
          {queue.length === 0 && <p className="text-sm text-slate-400">대기중인 사람이 없어요.</p>}
          {queue.map((q) => (
            <div key={q.id} className="bg-white border rounded-lg p-3 text-sm flex justify-between items-center gap-2">
              <span>
                {q.nickname} · {q.major} / {q.minor} · {q.mode === 'online' ? '온라인' : '오프라인'}
              </span>
              <span className="flex items-center gap-2 text-slate-400">
                <span>
                  {q.region} {q.timeslot && `· ${q.timeslot}`}
                </span>
                {ownedEntryIds.has(q.id) && <QueueEntryMenu entryId={q.id} />}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-sm text-slate-500 mb-2">내 매칭 결과 확인</h2>
        <form className="flex gap-2 mb-3">
          <input
            name="nickname"
            defaultValue={searchParams.nickname}
            placeholder="닉네임 입력"
            className="input"
          />
          <button className="bg-slate-800 text-white rounded-lg px-4 text-sm">조회</button>
        </form>
        {searchParams.nickname && myMatches.length === 0 && (
          <p className="text-sm text-slate-400">아직 매칭된 상대가 없어요.</p>
        )}
        {myMatches.map((m) => (
          <div
            key={m.id}
            className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-2"
          >
            {m.a.nickname} ↔ {m.b.nickname} 매칭 완료! ({m.a.major} / {m.a.minor})
          </div>
        ))}
      </div>
    </div>
  );
}
