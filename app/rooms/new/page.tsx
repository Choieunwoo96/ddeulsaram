'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { createRoomAction } from '@/lib/actions';
import Field from '@/components/Field';

export default function NewRoomPage() {
  const [major, setMajor] = useState(CATEGORIES[0].major);
  const minors = CATEGORIES.find((c) => c.major === major)?.minors ?? [];

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">방 만들기</h1>
      <p className="text-sm text-slate-500 mb-4">
        같이 배틀할 상대를 구하는 방을 올려보세요. 게임/대전은 사이트 밖에서 진행돼요.
      </p>

      <form action={createRoomAction} className="space-y-4">
        <Field label="제목">
          <input
            name="title"
            required
            className="input"
            placeholder="예) 롤 듀오 랭크 같이 올리실 분"
          />
        </Field>

        <Field label="대분류">
          <select
            name="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c.major} value={c.major}>
                {c.major}
              </option>
            ))}
          </select>
        </Field>

        <Field label="소분류">
          <select name="minor" className="input">
            {minors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="진행 방식">
          <select name="mode" className="input">
            <option value="online">온라인</option>
            <option value="offline">오프라인</option>
          </select>
        </Field>

        <Field label="장소 / 서버·플랫폼">
          <input
            name="location"
            required
            className="input"
            placeholder="예) KR 서버 / 강남역 오락실"
          />
        </Field>

        <Field label="일시">
          <input
            name="datetime"
            required
            className="input"
            placeholder="예) 이번 주 토요일 오후 3시"
          />
        </Field>

        <Field label="모집 인원">
          <input type="number" name="capacity" min={1} defaultValue={1} required className="input" />
        </Field>

        <Field label="상대 조건">
          <input
            name="condition"
            className="input"
            placeholder="예) 골드~플래티넘, 실력무관 등"
          />
        </Field>

        <Field label="설명">
          <textarea name="description" rows={4} className="input" placeholder="자유롭게 설명해주세요" />
        </Field>

        <Field label="닉네임 (방장)">
          <input name="hostNickname" required className="input" />
        </Field>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold hover:bg-indigo-700"
        >
          방 만들기
        </button>
      </form>
    </div>
  );
}
