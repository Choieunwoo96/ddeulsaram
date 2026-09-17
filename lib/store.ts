import { randomUUID } from 'crypto';
import { supabase } from './supabaseClient';
import { Room, QueueEntry, MatchRecord, Application, Mode } from './types';

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

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function listRooms(filter?: {
  major?: string;
  minor?: string;
  mode?: string;
  status?: string;
}): Promise<Room[]> {
  let query = supabase.from('rooms').select('*').order('created_at', { ascending: false });
  if (filter?.major) query = query.eq('major', filter.major);
  if (filter?.minor) query = query.eq('minor', filter.minor);
  if (filter?.mode) query = query.eq('mode', filter.mode);
  if (filter?.status) query = query.eq('status', filter.status);

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
  input: Omit<Room, 'id' | 'applications' | 'status' | 'createdAt'>
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

export async function applyToRoom(
  roomId: string,
  nickname: string,
  spec: string
): Promise<Application | undefined> {
  const id = genId('a');
  const { data, error } = await supabase
    .from('applications')
    .insert({ id, room_id: roomId, nickname, spec, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return mapApplicationRow(data);
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
): Promise<{ entry: QueueEntry; match?: MatchRecord }> {
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

    return { entry, match: mapMatchRow(matchRow) };
  }

  return { entry };
}

export type { Mode };
