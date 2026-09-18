import { randomUUID } from 'crypto';
import { supabase } from './supabaseClient';
import {
  Room,
  QueueEntry,
  MatchRecord,
  Application,
  Mode,
  Notification,
  AdminStats,
  Report,
  ReportTargetType,
  BlockedSender,
} from './types';

// ---------------------------------------------------------------------------
// Supabase(PostgreSQL) 기반 데이터 레이어.
// 이 파일은 서버 컴포넌트/서버 액션에서만 import 된다 (service_role 키 사용).
// 함수 시그니처는 이전 로컬 JSON 버전과 동일하게 유지해서, 페이지/서버 액션
// 코드는 거의 그대로 두고 내부 구현만 교체했다.
// ---------------------------------------------------------------------------

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// --- row <-> 앱 타입 매핑 ----------------------------------------------------

function mapRoomRow(row: any): Room {
  return {
    id: row.id,
    title: row.title,
    major: row.major,
    minor: row.minor,
    mode: row.mode as Mode,
    location: row.location ?? '',
    datetime: row.datetime ?? '',
    capacity: row.capacity ?? 1,
    condition: row.condition ?? '',
    description: row.description ?? '',
    hostNickname: row.host_nickname,
    status: row.status,
    applications: [],
    createdAt: row.created_at,
  };
}

function mapApplicationRow(row: any): Application {
  return {
    id: row.id,
    nickname: row.nickname,
    spec: row.spec,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapQueueRow(row: any): QueueEntry {
  return {
    id: row.id,
    nickname: row.nickname,
    major: row.major,
    minor: row.minor,
    mode: row.mode as Mode,
    region: row.region,
    timeslot: row.timeslot ?? '',
    note: row.note ?? '',
    createdAt: row.created_at,
  };
}

function mapMatchRow(row: any): MatchRecord {
  return {
    id: row.id,
    a: row.a_entry as QueueEntry,
    b: row.b_entry as QueueEntry,
    matchedAt: row.matched_at,
  };
}

function mapReportRow(row: any): Report {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label ?? '',
    offenderNickname: row.offender_nickname ?? null,
    offenderUserId: row.offender_user_id ?? null,
    reason: row.reason,
    detail: row.detail ?? '',
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapBlockedSenderRow(row: any): BlockedSender {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    nickname: row.nickname ?? null,
    reason: row.reason ?? '',
    createdAt: row.created_at,
  };
}

function mapNotificationRow(row: any): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? '',
    link: row.link ?? null,
    read: row.read,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function listRooms(filter?: {
  major?: string;
  minor?: string;
  mode?: string;
  status?: string;
  q?: string;
}): Promise<Room[]> {
  let query = supabase.from('rooms').select('*').order('created_at', { ascending: false });
  if (filter?.major) query = query.eq('major', filter.major);
  if (filter?.minor) query = query.eq('minor', filter.minor);
  if (filter?.mode) query = query.eq('mode', filter.mode);
  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.q) {
    // 제목/설명/방장 닉네임 중 하나라도 검색어를 포함하면 결과에 포함한다.
    const escaped = filter.q.trim().replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%,host_nickname.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRoomRow);
}

export async function getRoom(id: string): Promise<Room | undefined> {
  const { data: roomRow, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!roomRow) return undefined;

  const { data: appRows, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: true });
  if (appError) throw appError;

  const room = mapRoomRow(roomRow);
  room.applications = (appRows ?? []).map(mapApplicationRow);
  return room;
}

/**
 * 방을 생성하고, 방장 본인 확인용 비밀 토큰(hostToken)도 같이 발급한다.
 * hostToken은 DB의 host_token 컬럼에 저장되고, 호출한 쪽(서버 액션)이 이 값을
 * 브라우저 쿠키에 저장해서 "이 브라우저 = 방장"임을 나중에 확인하는 데 쓴다.
 * 절대 Room 타입/클라이언트 쪽으로 넘기지 않고 이 함수를 호출한 서버 코드만 사용한다.
 */
export async function createRoom(
  input: Omit<Room, 'id' | 'applications' | 'status' | 'createdAt'>,
  hostUserId?: string
): Promise<{ room: Room; hostToken: string }> {
  const id = genId('r');
  const hostToken = randomUUID();
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      id,
      title: input.title,
      major: input.major,
      minor: input.minor,
      mode: input.mode,
      location: input.location,
      datetime: input.datetime,
      capacity: input.capacity,
      condition: input.condition,
      description: input.description,
      host_nickname: input.hostNickname,
      status: 'open',
      host_token: hostToken,
      host_user_id: hostUserId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return { room: mapRoomRow(data), hostToken };
}

/**
 * 이 브라우저(쿠키로 넘어온 token)가 실제로 이 방의 방장인지 확인한다.
 * token이 없거나 DB에 저장된 host_token과 다르면 false.
 * (예전 마이그레이션 이전에 만들어진 방은 host_token이 비어있어서 항상 false.)
 */
export async function verifyRoomHostToken(
  roomId: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const { data, error } = await supabase
    .from('rooms')
    .select('host_token')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw error;
  return !!data?.host_token && data.host_token === token;
}

/**
 * 방을 삭제한다. applications 테이블은 on delete cascade로 연결되어 있어서
 * 신청 내역도 같이 정리된다. 호출하는 쪽(서버 액션)에서 반드시 방장인지
 * verifyRoomHostToken으로 먼저 확인해야 한다.
 */
export async function deleteRoom(roomId: string) {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);
  if (error) throw error;
}

export async function applyToRoom(
  roomId: string,
  nickname: string,
  spec: string,
  applicantUserId?: string
): Promise<Application | undefined> {
  const id = genId('a');
  const { data, error } = await supabase
    .from('applications')
    .insert({
      id,
      room_id: roomId,
      nickname,
      spec,
      status: 'pending',
      applicant_user_id: applicantUserId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapApplicationRow(data);
}

/**
 * 로그인한 사용자가 이 방에 이미 신청한 적이 있는지 확인한다. 참가 신청은
 * 한 사람당 한 번만 가능해야 하므로, 쿠키(브라우저 단위 체크)와 별개로
 * 로그인 계정 기준으로도 한 번 더 막아준다.
 */
export async function hasUserApplied(roomId: string, applicantUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('room_id', roomId)
    .eq('applicant_user_id', applicantUserId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * 방에 신청이 들어왔을 때, 그 방의 방장에게 알림을 보내야 하는지 확인하기 위해
 * (로그인 상태로 만든 방이었다면) 방장의 user_id와 방 제목을 가져온다.
 */
export async function getRoomNotifyInfo(
  roomId: string
): Promise<{ hostUserId: string | null; title: string } | undefined> {
  const { data, error } = await supabase
    .from('rooms')
    .select('host_user_id, title')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return { hostUserId: data.host_user_id ?? null, title: data.title };
}

/**
 * 신청이 수락/거절됐을 때, 신청자에게 알림을 보내야 하는지 확인하기 위해
 * (로그인 상태로 신청했었다면) 신청자의 user_id와 방 제목을 가져온다.
 */
export async function getApplicationNotifyInfo(
  appId: string
): Promise<{ applicantUserId: string | null; roomTitle: string } | undefined> {
  const { data, error } = await supabase
    .from('applications')
    .select('applicant_user_id, rooms(title)')
    .eq('id', appId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const room = Array.isArray(data.rooms) ? data.rooms[0] : data.rooms;
  return {
    applicantUserId: data.applicant_user_id ?? null,
    roomTitle: (room as { title?: string } | null)?.title ?? '',
  };
}

export async function updateApplicationStatus(
  roomId: string,
  appId: string,
  status: Application['status']
) {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId)
    .eq('room_id', roomId);
  if (error) throw error;
}

/**
 * 수락된(accepted) 신청자 수가 방의 모집 인원(capacity)에 도달하면
 * 방 상태를 'done'으로 자동 전환한다. 'done' 상태인 방은 홈 목록에서 빠진다.
 */
export async function autoCompleteRoomIfFull(roomId: string) {
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('capacity, status')
    .eq('id', roomId)
    .maybeSingle();
  if (roomError) throw roomError;
  if (!room || room.status !== 'open') return;

  const { count, error: countError } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .eq('status', 'accepted');
  if (countError) throw countError;

  if ((count ?? 0) >= room.capacity) {
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ status: 'done' })
      .eq('id', roomId);
    if (updateError) throw updateError;
  }
}

// ---------------------------------------------------------------------------
// Auto-matching queue
// ---------------------------------------------------------------------------

export async function listQueue(): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapQueueRow);
}

export async function listMatchesForNickname(nickname: string): Promise<MatchRecord[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('matched_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map(mapMatchRow)
    .filter((m) => m.a.nickname === nickname || m.b.nickname === nickname);
}

/**
 * 아주 단순한 규칙 기반 매칭:
 * 같은 대/소분류 + 같은 진행방식(온/오프라인) + 같은 지역(또는 서버) 조건을
 * 가진 대기자가 이미 있으면 즉시 매칭시키고, 없으면 대기열에 등록한다.
 */
export async function addQueueEntry(
  input: Omit<QueueEntry, 'id' | 'createdAt'>
): Promise<{ entry: QueueEntry; entryToken: string; match?: MatchRecord }> {
  // 저장/검색 양쪽 다 trim된 값을 써야 "서울 "과 "서울"처럼 공백 하나 때문에
  // 매칭이 실패하는 걸 막을 수 있다.
  const nickname = input.nickname.trim();
  const region = input.region.trim();
  const timeslot = input.timeslot.trim();
  const note = input.note.trim();

  const { data: candidates, error: findError } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('major', input.major)
    .eq('minor', input.minor)
    .eq('mode', input.mode)
    .ilike('region', region)
    .neq('nickname', nickname)
    .order('created_at', { ascending: true })
    .limit(1);
  if (findError) throw findError;

  const id = genId('q');
  const entryToken = randomUUID();
  const { data: insertedRow, error: insertError } = await supabase
    .from('queue_entries')
    .insert({
      id,
      nickname,
      major: input.major,
      minor: input.minor,
      mode: input.mode,
      region,
      timeslot,
      note,
      entry_token: entryToken,
    })
    .select()
    .single();
  if (insertError) throw insertError;
  const entry = mapQueueRow(insertedRow);

  if (candidates && candidates.length > 0) {
    const candidate = mapQueueRow(candidates[0]);

    const { error: delError } = await supabase
      .from('queue_entries')
      .delete()
      .in('id', [candidate.id, entry.id]);
    if (delError) throw delError;

    const matchId = genId('m');
    const { data: matchRow, error: matchError } = await supabase
      .from('matches')
      .insert({ id: matchId, a_entry: candidate, b_entry: entry })
      .select()
      .single();
    if (matchError) throw matchError;

    return { entry, entryToken, match: mapMatchRow(matchRow) };
  }

  return { entry, entryToken };
}

/**
 * 이 브라우저(쿠키로 넘어온 token)가 실제로 이 대기열 항목을 등록한 본인인지 확인한다.
 */
export async function verifyQueueEntryToken(
  entryId: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const { data, error } = await supabase
    .from('queue_entries')
    .select('entry_token')
    .eq('id', entryId)
    .maybeSingle();
  if (error) throw error;
  return !!data?.entry_token && data.entry_token === token;
}

export async function deleteQueueEntry(entryId: string) {
  const { error } = await supabase.from('queue_entries').delete().eq('id', entryId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const id = genId('n');
  const { error } = await supabase.from('notifications').insert({
    id,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? '',
    link: input.link ?? null,
  });
  if (error) throw error;
}

export async function listNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapNotificationRow);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// 관리자 대시보드 통계
// ---------------------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStats> {
  const [
    { count: totalUsers, error: usersError },
    { count: totalRooms, error: roomsError },
    { count: openRooms, error: openError },
    { count: closedRooms, error: closedError },
    { count: doneRooms, error: doneError },
    { count: queueCount, error: queueError },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'done'),
    supabase.from('queue_entries').select('id', { count: 'exact', head: true }),
  ]);

  const firstError =
    usersError || roomsError || openError || closedError || doneError || queueError;
  if (firstError) throw firstError;

  return {
    totalUsers: totalUsers ?? 0,
    totalRooms: totalRooms ?? 0,
    openRooms: openRooms ?? 0,
    closedRooms: closedRooms ?? 0,
    doneRooms: doneRooms ?? 0,
    queueCount: queueCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// 신고 / 차단
// ---------------------------------------------------------------------------

/** 방 신고 시 표시용 정보(제목·방장)를 가져온다. */
export async function getRoomReportInfo(
  roomId: string
): Promise<{ title: string; hostNickname: string; hostUserId: string | null } | undefined> {
  const { data, error } = await supabase
    .from('rooms')
    .select('title, host_nickname, host_user_id')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    title: data.title,
    hostNickname: data.host_nickname,
    hostUserId: data.host_user_id ?? null,
  };
}

/** 채팅 메시지 신고 시 표시용 정보(내용·작성자)를 가져온다. */
export async function getChatMessageReportInfo(
  messageId: string
): Promise<{ content: string; nickname: string; userId: string | null } | undefined> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('content, nickname, user_id')
    .eq('id', messageId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return { content: data.content, nickname: data.nickname, userId: data.user_id ?? null };
}

export async function createReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  offenderNickname?: string | null;
  offenderUserId?: string | null;
  reason: string;
  detail?: string;
}) {
  const id = genId('rp');
  const { error } = await supabase.from('reports').insert({
    id,
    target_type: input.targetType,
    target_id: input.targetId,
    target_label: input.targetLabel,
    offender_nickname: input.offenderNickname ?? null,
    offender_user_id: input.offenderUserId ?? null,
    reason: input.reason,
    detail: input.detail ?? '',
  });
  if (error) throw error;
}

export async function listReports(status?: 'pending' | 'resolved'): Promise<Report[]> {
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapReportRow);
}

export async function resolveReport(reportId: string) {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('id', reportId);
  if (error) throw error;
}

export async function blockSender(input: {
  userId?: string | null;
  nickname?: string | null;
  reason?: string;
}) {
  if (!input.userId && !input.nickname) {
    throw new Error('차단하려면 user_id 또는 nickname 중 하나는 있어야 합니다.');
  }
  const id = genId('blk');
  const { error } = await supabase.from('blocked_senders').insert({
    id,
    user_id: input.userId ?? null,
    nickname: input.nickname ?? null,
    reason: input.reason ?? '',
  });
  if (error) throw error;
}

export async function listBlockedSenders(): Promise<BlockedSender[]> {
  const { data, error } = await supabase
    .from('blocked_senders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBlockedSenderRow);
}

export async function unblockSender(id: string) {
  const { error } = await supabase.from('blocked_senders').delete().eq('id', id);
  if (error) throw error;
}

export type { Mode };
