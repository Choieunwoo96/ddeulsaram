'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import * as store from './store';
import { Mode } from './types';

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

  const room = await store.createRoom({
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
  await store.updateApplicationStatus(roomId, appId, status);
  revalidatePath(`/rooms/${roomId}`);
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
