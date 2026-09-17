import type { Metadata } from 'next';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: `${SITE_NAME}의 개인정보처리방침 안내`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-slate-700">
      <div>
        <h1 className="text-xl font-bold mb-1">개인정보처리방침</h1>
        <p className="text-slate-400 text-xs">시행일: 2026년 9월 17일</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">1. 수집하는 정보</h2>
        <p>
          {SITE_NAME}은 별도의 회원가입 없이 이용할 수 있습니다. 방을 만들거나
          참가 신청, 자동매칭 등록을 할 때 이용자가 직접 입력하는 닉네임, 희망
          조건(실력/지역/시간대 등)만 수집하며, 실명·전화번호·이메일 등은
          수집하지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">2. 쿠키 사용</h2>
        <p>
          {SITE_NAME}은 로그인 기능이 없는 대신, 방을 만들거나 매칭을 등록한
          "이 브라우저"를 구분하기 위해 꼭 필요한 최소한의 쿠키(방장/등록자
          확인용)를 사용합니다. 이 쿠키에는 개인을 식별할 수 있는 정보가 담겨
          있지 않습니다.
        </p>
        <p>
          또한 {SITE_NAME}은 광고 게재를 위해 Google을 비롯한 광고 제공업체의
          쿠키를 사용할 수 있습니다. Google을 포함한 광고 제공업체는 이용자가
          {SITE_NAME} 또는 다른 웹사이트를 방문한 기록을 바탕으로 광고를
          게재하기 위해 쿠키를 사용합니다. 이용자는{' '}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-indigo-600 underline"
          >
            Google 광고 설정
          </a>
          에서 맞춤 광고를 비활성화할 수 있고,{' '}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-indigo-600 underline"
          >
            aboutads.info
          </a>
          에서 다른 광고 제공업체의 맞춤 광고 쿠키도 비활성화할 수 있습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">3. 정보의 이용 및 보관</h2>
        <p>
          수집한 정보는 방/매칭 게시물을 보여주는 서비스 제공 목적으로만
          사용됩니다. 방이나 매칭 등록을 삭제하면 관련 정보도 데이터베이스에서
          함께 삭제됩니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">4. 제3자 제공</h2>
        <p>
          {SITE_NAME}은 이용자의 정보를 광고 게재 목적 외에 제3자에게 판매하거나
          제공하지 않습니다. Google 등 광고 제공업체가 쿠키를 통해 수집하는
          정보는 각 업체의 자체 개인정보처리방침을 따릅니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-900">5. 문의</h2>
        <p>
          개인정보처리방침에 대해 궁금한 점이 있으면{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
            {CONTACT_EMAIL}
          </a>
          로 연락해주세요.
        </p>
      </section>
    </div>
  );
}
