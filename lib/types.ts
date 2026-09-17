export type Mode = 'online' | 'offline';

export interface Category {
  major: string;
  minors: string[];
  icon: string; // 이모지 아이콘 (별도 이미지 호스팅 없이 가볍게 표시)
}

export interface Application {
  id: string;
  nickname: string;
  spec: string; // 실력/티어/지역/나이대 등 자유 텍스트
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Room {
  id: string;
  title: string;
  major: string;
  minor: string;
  mode: Mode;
  location: string; // 오프라인 장소 또는 온라인 서버/플랫폼
  datetime: string; // 자유 텍스트 (예: "이번 주 토요일 오후 3시")
  capacity: number;
  condition: string; // 상대 조건
  description: string;
  hostNickname: string;
  status: 'open' | 'closed' | 'done';
  applications: Application[];
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  nickname: string;
  major: string;
  minor: string;
  mode: Mode;
  region: string; // 지역(오프라인) 또는 서버/플랫폼(온라인)
  timeslot: string; // 자유 텍스트, 예: "평일 저녁", "주말 오후"
  note: string;
  createdAt: string;
}

export interface MatchRecord {
  id: string;
  a: QueueEntry;
  b: QueueEntry;
  matchedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  openRooms: number;
  closedRooms: number;
  doneRooms: number;
  queueCount: number;
}
