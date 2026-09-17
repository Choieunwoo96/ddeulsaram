'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import * as store from './store';
import { Mode } from './types';
import { ADMIN_COOKIE_NAME, isAdminAuthenticated } from './admin';

// 방장 본인 확인용 쿠키 이름 규칙. 로그인 기능이 없는 프로토타입이라, 방을 만든
// "이 브라우저"에만 방장 전용 쿠키를 심어두고 그걸로 수락/거절 권한을 확인한다.
const hostCookieName = (roomId: string) => `host_${roomId}`;
// 매칭 대기열 항목을 등록한 본인 확인용 쿠키 이름 규칙 (삭제 권한 체크에 사용).
const entryCookieName = (entryId: string) => `entry_${entryId}`;

const HOST_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

export async function createRoomAction(formData: FormData) {
  const title = String(formData.get('title') || '').trim();
  const major = String(formData.get('major') || '').trim();
  const minor = String(formData.get('minor') || '').trim();
  const mode = (String(formData.get('mode') || 'online') as Mode) ?? 'online';
  const location = String(formData.get('location') || '').trim();
  const datetime = String(formData.get('datetime') || '').trim();
  const capacity = Number(formData.get('capacity') || 1) || 1;
  const condition = String(formData.get('condition') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const hostNickname = String(formData.get('hostNickname') || '').trim();

  if (!title || !major || !minor || !hostNickname) {
    throw new Error('필수 항목을 모두 입력해주세요.');
  }

  const { room, hostToken } = await store.createRoom({
    title,
    major,
    minor,
    mode,
    location,
    datetime,
    capacity,
    condition,
    description,
    hostNickname,
  });

  revalidatePath('/');
  // 방장 확인용 쿠키는 여기서 바로 심지 않고, 진짜 HTTP 리다이렉트로 쿠키를 심어주는
  // /api/rooms/[id]/claim 라우트를 거쳐서 방으로 이동한다. (서버 액션 안에서
  // cookies().set() 직후 redirect()로 넘어가는 방식이 일부 환경에서 쿠키가 누락되는
  // 문제가 있어서, 더 확실하게 동작하는 방식으로 바꿨다.)
  redirect(`/api/rooms/${room.id}/claim?token=${hostToken}`);
}

/**
 * 방장만 방을 삭제할 수 있다. 삭제되면 신청 내역(applications)도 같이 지워진다
 * (DB에서 on delete cascade로 연결되어 있음).
 */
export async function deleteRoomAction(roomId: string, formData: FormData) {
  const token = cookies().get(hostCookieName(roomId))?.value;
  const isHost = await store.verifyRoomHostToken(roomId, token);
  if (!isHost) {
    throw new Error('방장만 이 방을 삭제할 수 있어요.');
  }

  await store.deleteRoom(roomId);
  revalidatePath('/');
  redirect('/');
}

export async function applyAction(roomId: string, formData: FormData) {
  const nickname = String(formData.get('nickname') || '').trim();
  const spec = String(formData.get('spec') || '').trim();
  if (!nickname || !spec) {
    throw new Error('닉네임과 스펙을 입력해주세요.');
  }
  await store.applyToRoom(roomId, nickname, spec);
  revalidatePath(`/rooms/${roomId}`);
}

export async function updateApplicationStatusAction(
  roomId: string,
  appId: string,
  status: 'accepted' | 'rejected'
) {
  // 이 브라우저가 실제로 이 방의 방장인지 서버에서 다시 한번 확인한다.
  // (화면에는 방장한테만 버튼이 보이지만, 혹시 모를 위조 요청을 막기 위한 서버쪽 안전장치)
  const token = cookies().get(hostCookieName(roomId))?.value;
  const isHost = await store.verifyRoomHostToken(roomId, token);
  if (!isHost) {
    throw new Error('방장만 신청을 수락하거나 거절할 수 있어요.');
  }

  await store.updateApplicationStatus(roomId, appId, status);

  if (status === 'accepted') {
    // 수락 인원이 모집 인원(capacity)에 다 찼으면 방을 자동으로 'done' 처리한다.
    await store.autoCompleteRoomIfFull(roomId);
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath('/');
}

export async function addQueueEntryAction(formData: FormData) {
  const nickname = String(formData.get('nickname') || '').trim();
  const major = String(formData.get('major') || '').trim();
  const minor = String(formData.get('minor') || '').trim();
  const mode = (String(formData.get('mode') || 'online') as Mode) ?? 'online';
  const region = String(formData.get('region') || '').trim();
  const timeslot = String(formData.get('timeslot') || '').trim();
  const note = String(formData.get('note') || '').trim();

  if (!nickname || !major || !minor || !region) {
    throw new Error('필수 항목을 모두 입력해주세요.');
  }

  const { entry, entryToken } = await store.addQueueEntry({
    nickname,
    major,
    minor,
    mode,
    region,
    timeslot,
    note,
  });

  // 이 등록을 나중에 본인이 취소(삭제)할 수 있도록 브라우저에 확인용 쿠키를 심는다.
  // (리다이렉트 없이 같은 페이지에서 바로 처리되는 액션이라 여기서 직접 심어도 안전하다.)
  cookies().set(entryCookieName(entry.id), entryToken, HOST_COOKIE_OPTIONS);

  revalidatePath('/match');
}

/**
 * 본인이 등록한 대기열 항목만 삭제(취소)할 수 있다.
 */
export async function deleteQueueEntryAction(entryId: string, formData: FormData) {
  const token = cookies().get(entryCookieName(entryId))?.value;
  const isOwner = await store.verifyQueueEntryToken(entryId, token);
  if (!isOwner) {
    throw new Error('본인이 등록한 대기열만 삭제할 수 있어요.');
  }

  await store.deleteQueueEntry(entryId);
  revalidatePath('/match');
}

// ---------------------------------------------------------------------------
// 관리자 (비밀번호 하나로 모든 방/대기열을 정리할 수 있는 전용 페이지용)
// ---------------------------------------------------------------------------

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get('password') || '').trim();
  const correctPassword = process.env.ADMIN_PASSWORD?.trim();

  // 비밀번호가 틀렸거나 환경변수 자체가 없으면, 화면이 깨지는 예외를 던지는 대신
  // 안내 문구가 뜨는 로그인 화면으로 다시 보낸다. (쿠키를 심지 않는 경로라
  // redirect()를 같이 써도 안전하다.)
  if (!correctPassword) {
    redirect('/admin?error=no_password_env');
  }
  if (password !== correctPassword) {
    redirect('/admin?error=wrong_password');
  }

  // 리다이렉트 없이 같은 페이지에서 바로 처리되는 액션이라 여기서 쿠키를 직접
  // 심어도 안전하다 (방 생성처럼 곧바로 redirect()가 뒤따르는 경우와 달리
  // 쿠키 누락 걱정이 없다).
  cookies().set(ADMIN_COOKIE_NAME, correctPassword, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8시간 동안 로그인 유지
  });

  revalidatePath('/admin');
}

export async function adminLogoutAction() {
  cookies().set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  revalidatePath('/admin');
}

export async function adminDeleteRoomAction(roomId: string, formData: FormData) {
  if (!isAdminAuthenticated()) {
    redirect('/admin?error=wrong_password');
  }
  await store.deleteRoom(roomId);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function adminDeleteQueueEntryAction(entryId: string, formData: FormData) {
  if (!isAdminAuthenticated()) {
    redirect('/admin?error=wrong_password');
  }
  await store.deleteQueueEntry(entryId);
  revalidatePath('/admin');
  revalidatePath('/match');
}
