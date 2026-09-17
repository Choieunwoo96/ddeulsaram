import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LoginForm from '@/components/LoginForm';

// 로그인 여부는 매 요청마다 쿠키로 확인해야 하므로 정적 캐시하면 안 된다.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '로그인',
  description: '뜰사람에 로그인하고 방을 만들거나 매칭에 참여해보세요.',
};

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  // 이미 로그인된 상태면 로그인 페이지에 머물 이유가 없다.
  if (user) {
    redirect('/');
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-xl font-bold text-center">로그인</h1>

      {!supabase && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          로그인 기능이 아직 설정되지 않았어요. 관리자가 SUPABASE_ANON_KEY 환경변수를
          추가하면 이용할 수 있어요.
        </p>
      )}

      <LoginForm />
    </div>
  );
}
