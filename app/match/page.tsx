import { listQueue, listMatchesForNickname } from '@/lib/store';
import MatchForm from '@/components/MatchForm';

export default async function MatchPage({
  searchParams,
}: {
  searchParams: { nickname?: string };
}) {
  const queue = await listQueue();
  const myMatches = searchParams.nickname
    ? await listMatchesForNickname(searchParams.nickname)
    : [];

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
            <div key={q.id} className="bg-white border rounded-lg p-3 text-sm flex justify-between">
              <span>
                {q.nickname} · {q.major} / {q.minor} · {q.mode === 'online' ? '온라인' : '오프라인'}
              </span>
              <span className="text-slate-400">
                {q.region} {q.timeslot && `· ${q.timeslot}`}
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
