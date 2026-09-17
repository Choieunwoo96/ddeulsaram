'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpAction, type AuthActionState } from '@/lib/auth-actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? '가입 중...' : '회원가입'}
    </button>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const [state, formAction] = useFormState<AuthActionState, FormData>(signUpAction, null);

  useEffect(() => {
    if (state?.success === 'loggedIn') {
      router.push('/');
      router.refresh();
    }
  }, [state, router]);

  // 이메일 인증이 필요한 경우엔 이동하지 않고 안내 메시지만 계속 보여준다.
  if (state?.success === 'checkEmail') {
    return (
      <div className="bg-white border rounded-lg p-6 space-y-2 text-center">
        <p className="text-lg font-semibold text-slate-800">이메일을 확인해주세요 ✉️</p>
        <p className="text-sm text-slate-500">
          입력하신 이메일 주소로 인증 링크를 보냈어요. 메일함(스팸함도 확인해주세요)에서
          링크를 눌러야 로그인할 수 있어요.
        </p>
        <Link href="/login" className="inline-block mt-2 text-indigo-600 font-medium hover:underline">
          로그인 페이지로 이동
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-white border rounded-lg p-6 space-y-3">
      <input
        name="nickname"
        required
        maxLength={20}
        placeholder="닉네임"
        autoComplete="nickname"
        className="input"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="이메일"
        autoComplete="email"
        className="input"
      />
      <input
        name="password"
        type="password"
        required
        minLength={6}
        placeholder="비밀번호 (6자 이상)"
        autoComplete="new-password"
        className="input"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton />

      <p className="text-sm text-slate-500 text-center">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
