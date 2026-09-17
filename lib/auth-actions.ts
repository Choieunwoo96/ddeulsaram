'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from './supabase/server';
import { SITE_URL } from './site';

// useFormState와 함께 쓰는 서버 액션들.
//
// 왜 redirect()를 안 쓰는가?
// 이 프로젝트에서 이전에 "쿠키를 설정하면서 동시에 redirect()하는 서버 액션"이
// 브라우저에 쿠키가 반영되기 전에 이동해버려서 로그인 상태가 유실되는 문제를
// 겪은 적이 있다 (방장 수락/거절 버그의 원인이었음). 그래서 로그인/회원가입처럼
// "쿠키(세션)를 설정하는" 액션은 redirect() 없이 상태만 반환하고, 이동은
// 클라이언트 컴포넌트에서 router.push()로 따로 처리한다.

export type AuthActionState = { error?: string; success?: string } | null;

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않아요.',
    'User already registered': '이미 가입된 이메일이에요. 로그인해주세요.',
    'Email not confirmed': '이메일 인증이 필요해요. 받은 편지함에서 인증 링크를 확인해주세요.',
    'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 해요.',
  };
  return map[message] || '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.';
}

export async function signInAction(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 모두 입력해주세요.' };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { error: '로그인 기능이 아직 설정되지 않았어요. (SUPABASE_ANON_KEY 환경변수 필요)' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath('/', 'layout');
  return { success: 'loggedIn' };
}

export async function signUpAction(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const nickname = String(formData.get('nickname') || '').trim();

  if (!email || !password || !nickname) {
    return { error: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' };
  }
  if (password.length < 6) {
    return { error: '비밀번호는 최소 6자 이상이어야 해요.' };
  }
  if (nickname.length > 20) {
    return { error: '닉네임은 20자 이내로 입력해주세요.' };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return { error: '회원가입 기능이 아직 설정되지 않았어요. (SUPABASE_ANON_KEY 환경변수 필요)' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath('/', 'layout');

  // Supabase 프로젝트의 "Confirm email" 설정이 켜져 있으면(기본값) 이메일 인증
  // 전까지는 세션이 생기지 않는다. 이 경우와 즉시 로그인되는 경우를 구분해서
  // 화면에 다른 안내를 보여준다.
  return { success: data.session ? 'loggedIn' : 'checkEmail' };
}

export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath('/', 'layout');
}
