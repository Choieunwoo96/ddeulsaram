import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignupForm from '@/components/SignupForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '회원가입',
  description: '뜰사람 회원가입 — 닉네임과 이메일만으로 간단하게 시작해요.',
};

export default async function SignupPage() {
  const supabase = createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (user) {
    redirect('/');
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-xl font-bold text-center">회원가입</h1>

      {!supabase && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          회원가입 기능이 아직 설정되지 않았어요. 관리자가 SUPABASE_ANON_KEY 환경변수를
          추가하면 이용할 수 있어요.
        </p>
      )}

      <SignupForm />
    </div>
  );
}
