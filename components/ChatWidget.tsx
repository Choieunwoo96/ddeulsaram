'use client';

import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import ReportButton from './ReportButton';

type ChatMessage = {
  id: string;
  userId: string | null;
  nickname: string;
  content: string;
  createdAt: string;
};

const PRESENCE_CHANNEL = 'ddeulsaram-chat-presence';
const GUEST_NICKNAME_STORAGE_KEY = 'ddeulsaram_guest_nickname';
const BLOCKED_SENDERS_STORAGE_KEY = 'ddeulsaram_blocked_chat_senders';
const MAX_MESSAGE_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 20;

function mapRow(row: any): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    content: row.content,
    createdAt: row.created_at,
  };
}

// 로그인 사용자는 user_id로, 비로그인은 닉네임으로 "이 메시지를 보낸 사람"을 식별한다.
// 이 앱엔 계정 없이도 채팅할 수 있는 사람이 많아서, 닉네임이 유일하게 남는 단서다.
function senderKey(m: ChatMessage) {
  return m.userId ? `u:${m.userId}` : `n:${m.nickname.trim().toLowerCase()}`;
}

export default function ChatWidget({
  userId,
  nickname,
}: {
  userId?: string;
  nickname?: string;
}) {
  // 이 훅은 렌더마다 새로 만들면 안 되므로 lazy init으로 한 번만 생성한다.
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unseen, setUnseen] = useState(0);
  // 로그인 안 했을 때만 쓰는 게스트 닉네임 (localStorage에 저장해서 다음 방문에도 유지).
  const [guestNickname, setGuestNickname] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  // 내가 차단한 상대방 목록. 서버에는 저장 안 하고 이 브라우저에만 저장해서,
  // 나한테만 그 사람 메시지가 안 보이게 한다 (다른 사람은 그대로 볼 수 있음).
  const [blockedKeys, setBlockedKeys] = useState<Record<string, string>>({});
  const [showBlockedManager, setShowBlockedManager] = useState(false);
  const openRef = useRef(open);
  const listRef = useRef<HTMLDivElement>(null);

  const effectiveNickname = userId ? nickname : guestNickname;

  useEffect(() => {
    if (userId) return;
    try {
      const saved = window.localStorage.getItem(GUEST_NICKNAME_STORAGE_KEY);
      if (saved) setGuestNickname(saved);
    } catch {
      // 프라이빗 창 등에서 localStorage가 막혀 있어도 채팅 자체는 되게 무시한다.
    }
  }, [userId]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BLOCKED_SENDERS_STORAGE_KEY);
      if (saved) setBlockedKeys(JSON.parse(saved));
    } catch {
      // 무시
    }
  }, []);

  const persistBlockedKeys = (next: Record<string, string>) => {
    setBlockedKeys(next);
    try {
      window.localStorage.setItem(BLOCKED_SENDERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 무시
    }
  };

  const blockSenderLocally = (m: ChatMessage) => {
    persistBlockedKeys({ ...blockedKeys, [senderKey(m)]: m.nickname });
  };

  const unblockSenderLocally = (key: string) => {
    const next = { ...blockedKeys };
    delete next[key];
    persistBlockedKeys(next);
  };

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnseen(0);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    }
  }, [open]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase
      .from('chat_messages')
      .select('id, user_id, nickname, content, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setMessages(data.map(mapRow).reverse());
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
        });
      });

    const messagesChannel = supabase
      .channel('chat-messages-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => [...prev, mapRow(payload.new)]);
          if (!openRef.current) setUnseen((n) => n + 1);
          requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
          });
        }
      )
      .subscribe();

    // 접속자 수 집계는 로그인 여부와 무관하게, 탭 하나당 하나의 presence key로 추적한다.
    const presenceKey =
      typeof window !== 'undefined'
        ? `${userId ?? 'guest'}-${window.crypto.randomUUID()}`
        : undefined;
    const presenceChannel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: presenceKey } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineCount(Math.max(1, Object.keys(state).length));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [supabase, userId]);

  if (!supabase) return null;

  const handleSetGuestNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nicknameDraft.trim().slice(0, MAX_NICKNAME_LENGTH);
    if (!trimmed) return;
    setGuestNickname(trimmed);
    try {
      window.localStorage.setItem(GUEST_NICKNAME_STORAGE_KEY, trimmed);
    } catch {
      // 저장 실패해도(프라이빗 창 등) 이번 방문에서는 그대로 채팅 가능하게 둔다.
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !effectiveNickname || sending) return;
    setSending(true);
    setSendError(null);
    const { error } = await supabase.from('chat_messages').insert({
      id: window.crypto.randomUUID(),
      user_id: userId ?? null,
      nickname: effectiveNickname,
      content: content.slice(0, MAX_MESSAGE_LENGTH),
    });
    setSending(false);
    if (error) {
      // 관리자에게 차단된 경우 DB 트리거가 에러를 내려준다. 그대로 보여준다.
      setSendError(
        error.message.includes('차단') ? error.message : '메시지를 보내지 못했어요.'
      );
    } else {
      setInput('');
    }
  };

  const isMine = (m: ChatMessage) =>
    userId ? m.userId === userId : m.userId === null && m.nickname === guestNickname;

  const visibleMessages = messages.filter((m) => !(senderKey(m) in blockedKeys) || isMine(m));

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-w-[calc(100vw-2rem)] h-96 bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <span className="font-semibold text-sm">실시간 채팅</span>
            <div className="flex items-center gap-2 text-xs text-indigo-100">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {onlineCount}명 접속중
              </span>
              <button
                type="button"
                onClick={() => setShowBlockedManager((v) => !v)}
                className="hover:text-white hover:underline"
              >
                차단 목록
              </button>
            </div>
          </div>

          {showBlockedManager ? (
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">
                내가 차단한 사람 ({Object.keys(blockedKeys).length})
              </p>
              {Object.keys(blockedKeys).length === 0 ? (
                <p className="text-xs text-slate-400">차단한 사람이 없어요.</p>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(blockedKeys).map(([key, nick]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1.5"
                    >
                      <span className="truncate">{nick}</span>
                      <button
                        type="button"
                        onClick={() => unblockSenderLocally(key)}
                        className="text-indigo-600 hover:underline shrink-0 ml-2"
                      >
                        해제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5">
              {visibleMessages.length === 0 && (
                <p className="text-center text-xs text-slate-400 mt-6">
                  아직 메시지가 없어요. 첫 메시지를 남겨보세요!
                </p>
              )}
              {visibleMessages.map((m) => (
                <div key={m.id} className={isMine(m) ? 'text-right' : ''}>
                  <div
                    className={`inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm ${
                      isMine(m) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {!isMine(m) && (
                      <div className="text-[11px] font-semibold text-indigo-500 mb-0.5">
                        {m.nickname}
                      </div>
                    )}
                    <div className="break-words">{m.content}</div>
                  </div>
                  {!isMine(m) && (
                    <div className="flex gap-2 mt-0.5 justify-start">
                      <button
                        type="button"
                        onClick={() => blockSenderLocally(m)}
                        className="text-[11px] text-slate-400 hover:text-rose-500"
                      >
                        차단
                      </button>
                      <ReportButton targetType="chat_message" targetId={m.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t p-2">
            {sendError && <p className="text-xs text-rose-500 mb-1">{sendError}</p>}
            {effectiveNickname ? (
              <div className="space-y-1">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-1.5"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder="메시지 입력..."
                    className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="bg-indigo-600 text-white rounded-lg px-3 text-sm font-medium disabled:opacity-50"
                  >
                    전송
                  </button>
                </form>
                {!userId && (
                  <p className="text-[11px] text-slate-400 text-right">
                    {guestNickname}님으로 채팅중 ·{' '}
                    <button
                      type="button"
                      onClick={() => setGuestNickname(null)}
                      className="hover:text-indigo-600 hover:underline"
                    >
                      닉네임 변경
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSetGuestNickname} className="flex gap-1.5">
                <input
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                  maxLength={MAX_NICKNAME_LENGTH}
                  placeholder="닉네임을 입력하세요"
                  className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={!nicknameDraft.trim()}
                  className="bg-indigo-600 text-white rounded-lg px-3 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  채팅 시작
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-2 bg-indigo-600 text-white rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:bg-indigo-700"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 4h16v12H8l-4 4V4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-medium">{onlineCount}명 접속중</span>
        {unseen > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-[18px] text-center">
            {unseen > 9 ? '9+' : unseen}
          </span>
        )}
      </button>
    </div>
  );
}
