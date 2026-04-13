"use client";

import { useEffect, useEffectEvent, useState } from "react";

type SlotId = "a" | "b";

type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

type ApiResponse<TData, TMeta = unknown> =
  | {
      success: true;
      data: TData;
      meta: TMeta | null;
      traceId: string | null;
    }
  | {
      success: false;
      error: ApiError;
      traceId: string | null;
    };

type UserProfile = {
  id: number | string;
  name: string;
  email: string;
  status?: string;
};

type LoginResponse = {
  token: string;
  actor: "user";
  user: UserProfile;
};

type ChatMessage = {
  id: number;
  chat_id: number;
  sender_user_id: number;
  is_mine: boolean;
  message_type: string;
  body: string | null;
  created_at: string | null;
  sender: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type ChatSummary = {
  id: number;
  status: string;
  unread_count: number;
  last_message: ChatMessage | null;
  other_user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type NotificationInbox = {
  id: number;
  event_type: string;
  title: string | null;
  body: string | null;
  event_count: number;
  additional_count: number;
  target_type: string | null;
  target_id: number | null;
  is_read: boolean;
  updated_at: string | null;
};

type NotificationUnreadCount = {
  unread_count: number;
  unread_event_count: number;
};

type MessageListMeta = {
  order?: "asc" | "desc";
};

type SlotState = {
  email: string;
  password: string;
  token: string;
  user: UserProfile | null;
  chats: ChatSummary[];
  notifications: NotificationInbox[];
  unreadCount: number;
  unreadEventCount: number;
  messageDraft: string;
};

const apiBase = "/api/v1/user";
const visibleChatCount = 4;
const visibleMessageCount = 12;
const visibleNotificationCount = 5;

const initialSlots: Record<SlotId, SlotState> = {
  a: {
    email: "",
    password: "password",
    token: "",
    user: null,
    chats: [],
    notifications: [],
    unreadCount: 0,
    unreadEventCount: 0,
    messageDraft: "",
  },
  b: {
    email: "",
    password: "password",
    token: "",
    user: null,
    chats: [],
    notifications: [],
    unreadCount: 0,
    unreadEventCount: 0,
    messageDraft: "",
  },
};

function normalizeMessages(items: ChatMessage[], meta: MessageListMeta | null): ChatMessage[] {
  return meta?.order === "desc" ? [...items].reverse() : items;
}

function compactText(value: string | null | undefined, fallback = "-"): string {
  const text = (value ?? "").trim();

  if (!text) {
    return fallback;
  }

  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}

export default function ChatTestPageClient() {
  const [slots, setSlots] = useState<Record<SlotId, SlotState>>(initialSlots);
  const [chatId, setChatId] = useState("");
  const [viewer, setViewer] = useState<SlotId>("a");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  function appendLog(message: string): void {
    setLogs((current) => [message, ...current].slice(0, 20));
  }

  function updateSlot(slotId: SlotId, patch: Partial<SlotState>): void {
    setSlots((current) => ({
      ...current,
      [slotId]: {
        ...current[slotId],
        ...patch,
      },
    }));
  }

  async function request<TData, TMeta = unknown>(
    slotId: SlotId | null,
    path: string,
    options: RequestInit & { body?: BodyInit | null } = {},
  ): Promise<{ data: TData; meta: TMeta | null }> {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (slotId !== null) {
      const token = slots[slotId].token;
      if (!token) {
        throw new Error(`${slotId.toUpperCase()} 로그인이 필요합니다.`);
      }

      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
    });
    const json = (await response.json().catch(() => null)) as ApiResponse<TData, TMeta> | null;

    if (!response.ok || json === null || json.success === false) {
      const message = json && json.success === false
        ? `${json.error.message} ${json.error.details ? JSON.stringify(json.error.details) : ""}`.trim()
        : `HTTP ${response.status}`;

      throw new Error(message);
    }

    setStatusMessage(`${options.method ?? "GET"} ${path} 완료`);
    appendLog(`${options.method ?? "GET"} ${path}\n${JSON.stringify(json, null, 2)}`);

    return {
      data: json.data,
      meta: json.meta,
    };
  }

  async function login(slotId: SlotId): Promise<void> {
    const slot = slots[slotId];
    const { data } = await request<LoginResponse>(null, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: slot.email,
        password: slot.password,
        device_name: `user-web-${slotId}`,
      }),
    });

    updateSlot(slotId, {
      token: data.token,
      user: data.user,
    });
  }

  async function logout(slotId: SlotId): Promise<void> {
    if (slots[slotId].token) {
      try {
        await request(slotId, "/auth/logout", {
          method: "POST",
          body: JSON.stringify({}),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatusMessage(message);
        appendLog(message);
      }
    }

    updateSlot(slotId, {
      token: "",
      user: null,
      chats: [],
      notifications: [],
      unreadCount: 0,
      unreadEventCount: 0,
      messageDraft: "",
    });
  }

  async function openChat(from: SlotId, to: SlotId): Promise<void> {
    const peerUserId = slots[to].user?.id;
    if (!peerUserId) {
      throw new Error(`${to.toUpperCase()} 로그인이 필요합니다.`);
    }

    const { data } = await request<ChatSummary>(from, "/chats", {
      method: "POST",
      body: JSON.stringify({
        peer_user_id: Number(peerUserId),
      }),
    });

    setChatId(String(data.id));
    setViewer(from);
    await Promise.all([refreshSlot("a"), refreshSlot("b")]);
    await loadMessages(from, String(data.id));
  }

  async function loadChats(slotId: SlotId): Promise<void> {
    if (!slots[slotId].token) {
      return;
    }

    const { data } = await request<ChatSummary[]>(slotId, "/chats?per_page=20");
    updateSlot(slotId, {
      chats: data,
    });
  }

  async function loadNotifications(slotId: SlotId): Promise<void> {
    if (!slots[slotId].token) {
      return;
    }

    const [listResult, countResult] = await Promise.all([
      request<NotificationInbox[]>(slotId, `/notifications?per_page=${visibleNotificationCount}`),
      request<NotificationUnreadCount>(slotId, "/notifications/unread-count"),
    ]);

    updateSlot(slotId, {
      notifications: listResult.data,
      unreadCount: countResult.data.unread_count,
      unreadEventCount: countResult.data.unread_event_count,
    });
  }

  async function refreshSlot(slotId: SlotId): Promise<void> {
    await Promise.all([loadChats(slotId), loadNotifications(slotId)]);
  }

  async function loadMessages(slotId = viewer, targetChatId = chatId): Promise<void> {
    if (!targetChatId) {
      throw new Error("채팅방 ID가 필요합니다.");
    }

    const { data, meta } = await request<ChatMessage[], MessageListMeta>(
      slotId,
      `/chats/${targetChatId}/messages?per_page=50`,
    );

    setViewer(slotId);
    setChatId(targetChatId);
    setMessages(normalizeMessages(data, meta).slice(-visibleMessageCount));
  }

  async function sendMessage(slotId: SlotId): Promise<void> {
    const body = slots[slotId].messageDraft.trim();
    if (!body) {
      throw new Error("메시지를 입력하세요.");
    }

    if (!chatId) {
      throw new Error("채팅방 ID가 필요합니다.");
    }

    await request<ChatMessage>(slotId, `/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        message_type: "TEXT",
        body,
      }),
    });

    updateSlot(slotId, {
      messageDraft: "",
    });
    await loadMessages(slotId, chatId);
    await Promise.all([refreshSlot("a"), refreshSlot("b")]);
  }

  async function readChat(slotId: SlotId): Promise<void> {
    if (!chatId) {
      throw new Error("채팅방 ID가 필요합니다.");
    }

    await request<ChatSummary>(slotId, `/chats/${chatId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await refreshSlot(slotId);
  }

  async function readNotification(slotId: SlotId, notificationId: number): Promise<void> {
    await request<NotificationInbox>(slotId, `/notifications/${notificationId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadNotifications(slotId);
  }

  async function readAllNotifications(slotId: SlotId): Promise<void> {
    await request<{ read_count: number }>(slotId, "/notifications/read-all", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadNotifications(slotId);
  }

  async function run(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusMessage(message);
      appendLog(message);
    }
  }

  const refreshVisibleData = useEffectEvent((slotId: SlotId, targetChatId: string) => {
    void loadMessages(slotId, targetChatId);
    void refreshSlot("a");
    void refreshSlot("b");
  });

  useEffect(() => {
    if (!autoRefresh || !chatId || !slots[viewer].token) {
      return;
    }

    const timer = window.setInterval(() => {
      refreshVisibleData(viewer, chatId);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, chatId, slots, viewer]);

  function renderUserColumn(slotId: SlotId) {
    const slot = slots[slotId];
    const visibleChats = slot.chats.slice(0, visibleChatCount);
    const visibleNotifications = slot.notifications.slice(0, visibleNotificationCount);

    return (
      <aside className="user-panel">
        <section className="panel-section">
          <h2>{slotId.toUpperCase()} 사용자</h2>
          <div className="field-row">
            <label htmlFor={`${slotId}-email`}>이메일</label>
            <input
              id={`${slotId}-email`}
              type="email"
              value={slot.email}
              onChange={(event) => updateSlot(slotId, { email: event.target.value })}
            />
          </div>
          <div className="field-row">
            <label htmlFor={`${slotId}-password`}>비번</label>
            <input
              id={`${slotId}-password`}
              type="password"
              value={slot.password}
              onChange={(event) => updateSlot(slotId, { password: event.target.value })}
            />
          </div>
          <div className="button-row">
            <button type="button" onClick={() => run(() => login(slotId))}>로그인</button>
            <button type="button" onClick={() => run(() => logout(slotId))}>로그아웃</button>
            <button type="button" onClick={() => run(() => refreshSlot(slotId))}>동기화</button>
          </div>
          <p className="muted-line">
            {slot.user ? `${slot.user.id} / ${slot.user.name} / ${slot.user.email}` : "로그인 안됨"}
          </p>
        </section>

        <section className="panel-section grow-section">
          <h3>채팅방</h3>
          {visibleChats.length === 0 ? (
            <p className="empty-line">없음</p>
          ) : (
            <ul className="compact-list">
              {visibleChats.map((chat) => (
                <li key={`${slotId}-chat-${chat.id}`}>
                  <button type="button" onClick={() => run(() => loadMessages(slotId, String(chat.id)))}>
                    #{chat.id}
                  </button>
                  <span>
                    {chat.other_user ? chat.other_user.name : "상대 없음"} / 안읽음 {chat.unread_count} /{" "}
                    {compactText(chat.last_message?.body)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-section grow-section">
          <div className="section-head">
            <h3>알림</h3>
            <button type="button" onClick={() => run(() => readAllNotifications(slotId))}>전체읽음</button>
          </div>
          <p className="muted-line">
            unread rows {slot.unreadCount}, events {slot.unreadEventCount}
          </p>
          {visibleNotifications.length === 0 ? (
            <p className="empty-line">없음</p>
          ) : (
            <ul className="compact-list notification-list">
              {visibleNotifications.map((notification) => (
                <li key={`${slotId}-notification-${notification.id}`}>
                  <button
                    type="button"
                    disabled={notification.is_read}
                    onClick={() => run(() => readNotification(slotId, notification.id))}
                  >
                    {notification.is_read ? "읽음" : "읽기"}
                  </button>
                  <span>
                    #{notification.id} {notification.is_read ? "R" : "U"} /{" "}
                    {notification.title ?? notification.event_type} / {compactText(notification.body)} /{" "}
                    외 {notification.additional_count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    );
  }

  function renderSendBox(slotId: SlotId) {
    return (
      <section className="send-box">
        <h3>{slotId.toUpperCase()} 전송</h3>
        <textarea
          rows={2}
          value={slots[slotId].messageDraft}
          onChange={(event) => updateSlot(slotId, { messageDraft: event.target.value })}
        />
        <div className="button-row">
          <button type="button" onClick={() => run(() => sendMessage(slotId))}>전송</button>
          <button type="button" onClick={() => run(() => readChat(slotId))}>읽음</button>
          <button type="button" onClick={() => run(() => loadMessages(slotId))}>조회</button>
        </div>
      </section>
    );
  }

  return (
    <main className="chat-test">
      <header className="topbar">
        <div>
          <h1>User Web 채팅/알림 테스트</h1>
          <p>API {apiBase} / 기본 비밀번호 password / 알림은 발신자 제외, 상대 유저에게만 생성</p>
          <p>상태: {statusMessage || "-"}</p>
        </div>
        <div className="control-row">
          <button type="button" onClick={() => run(() => openChat("a", "b"))}>A-B 열기</button>
          <button type="button" onClick={() => run(() => openChat("b", "a"))}>B-A 열기</button>
          <label htmlFor="chat-id">Chat ID</label>
          <input
            id="chat-id"
            type="number"
            min="1"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
          />
          <span>보기 {viewer.toUpperCase()}</span>
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            2초 갱신
          </label>
        </div>
      </header>

      <div className="workspace">
        {renderUserColumn("a")}

        <section className="message-panel">
          <section className="messages-section">
            <h2>메시지</h2>
            {messages.length === 0 ? (
              <p className="empty-line">메시지 없음</p>
            ) : (
              <ol className="message-list">
                {messages.map((message) => (
                  <li key={message.id}>
                    #{message.id} [{message.is_mine ? "내" : "상대"}]{" "}
                    {message.sender?.name ?? message.sender_user_id}: {compactText(message.body)}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="send-grid">
            {renderSendBox("a")}
            {renderSendBox("b")}
          </div>
        </section>

        {renderUserColumn("b")}
      </div>

      <section className="log-panel">
        <h2>로그</h2>
        <pre>{logs.length > 0 ? logs.join("\n\n---\n\n") : "로그 없음"}</pre>
      </section>
    </main>
  );
}
