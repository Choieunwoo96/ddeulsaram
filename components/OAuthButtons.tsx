// 구글/카카오 로그인 버튼. 누르면 /auth/oauth/[provider] 라우트로 이동하고,
// 거기서 Supabase가 만들어주는 실제 로그인 화면으로 리다이렉트된다.
export default function OAuthButtons() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex-1 border-t border-slate-200" />
        또는
        <span className="flex-1 border-t border-slate-200" />
      </div>

      <a
        href="/auth/oauth/google"
        className="flex items-center justify-center gap-2 w-full border border-slate-300 rounded-lg py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        구글로 로그인
      </a>

      <a
        href="/auth/oauth/kakao"
        className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium text-[#191919] bg-[#FEE500] hover:brightness-95"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#191919"
            d="M9 1.5C4.31 1.5.5 4.51.5 8.22c0 2.38 1.57 4.47 3.94 5.66-.17.63-.63 2.34-.72 2.7-.11.45.17.44.35.32.15-.1 2.3-1.56 3.24-2.2.55.08 1.12.12 1.69.12 4.69 0 8.5-3.01 8.5-6.6S13.69 1.5 9 1.5z"
          />
        </svg>
        카카오로 로그인
      </a>
    </div>
  );
}
