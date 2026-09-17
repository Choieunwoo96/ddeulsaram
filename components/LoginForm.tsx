'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInAction, type AuthActionState } from '@/lib/auth-actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? '로그인 중...' : '로그인'}
    </button>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [state, formAction] = useFormState<AuthActionState, FormData>(signInAction, null);

  useEffect(() => {
    if (state?.success === 'loggedIn') {
      router.push('/');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="bg-white border rounded-lg p-6 space-y-3">
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
        placeholder="비밀번호"
        autoComplete="current-password"
        className="input"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton />

      <p className="text-sm text-slate-500 text-center">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
