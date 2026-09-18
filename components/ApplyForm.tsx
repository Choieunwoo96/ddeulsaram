'use client';

import { useFormStatus } from 'react-dom';

// 렉/중복 클릭으로 같은 신청이 여러 번 제출되는 걸 막기 위해, 제출 중에는
// 버튼을 비활성화한다. (서버 쪽 쿠키 체크가 최종 방어선이고, 이건 그 전에
// 애초에 여러 번 눌리는 것 자체를 막아주는 역할)
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? '신청 중...' : '신청하기'}
    </button>
  );
}

export default function ApplyForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <input name="nickname" required placeholder="닉네임" className="input sm:w-32" />
      <input
        name="spec"
        required
        placeholder="실력/지역/나이대 등 간단히"
        className="input flex-1"
      />
      <SubmitButton />
    </form>
  );
}
