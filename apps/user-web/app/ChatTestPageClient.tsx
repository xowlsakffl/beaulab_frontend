"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useEffect, useEffectEvent, useRef, useState } from "react";

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

type ChatAttachment = {
  id: number;
  url: string;
  mime_type: string | null;
  size?: number | null;
  metadata?: {
    original_name?: string | null;
    [key: string]: unknown;
  } | null;
};

type ChatMessage = {
  id: number;
  chat_id: number;
  sender_user_id: number;
  is_mine: boolean;
  message_type: string;
  body: string | null;
  attachments?: ChatAttachment[];
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
  last_read_message_id: number | null;
  other_last_read_message_id: number | null;
  last_message: ChatMessage | null;
  other_user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type NotificationInbox = {
  id: number;
  actor_type?: string | null;
  actor_id?: number | null;
  event_type: string;
  title: string | null;
  body: string | null;
  event_count: number;
  additional_count: number;
  target_type: string | null;
  target_id: number | null;
  payload?: {
    sender_user_name?: string | null;
    [key: string]: unknown;
  } | null;
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

type DraftChat = {
  peer: SlotId;
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
  attachmentFiles: File[];
  attachmentInputKey: number;
  activeChatId: string;
  isChatOpen: boolean;
  draftChat: DraftChat | null;
  messages: ChatMessage[];
  otherLastReadMessageId: number | null;
  realtimeStatus: string;
};

type BroadcastMessagePayload = {
  message?: Omit<ChatMessage, "is_mine">;
} & Partial<Omit<ChatMessage, "is_mine">>;

type ReadStatusPayload = {
  chat_id: number;
  reader_user_id: number;
  last_read_message_id: number | null;
  last_read_at: string | null;
};

type NotificationPayload = {
  notification?: NotificationInbox;
};

const apiBase = "/api/v1/user";
const slotIds: SlotId[] = ["a", "b"];
const visibleChatCount = 20;
const visibleMessageCount = 18;
const visibleNotificationCount = 20;

const reverbKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "beaulab-local-key";
const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1";
const reverbPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);
const reverbScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";

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
    attachmentFiles: [],
    attachmentInputKey: 0,
    activeChatId: "",
    isChatOpen: false,
    draftChat: null,
    messages: [],
    otherLastReadMessageId: null,
    realtimeStatus: "로그인 전",
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
    attachmentFiles: [],
    attachmentInputKey: 0,
    activeChatId: "",
    isChatOpen: false,
    draftChat: null,
    messages: [],
    otherLastReadMessageId: null,
    realtimeStatus: "로그인 전",
  },
};

function peerSlot(slotId: SlotId): SlotId {
  return slotId === "a" ? "b" : "a";
}

function normalizeMessages(items: ChatMessage[], meta: MessageListMeta | null): ChatMessage[] {
  return meta?.order === "desc" ? [...items].reverse() : items;
}

function compactText(value: string | null | undefined, fallback = "-"): string {
  const text = (value ?? "").trim();

  if (!text) {
    return fallback;
  }

  return text.length > 34 ? `${text.slice(0, 34)}...` : text;
}

function messageLabel(message: ChatMessage | null | undefined): string {
  if (!message) {
    return "-";
  }

  if ((message.attachments?.length ?? 0) > 0) {
    return `${message.message_type} 첨부 ${message.attachments?.length}`;
  }

  if (message.message_type !== "TEXT") {
    return message.message_type;
  }

  return compactText(message.body);
}

function attachmentName(attachment: ChatAttachment): string {
  const originalName = attachment.metadata?.original_name;

  if (typeof originalName === "string" && originalName.trim()) {
    return originalName;
  }

  return `file-${attachment.id}`;
}

function formatBytes(size: number | null | undefined): string {
  if (typeof size !== "number" || !Number.isFinite(size)) {
    return "";
  }

  if (size < 1024) {
    return `${size}B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function messageTypeForFiles(files: File[]): "TEXT" | "IMAGE" | "FILE" {
  if (files.length === 0) {
    return "TEXT";
  }

  return files.every((file) => file.type.startsWith("image/")) ? "IMAGE" : "FILE";
}

function buildMessageRequestBody(
  messageType: "TEXT" | "IMAGE" | "FILE",
  body: string,
  files: File[],
  peerUserId?: number | string,
): BodyInit {
  if (files.length === 0) {
    return JSON.stringify({
      ...(peerUserId !== undefined ? { peer_user_id: Number(peerUserId) } : {}),
      message_type: messageType,
      body,
    });
  }

  const formData = new FormData();
  formData.append("message_type", messageType);

  if (body) {
    formData.append("body", body);
  }

  if (peerUserId !== undefined) {
    formData.append("peer_user_id", String(peerUserId));
  }

  for (const file of files) {
    formData.append("attachments[]", file);
  }

  return formData;
}

function selectedFilesLabel(files: File[]): string {
  return files.map((file) => `${file.name}${formatBytes(file.size) ? ` (${formatBytes(file.size)})` : ""}`).join(", ");
}

function messageFromBroadcast(payload: BroadcastMessagePayload, currentUserId: number | string): ChatMessage | null {
  const source = payload.message ?? payload;

  if (!source.id || !source.chat_id || !source.sender_user_id) {
    return null;
  }

  return {
    id: Number(source.id),
    chat_id: Number(source.chat_id),
    sender_user_id: Number(source.sender_user_id),
    is_mine: Number(source.sender_user_id) === Number(currentUserId),
    message_type: String(source.message_type ?? "TEXT"),
    body: source.body ?? null,
    attachments: source.attachments ?? [],
    created_at: source.created_at ?? null,
    sender: source.sender ?? null,
  };
}

function isReadByPeer(message: ChatMessage, otherLastReadMessageId: number | null): boolean {
  return message.is_mine
    && otherLastReadMessageId !== null
    && message.id <= otherLastReadMessageId;
}

function latestReadReceiptMessageId(messages: ChatMessage[], otherLastReadMessageId: number | null): number | null {
  return messages
    .filter((message) => isReadByPeer(message, otherLastReadMessageId))
    .at(-1)?.id ?? null;
}

function latestMessageId(messages: ChatMessage[]): number | null {
  return messages.at(-1)?.id ?? null;
}

function maxMessageId(...ids: Array<number | null | undefined>): number | null {
  const validIds = ids.filter((id): id is number => typeof id === "number" && Number.isFinite(id));

  return validIds.length > 0 ? Math.max(...validIds) : null;
}

function notificationActorName(slot: SlotState, notification: NotificationInbox): string {
  if (notification.target_type === "chat" && notification.target_id) {
    const chat = slot.chats.find((item) => item.id === notification.target_id);

    if (chat?.other_user?.name) {
      return chat.other_user.name;
    }
  }

  if (typeof notification.payload?.sender_user_name === "string" && notification.payload.sender_user_name.trim()) {
    return notification.payload.sender_user_name;
  }

  return notification.title ?? notification.event_type;
}

function notificationDescription(notification: NotificationInbox): string {
  const countLabel = notification.additional_count > 0 ? ` / 외 ${notification.additional_count}` : "";

  return `${compactText(notification.body ?? notification.title ?? notification.event_type)}${countLabel}`;
}

function isFormControlClick(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && Boolean(target.closest("button,input,textarea,select,a"));
}

export default function ChatTestPageClient() {
  const [slots, setSlots] = useState<Record<SlotId, SlotState>>(initialSlots);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const echoRefs = useRef<Partial<Record<SlotId, Echo<"reverb">>>>({});
  const readInFlightRefs = useRef<Partial<Record<SlotId, string>>>({});
  const aToken = slots.a.token;
  const aUserId = slots.a.user?.id ?? null;
  const aActiveChatId = slots.a.activeChatId;
  const aIsChatOpen = slots.a.isChatOpen;
  const bToken = slots.b.token;
  const bUserId = slots.b.user?.id ?? null;
  const bActiveChatId = slots.b.activeChatId;
  const bIsChatOpen = slots.b.isChatOpen;

  function appendLog(message: string, slotId?: SlotId): void {
    const prefix = slotId ? `${slotId.toUpperCase()} ` : "";
    setLogs((current) => [`${prefix}${message}`, ...current].slice(0, 40));
  }

  function updateSlot(slotId: SlotId, patch: Partial<SlotState> | ((slot: SlotState) => Partial<SlotState>)): void {
    setSlots((current) => {
      const nextPatch = typeof patch === "function" ? patch(current[slotId]) : patch;

      return {
        ...current,
        [slotId]: {
          ...current[slotId],
          ...nextPatch,
        },
      };
    });
  }

  function upsertMessage(slotId: SlotId, message: ChatMessage): void {
    updateSlot(slotId, (slot) => {
      const messages = new Map(slot.messages.map((item) => [item.id, item]));
      messages.set(message.id, message);

      return {
        messages: Array.from(messages.values())
          .sort((left, right) => left.id - right.id)
          .slice(-visibleMessageCount),
      };
    });
  }

  async function request<TData, TMeta = unknown>(
    slotId: SlotId | null,
    path: string,
    options: RequestInit & { body?: BodyInit | null } = {},
  ): Promise<{ data: TData; meta: TMeta | null }> {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
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
    appendLog(`${options.method ?? "GET"} ${path}`, slotId ?? undefined);

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
      realtimeStatus: "Reverb 연결 준비",
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
        appendLog(message, slotId);
      }
    }

    echoRefs.current[slotId]?.disconnect();
    delete echoRefs.current[slotId];

    updateSlot(slotId, (slot) => ({
      token: "",
      user: null,
      chats: [],
      notifications: [],
      unreadCount: 0,
      unreadEventCount: 0,
      messageDraft: "",
      attachmentFiles: [],
      attachmentInputKey: slot.attachmentInputKey + 1,
      activeChatId: "",
      isChatOpen: false,
      draftChat: null,
      messages: [],
      otherLastReadMessageId: null,
      realtimeStatus: "로그인 전",
    }));
  }

  async function startDraftChat(slotId: SlotId): Promise<void> {
    const peer = peerSlot(slotId);

    if (!slots[slotId].user) {
      throw new Error(`${slotId.toUpperCase()} 로그인이 필요합니다.`);
    }

    if (!slots[peer].user) {
      throw new Error(`${peer.toUpperCase()} 로그인이 필요합니다.`);
    }

    updateSlot(slotId, (slot) => ({
      activeChatId: "",
      isChatOpen: true,
      draftChat: { peer },
      messages: [],
      messageDraft: "",
      attachmentFiles: [],
      attachmentInputKey: slot.attachmentInputKey + 1,
      otherLastReadMessageId: null,
    }));
    setStatusMessage(`${slotId.toUpperCase()} -> ${peer.toUpperCase()} 첫 메시지 작성 대기`);
    appendLog(`${slotId.toUpperCase()} -> ${peer.toUpperCase()} 첫 메시지 작성 대기: 서버 채팅방 없음`);
  }

  async function loadChats(slotId: SlotId): Promise<void> {
    if (!slots[slotId].token) {
      return;
    }

    const { data } = await request<ChatSummary[]>(slotId, "/chats?per_page=20");
    updateSlot(slotId, (slot) => {
      const activeChat = data.find((chat) => String(chat.id) === slot.activeChatId);

      return {
        chats: data,
        otherLastReadMessageId: activeChat
          ? maxMessageId(slot.otherLastReadMessageId, activeChat.other_last_read_message_id)
          : slot.otherLastReadMessageId,
      };
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

  async function loadMessages(
    slotId: SlotId,
    targetChatId = slots[slotId].activeChatId,
    chatSummary?: ChatSummary,
    markAsRead = true,
  ): Promise<void> {
    if (!targetChatId) {
      throw new Error("채팅방 ID가 필요합니다.");
    }

    const { data, meta } = await request<ChatMessage[], MessageListMeta>(
      slotId,
      `/chats/${targetChatId}/messages?per_page=50`,
    );
    const messages = normalizeMessages(data, meta).slice(-visibleMessageCount);
    const lastMessageId = latestMessageId(messages);

    updateSlot(slotId, (slot) => {
      const activeChat = chatSummary ?? slot.chats.find((chat) => String(chat.id) === targetChatId);

      return {
        activeChatId: targetChatId,
        isChatOpen: markAsRead ? true : slot.isChatOpen,
        draftChat: null,
        messages,
        otherLastReadMessageId: activeChat
          ? maxMessageId(slot.otherLastReadMessageId, activeChat.other_last_read_message_id)
          : slot.otherLastReadMessageId,
      };
    });

    if (markAsRead) {
      await markChatAsRead(slotId, targetChatId, lastMessageId);
      updateSlot(slotId, (slot) => ({
        chats: slot.chats.map((chat) => String(chat.id) === targetChatId
          ? {
              ...chat,
              unread_count: 0,
              last_read_message_id: maxMessageId(chat.last_read_message_id, lastMessageId),
            }
          : chat),
      }));
      await refreshSlot(slotId);
    }
  }

  async function openChat(slotId: SlotId, chat: ChatSummary): Promise<void> {
    const targetChatId = String(chat.id);
    const lastMessageId = chat.last_message?.id ?? null;

    updateSlot(slotId, (slot) => ({
      activeChatId: targetChatId,
      isChatOpen: true,
      draftChat: null,
      messages: [],
      messageDraft: "",
      attachmentFiles: [],
      attachmentInputKey: slot.attachmentInputKey + 1,
      otherLastReadMessageId: maxMessageId(slot.otherLastReadMessageId, chat.other_last_read_message_id),
      chats: slot.chats.map((item) => item.id === chat.id
        ? {
            ...item,
            unread_count: 0,
            last_read_message_id: maxMessageId(item.last_read_message_id, lastMessageId),
          }
        : item),
    }));

    await markChatAsRead(slotId, targetChatId, lastMessageId);
    appendLog(`채팅방 열기 읽음 처리 chat #${targetChatId} last #${lastMessageId ?? "-"}`, slotId);
    await loadMessages(slotId, targetChatId, chat, false);
    await Promise.all(slotIds.map((item) => refreshSlot(item)));
  }

  async function sendMessage(slotId: SlotId): Promise<void> {
    const slot = slots[slotId];
    const body = slot.messageDraft.trim();
    const files = slot.attachmentFiles;
    const messageType = messageTypeForFiles(files);

    if (!body && files.length === 0) {
      throw new Error("메시지나 파일을 입력하세요.");
    }

    if (!slot.isChatOpen) {
      throw new Error("채팅창을 먼저 여세요.");
    }

    let targetChatId = slot.activeChatId;

    if (targetChatId) {
      const { data } = await request<ChatMessage>(slotId, `/chats/${targetChatId}/messages`, {
        method: "POST",
        body: buildMessageRequestBody(messageType, body, files),
      });

      upsertMessage(slotId, data);
    } else if (slot.draftChat) {
      const peerUserId = slots[slot.draftChat.peer].user?.id;
      if (!peerUserId) {
        throw new Error(`${slot.draftChat.peer.toUpperCase()} 로그인이 필요합니다.`);
      }

      const { data } = await request<ChatMessage>(slotId, "/chats/messages", {
        method: "POST",
        body: buildMessageRequestBody(messageType, body, files, peerUserId),
      });

      targetChatId = String(data.chat_id);
      updateSlot(slotId, {
        activeChatId: targetChatId,
        isChatOpen: true,
        draftChat: null,
        otherLastReadMessageId: null,
      });
      upsertMessage(slotId, data);
    } else {
      throw new Error("상대를 선택하거나 채팅방 ID를 입력하세요.");
    }

    updateSlot(slotId, (slot) => ({
      messageDraft: "",
      attachmentFiles: [],
      attachmentInputKey: slot.attachmentInputKey + 1,
    }));
    await loadMessages(slotId, targetChatId);
    await Promise.all(slotIds.map((item) => refreshSlot(item)));
  }

  async function readChat(slotId: SlotId): Promise<void> {
    const slot = slots[slotId];
    const chatId = slot.activeChatId;
    if (!chatId) {
      throw new Error("채팅방 ID가 필요합니다.");
    }

    if (!slot.isChatOpen) {
      throw new Error("채팅창을 열어야 읽음 처리할 수 있습니다.");
    }

    await markChatAsRead(slotId, chatId, latestMessageId(slot.messages));
    await refreshSlot(slotId);
  }

  async function markChatAsRead(slotId: SlotId, chatId: string, lastReadMessageId?: number | null): Promise<void> {
    await request<ChatSummary>(slotId, `/chats/${chatId}/read`, {
      method: "POST",
      body: JSON.stringify(lastReadMessageId ? { last_read_message_id: lastReadMessageId } : {}),
    });
  }

  async function readOpenChatOnInteraction(slotId: SlotId): Promise<void> {
    const slot = slots[slotId];
    const chatId = slot.activeChatId;

    if (!chatId || !slot.isChatOpen) {
      return;
    }

    if (readInFlightRefs.current[slotId] === chatId) {
      return;
    }

    readInFlightRefs.current[slotId] = chatId;

    try {
      const activeChat = slot.chats.find((chat) => String(chat.id) === chatId);
      const lastReadMessageId = latestMessageId(slot.messages) ?? activeChat?.last_message?.id ?? null;

      await markChatAsRead(slotId, chatId, lastReadMessageId);
      updateSlot(slotId, (currentSlot) => ({
        chats: currentSlot.chats.map((chat) => String(chat.id) === chatId
          ? {
              ...chat,
              unread_count: 0,
              last_read_message_id: maxMessageId(chat.last_read_message_id, lastReadMessageId),
            }
          : chat),
      }));
      await Promise.all(slotIds.map((item) => refreshSlot(item)));
    } finally {
      if (readInFlightRefs.current[slotId] === chatId) {
        delete readInFlightRefs.current[slotId];
      }
    }
  }

  async function readOrOpenChatOnWindowClick(slotId: SlotId): Promise<void> {
    const slot = slots[slotId];

    if (!slot.activeChatId) {
      return;
    }

    if (!slot.isChatOpen) {
      await loadMessages(slotId, slot.activeChatId);
      return;
    }

    await readOpenChatOnInteraction(slotId);
  }

  async function deleteChat(slotId: SlotId): Promise<void> {
    const chatId = slots[slotId].activeChatId;
    if (!chatId) {
      throw new Error("채팅방 ID가 필요합니다.");
    }

    await request<ChatSummary>(slotId, `/chats/${chatId}`, {
      method: "DELETE",
    });

    updateSlot(slotId, (slot) => ({
      activeChatId: "",
      isChatOpen: false,
      draftChat: null,
      messageDraft: "",
      attachmentFiles: [],
      attachmentInputKey: slot.attachmentInputKey + 1,
      messages: [],
      otherLastReadMessageId: null,
      realtimeStatus: slots[slotId].token ? "채팅창 닫힘" : "로그인 전",
    }));

    await Promise.all(slotIds.map((item) => refreshSlot(item)));
  }

  function closeChatWindow(slotId: SlotId): void {
    updateSlot(slotId, (slot) => ({
      activeChatId: "",
      isChatOpen: false,
      draftChat: null,
      messageDraft: "",
      attachmentFiles: [],
      attachmentInputKey: slot.attachmentInputKey + 1,
      messages: [],
      otherLastReadMessageId: null,
      realtimeStatus: slots[slotId].token ? "채팅창 닫힘" : "로그인 전",
    }));
  }

  async function readNotification(slotId: SlotId, notificationId: number): Promise<void> {
    await request<NotificationInbox>(slotId, `/notifications/${notificationId}/read`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadNotifications(slotId);
  }

  async function openNotification(slotId: SlotId, notification: NotificationInbox): Promise<void> {
    if (notification.target_type === "chat" && notification.target_id) {
      const chat = slots[slotId].chats.find((item) => item.id === notification.target_id);

      if (chat) {
        await openChat(slotId, chat);
      } else {
        await loadMessages(slotId, String(notification.target_id));
      }
    }

    if (!notification.is_read) {
      await readNotification(slotId, notification.id);
    }
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

  const handleChatMessage = useEffectEvent((slotId: SlotId, payload: BroadcastMessagePayload) => {
    const userId = slots[slotId].user?.id;
    if (!userId) {
      return;
    }

    const message = messageFromBroadcast(payload, userId);
    if (!message) {
      appendLog("실시간 메시지 payload 파싱 실패", slotId);
      return;
    }

    if (String(message.chat_id) === slots[slotId].activeChatId && slots[slotId].isChatOpen) {
      upsertMessage(slotId, message);

      if (Number(message.sender_user_id) !== Number(userId)) {
        void readChat(slotId);
      }
    }

    appendLog(`실시간 메시지 #${message.id}`, slotId);
    void refreshSlot(slotId);
  });

  const handleReadStatus = useEffectEvent((slotId: SlotId, payload: ReadStatusPayload) => {
    const currentUserId = slots[slotId].user?.id;

    if (
      currentUserId
      && Number(payload.reader_user_id) !== Number(currentUserId)
      && String(payload.chat_id) === slots[slotId].activeChatId
      && slots[slotId].isChatOpen
    ) {
      updateSlot(slotId, (slot) => ({
        otherLastReadMessageId: maxMessageId(slot.otherLastReadMessageId, payload.last_read_message_id),
      }));
    }

    appendLog(
      `읽음 이벤트 chat #${payload.chat_id} reader #${payload.reader_user_id} last #${payload.last_read_message_id ?? "-"}`,
      slotId,
    );
    void refreshSlot(slotId);
  });

  const handleNotification = useEffectEvent((slotId: SlotId, payload: NotificationPayload) => {
    const notification = payload.notification;

    appendLog(`알림 이벤트 #${notification?.id ?? "-"}`, slotId);
    void refreshSlot(slotId);
  });

  useEffect(() => {
    const connected: Partial<Record<SlotId, Echo<"reverb">>> = {};

    for (const slotId of slotIds) {
      echoRefs.current[slotId]?.disconnect();
      delete echoRefs.current[slotId];
    }

    const authSlots: Record<SlotId, { token: string; userId: number | string | null }> = {
      a: { token: aToken, userId: aUserId },
      b: { token: bToken, userId: bUserId },
    };

    for (const slotId of slotIds) {
      const slot = authSlots[slotId];

      if (!slot.token || !slot.userId) {
        updateSlot(slotId, { realtimeStatus: "로그인 전" });
        continue;
      }

      const echo = new Echo({
        broadcaster: "reverb",
        key: reverbKey,
        Pusher,
        wsHost: reverbHost,
        wsPort: reverbPort,
        wssPort: reverbPort,
        forceTLS: reverbScheme === "https",
        enabledTransports: reverbScheme === "https" ? ["wss"] : ["ws"],
        authEndpoint: "/broadcasting/auth",
        auth: {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${slot.token}`,
          },
        },
      });

      echoRefs.current[slotId] = echo;
      connected[slotId] = echo;
      updateSlot(slotId, { realtimeStatus: "Reverb 연결 시도" });

      echo.private(`user.${slot.userId}`)
        .subscribed(() => updateSlot(slotId, { realtimeStatus: "개인 알림 채널 연결" }))
        .error((error: unknown) => {
          updateSlot(slotId, { realtimeStatus: "개인 알림 채널 오류" });
          appendLog(`개인 알림 채널 오류 ${JSON.stringify(error)}`, slotId);
        })
        .listen(".notification.inbox.updated", (payload: NotificationPayload) => handleNotification(slotId, payload));
    }

    return () => {
      for (const echo of Object.values(connected)) {
        echo?.disconnect();
      }
    };
  }, [aToken, aUserId, bToken, bUserId]);

  useEffect(() => {
    const echo = echoRefs.current.a;
    const chatId = aActiveChatId;

    if (!echo || !chatId || !aIsChatOpen) {
      return;
    }

    const channel = `chat.${chatId}`;
    echo.private(channel)
      .subscribed(() => {
        updateSlot("a", {
          realtimeStatus: `채팅 #${chatId} 실시간 연결`,
        });
        appendLog(`채팅 #${chatId} 실시간 연결`, "a");
      })
      .error((error: unknown) => {
        updateSlot("a", { realtimeStatus: `채팅 #${chatId} 실시간 오류` });
        appendLog(`채팅 #${chatId} 실시간 오류 ${JSON.stringify(error)}`, "a");
      })
      .listen(".chat.message.created", (payload: BroadcastMessagePayload) => handleChatMessage("a", payload))
      .listen(".chat.read.updated", (payload: ReadStatusPayload) => handleReadStatus("a", payload));

    return () => {
      echo.leave(channel);
    };
  }, [aActiveChatId, aIsChatOpen, aToken]);

  useEffect(() => {
    const echo = echoRefs.current.b;
    const chatId = bActiveChatId;

    if (!echo || !chatId || !bIsChatOpen) {
      return;
    }

    const channel = `chat.${chatId}`;
    echo.private(channel)
      .subscribed(() => {
        updateSlot("b", {
          realtimeStatus: `채팅 #${chatId} 실시간 연결`,
        });
        appendLog(`채팅 #${chatId} 실시간 연결`, "b");
      })
      .error((error: unknown) => {
        updateSlot("b", { realtimeStatus: `채팅 #${chatId} 실시간 오류` });
        appendLog(`채팅 #${chatId} 실시간 오류 ${JSON.stringify(error)}`, "b");
      })
      .listen(".chat.message.created", (payload: BroadcastMessagePayload) => handleChatMessage("b", payload))
      .listen(".chat.read.updated", (payload: ReadStatusPayload) => handleReadStatus("b", payload));

    return () => {
      echo.leave(channel);
    };
  }, [bActiveChatId, bIsChatOpen, bToken]);

  function renderChatList(slotId: SlotId) {
    const slot = slots[slotId];
    const visibleChats = slot.chats.slice(0, visibleChatCount);

    if (visibleChats.length === 0) {
      return <p className="empty-line">채팅방 없음</p>;
    }

    return (
      <ul className="compact-list">
        {visibleChats.map((chat) => (
          <li key={`${slotId}-chat-${chat.id}`}>
            <button
              type="button"
              className={`list-row-button ${slot.isChatOpen && String(chat.id) === slot.activeChatId ? "active-row" : ""}`}
              onClick={() => run(() => openChat(slotId, chat))}
            >
              <span>#{chat.id}</span>
              <span>
                {chat.other_user ? chat.other_user.name : "상대 없음"} / 안읽음 {chat.unread_count} /{" "}
                {messageLabel(chat.last_message)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  function renderNotifications(slotId: SlotId) {
    const slot = slots[slotId];
    const visibleNotifications = slot.notifications.slice(0, visibleNotificationCount);

    if (visibleNotifications.length === 0) {
      return <p className="empty-line">알림 없음</p>;
    }

    return (
      <ul className="compact-list notification-list">
        {visibleNotifications.map((notification) => (
          <li key={`${slotId}-notification-${notification.id}`}>
            <button
              type="button"
              className={`list-row-button ${notification.is_read ? "" : "unread-row"}`}
              onClick={() => run(() => openNotification(slotId, notification))}
            >
              <span>{notificationActorName(slot, notification)}</span>
              <span>{notificationDescription(notification)}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  function renderMessageContent(message: ChatMessage) {
    const attachments = message.attachments ?? [];

    return (
      <>
        {message.body ? <span>{compactText(message.body, message.message_type)}</span> : null}
        {attachments.length > 0 ? (
          <div className="attachment-list">
            {attachments.map((attachment) => {
              const name = attachmentName(attachment);
              const size = formatBytes(attachment.size);

              if (attachment.mime_type?.startsWith("image/")) {
                return (
                  <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="attachment-image" src={attachment.url} alt={name} />
                  </a>
                );
              }

              return (
                <a
                  key={attachment.id}
                  className="attachment-file"
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {name}{size ? ` / ${size}` : ""}
                </a>
              );
            })}
          </div>
        ) : null}
        {!message.body && attachments.length === 0 ? <span>{message.message_type}</span> : null}
      </>
    );
  }

  function renderMessages(slotId: SlotId) {
    const slot = slots[slotId];
    const readReceiptMessageId = latestReadReceiptMessageId(slot.messages, slot.otherLastReadMessageId);

    if (!slot.isChatOpen) {
      return <p className="empty-line">채팅창 닫힘: 채팅방 클릭/조회/작성 시 열림</p>;
    }

    if (slot.messages.length === 0) {
      return <p className="empty-line">메시지 없음</p>;
    }

    return (
      <ol className="message-list">
        {slot.messages.map((message) => {
          const peerRead = message.id === readReceiptMessageId;

          return (
            <li
              key={`${slotId}-message-${message.id}`}
              className={`message-item ${message.is_mine ? "message-item-mine" : "message-item-other"}`}
            >
              <div className="message-bubble">
                <span className="message-meta">
                  #{message.id} {message.is_mine ? "나" : message.sender?.name ?? message.sender_user_id}
                </span>
                {renderMessageContent(message)}
              </div>
              {peerRead ? <span className="read-receipt">읽음</span> : null}
            </li>
          );
        })}
      </ol>
    );
  }

  function renderAccountScreen(slotId: SlotId) {
    const slot = slots[slotId];
    const peer = peerSlot(slotId);
    const canUseChat = slot.isChatOpen && Boolean(slot.activeChatId || slot.draftChat);
    const hasOpenChat = slot.isChatOpen && Boolean(slot.activeChatId);
    const shouldRenderChatWindow = slot.isChatOpen || slot.draftChat;
    const chatStateLabel = slot.draftChat
      ? `${slotId.toUpperCase()} -> ${slot.draftChat.peer.toUpperCase()} 첫 메시지 전 / 열림`
      : slot.activeChatId
        ? `${slot.isChatOpen ? "열림" : "닫힘"} #${slot.activeChatId}`
        : "선택 없음 / 닫힘";

    return (
      <section className="account-screen">
        <header className="account-head">
          <div>
            <h2>{slotId.toUpperCase()} 화면</h2>
            <p className="muted-line">
              {slot.user ? `${slot.user.id} / ${slot.user.name} / ${slot.user.email}` : "로그인 안됨"}
            </p>
            <p className="muted-line">실시간: {slot.realtimeStatus}</p>
          </div>
          <div className="button-row">
            <button type="button" onClick={() => run(() => refreshSlot(slotId))}>동기화</button>
            <button type="button" onClick={() => run(() => startDraftChat(slotId))}>
              {slotId.toUpperCase()}-&gt;{peer.toUpperCase()} 작성
            </button>
          </div>
        </header>

        <section className="panel-section login-section">
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
          </div>
        </section>

        <section className="panel-section list-section">
          <div className="section-head">
            <h3>채팅방</h3>
            <span className="muted-line">{chatStateLabel}</span>
          </div>
          <div className="field-row compact-field">
            <label htmlFor={`${slotId}-chat-id`}>Chat</label>
            <input
              id={`${slotId}-chat-id`}
              type="number"
              min="1"
              value={slot.activeChatId}
              onChange={(event) => {
                const nextChatId = event.target.value;

                updateSlot(slotId, (slot) => ({
                  activeChatId: nextChatId,
                  isChatOpen: false,
                  draftChat: null,
                  messageDraft: "",
                  attachmentFiles: [],
                  attachmentInputKey: slot.attachmentInputKey + 1,
                  messages: [],
                  otherLastReadMessageId: nextChatId ? slot.otherLastReadMessageId : null,
                  realtimeStatus: slot.token ? "채팅창 닫힘" : "로그인 전",
                }));
              }}
            />
          </div>
          {renderChatList(slotId)}
        </section>

        <section className="panel-section notification-section">
          <div className="section-head">
            <h3>알림</h3>
            <button type="button" onClick={() => run(() => readAllNotifications(slotId))}>전체읽음</button>
          </div>
          <p className="muted-line">
            unread rows {slot.unreadCount}, events {slot.unreadEventCount}
          </p>
          {renderNotifications(slotId)}
        </section>

        <section
          className="panel-section chat-window"
          onClick={(event) => {
            if (!isFormControlClick(event.target)) {
              run(() => readOrOpenChatOnWindowClick(slotId));
            }
          }}
        >
          {shouldRenderChatWindow ? (
            <>
              <div className="section-head">
                <h3>채팅창</h3>
                <div className="button-row">
                  <button type="button" disabled={!slot.activeChatId} onClick={() => run(() => loadMessages(slotId))}>
                    조회
                  </button>
                  <button type="button" disabled={!hasOpenChat} onClick={() => run(() => readChat(slotId))}>읽음</button>
                  <button type="button" disabled={!hasOpenChat} onClick={() => run(() => deleteChat(slotId))}>삭제</button>
                  <button type="button" disabled={!slot.isChatOpen} onClick={() => closeChatWindow(slotId)}>닫기</button>
                </div>
              </div>
              <div
                className="message-scroll"
                role="button"
                tabIndex={0}
                onFocus={() => run(() => readOpenChatOnInteraction(slotId))}
              >
                {renderMessages(slotId)}
              </div>
              <textarea
                rows={2}
                disabled={!canUseChat}
                value={slot.messageDraft}
                onChange={(event) => updateSlot(slotId, { messageDraft: event.target.value })}
                onFocus={() => run(() => readOpenChatOnInteraction(slotId))}
                placeholder={slot.draftChat ? "첫 메시지를 보내면 채팅방 생성" : "채팅방을 열고 메시지 입력"}
              />
              <div className="field-row attachment-field">
                <label htmlFor={`${slotId}-attachments`}>첨부</label>
                <input
                  key={`${slotId}-attachments-${slot.attachmentInputKey}`}
                  id={`${slotId}-attachments`}
                  type="file"
                  multiple
                  disabled={!canUseChat}
                  onChange={(event) => updateSlot(slotId, { attachmentFiles: Array.from(event.target.files ?? []) })}
                  onFocus={() => run(() => readOpenChatOnInteraction(slotId))}
                />
              </div>
              {slot.attachmentFiles.length > 0 ? (
                <p className="muted-line attachment-selected">{selectedFilesLabel(slot.attachmentFiles)}</p>
              ) : null}
              <div className="button-row">
                <button type="button" disabled={!canUseChat} onClick={() => run(() => sendMessage(slotId))}>전송</button>
              </div>
            </>
          ) : null}
        </section>
      </section>
    );
  }

  return (
    <main className="chat-test">
      <header className="topbar">
        <div>
          <h1>User Web 채팅/알림 테스트</h1>
          <p>API {apiBase} / Reverb {reverbScheme}://{reverbHost}:{reverbPort}</p>
        </div>
        <p>상태: {statusMessage || "-"}</p>
      </header>

      <div className="split-workspace">
        {renderAccountScreen("a")}
        {renderAccountScreen("b")}
      </div>

      <section className="log-panel">
        <h2>로그</h2>
        <pre>{logs.length > 0 ? logs.join("\n") : "로그 없음"}</pre>
      </section>
    </main>
  );
}
