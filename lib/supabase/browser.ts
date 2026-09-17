import { createBrowserClient } from '@supabase/ssr';

// 실시간 채팅처럼 브라우저에서 직접 Supabase(Realtime)에 붙어야 하는 기능 전용.
// NEXT_PUBLIC_ 접두사가 붙은 값만 쓰므로, 여기서 쓰는 키는 절대 service_role이
// 아니라 anon key여야 한다 (브라우저 번들에 그대로 노출되는 값이기 때문).
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
