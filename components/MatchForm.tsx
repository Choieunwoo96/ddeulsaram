'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { addQueueEntryAction } from '@/lib/actions';

// 매칭 등록 폼. 소분류를 자유 텍스트로 받으면 "철권"과 "철권 " 처럼 사소한 차이로
// 자동매칭이 걸리지 않는 문제가 있었다. 방 만들기 폼과 동일하게 대분류에 따라
// 소분류를 드롭다운으로 보여줘서, 같은 종목은 항상 같은 문자열로 저장되게 한다.
export default function MatchForm() {
  const [major, setMajor] = useState(CATEGORIES[0].major);
  const minors = CATEGORIES.find((c) => c.major === major)?.minors ?? [];

  return (
    <form action={addQueueEntryAction} className="bg-white border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input name="nickname" required placeholder="닉네임" className="input" />
        <select name="mode" className="input">
          <option value="online">온라인</option>
          <option value="offline">오프라인</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select
          name="major"
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          className="input"
        >
          {CATEGORIES.map((c) => (
            <option key={c.major} value={c.major}>
              {c.icon} {c.major}
            </option>
          ))}
        </select>
        <select name="minor" className="input">
          {minors.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="region" required placeholder="지역 또는 서버명" className="input" />
        <input name="timeslot" placeholder="가능 시간대 (예: 평일 저녁)" className="input" />
      </div>
      <input name="note" placeholder="추가 메모 (선택)" className="input" />
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold hover:bg-indigo-700"
      >
        매칭 대기열 등록
      </button>
    </form>
  );
}
