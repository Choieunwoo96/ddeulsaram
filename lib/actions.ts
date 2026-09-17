'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import * as store from './store';
import { Mode } from './types';

// 방장 본인 확인용 쿠키 이름 규칙. 로그인 기능이 없는 프로토타입이라, 방을 만든
// "이 브라우저"에만 방장 전용 쿠키를 심어두고 그걸로 수락/거절 권한을 확인한다.
const hostCookieName = (roomId: string) => `host_${roomId}`;

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

  // 방을 만든 이 브라우저에만 방장 확인용 쿠키를 심는다. 1년간 유지, 다른 사이트에서는
  // 못 읽도록 httpOnly로 설정 (자바스크립트로도 접근 불가, 서버만 읽을 수 있음).
  cookies().set(hostCookieName(room.id), hostToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/');
  redirect(`/rooms/${room.id}`);
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

  await store.addQueueEntry({ nickname, major, minor, mode, region, timeslot, note });
  revalidatePath('/match');
}
