import type { Metadata } from 'next';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: '이용약관',
  description: `${SITE_NAME} 이용약관`,
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-slate-700">
      <div>
        <h1 className="text-xl font-bold mb-1">이용약관</h1>
        <p className="text-slate-400 text-xs">시행일: 2026년 9월 17일</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">1. 서비스 소개</h2>
        <p>
          {SITE_NAME}(이하 "서비스")은 온라인 게임, 캐주얼/플래시 게임,
          오프라인 액티비티, 오락실/아케이드 등에서 함께할 배틀 상대를 찾는
          매칭 플랫폼입니다. 서비스는 상대를 찾도록 연결해주는 역할만 하며,
          실제 게임/대전/활동은 서비스 밖에서 이용자 간에 진행됩니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">2. 이용자의 의무</h2>
        <p>다음과 같은 게시물/행위는 금지됩니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>금전이 걸린 내기, 도박성 대결을 모집하거나 암시하는 게시물</li>
          <li>타인을 사칭하거나 허위 정보를 게시하는 행위</li>
          <li>욕설, 비하, 혐오 표현 등 타인에게 불쾌감을 주는 게시물</li>
          <li>불법적인 목적의 모임/거래를 위한 게시물</li>
          <li>서비스의 정상적인 운영을 방해하는 행위(스팸, 반복 게시 등)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">3. 오프라인 만남 주의사항</h2>
        <p>
          오프라인 활동(경도, 픽업매치, 오락실 대결 등)을 위해 낯선 사람과 만날
          때는 반드시 공공장소에서 만나고, 개인정보(집 주소, 연락처 등)를
          섣불리 공유하지 않는 것을 권장합니다. 서비스는 오프라인 만남에서
          발생하는 사고나 분쟁에 대해 책임지지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">4. 게시물 관리</h2>
        <p>
          이용자는 본인이 만든 방이나 등록한 매칭 대기열을 언제든 삭제할 수
          있습니다. 서비스 운영자는 이 약관을 위반하는 게시물을 통보 없이
          삭제할 수 있습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">5. 면책 조항</h2>
        <p>
          서비스는 이용자 간 매칭을 연결해주는 역할만 하며, 매칭된 상대의
          신원, 실력, 약속 이행 여부 등을 보증하지 않습니다. 이용자 간에
          발생하는 문제는 당사자 간에 해결해야 하며, 서비스는 이에 대한
          책임을 지지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">6. 약관의 변경</h2>
        <p>
          이 약관은 서비스 운영 상황에 따라 변경될 수 있으며, 변경 시 이
          페이지를 통해 공지합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">7. 문의</h2>
        <p>
          이용약관에 대해 궁금한 점이 있으면{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
            {CONTACT_EMAIL}
          </a>
          로 연락해주세요.
        </p>
      </section>
    </div>
  );
}
