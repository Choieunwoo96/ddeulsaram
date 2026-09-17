'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type ChatMessage = {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  createdAt: string;
};

const PRESENCE_CHANNEL = 'ddeulsaram-chat-presence';
const MAX_MESSAGE_LENGTH = 500;

function mapRow(row: any): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    content: row.content,
    createdAt: row.created_at,
  };
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
  const openRef = useRef(open);
  const listRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !userId || !nickname || sending) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      id: window.crypto.randomUUID(),
      user_id: userId,
      nickname,
      content: content.slice(0, MAX_MESSAGE_LENGTH),
    });
    setSending(false);
    if (!error) setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-w-[calc(100vw-2rem)] h-96 bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <span className="font-semibold text-sm">실시간 채팅</span>
            <span className="flex items-center gap-1 text-xs text-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {onlineCount}명 접속중
            </span>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-xs text-slate-400 mt-6">
                아직 메시지가 없어요. 첫 메시지를 남겨보세요!
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.userId === userId ? 'text-right' : ''}>
                <div
                  className={`inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm ${
                    m.userId === userId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.userId !== userId && (
                    <div className="text-[11px] font-semibold text-indigo-500 mb-0.5">
                      {m.nickname}
                    </div>
                  )}
                  <div className="break-words">{m.content}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-2">
            {userId && nickname ? (
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
            ) : (
              <p className="text-xs text-slate-400 text-center py-1">
                <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                  로그인
                </Link>
                하고 채팅에 참여해보세요.
              </p>
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
