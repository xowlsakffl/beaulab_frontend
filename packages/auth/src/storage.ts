import type { ActorSessionMap, ActorType } from "@beaulab/types";

export type SessionTiming = { expires_at: number; idle_expires_at: number };
const sessions = new Map<ActorType, ActorSessionMap[ActorType]>();
const timings = new Map<ActorType, SessionTiming>();

export function clearLegacyAuthStorage(actor: ActorType): void {
  if (typeof window === "undefined") return;
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.removeItem(`beaulab.token.${actor}`);
      storage.removeItem(`beaulab.session.${actor}`);
    }
  } catch {
    // Cookie authentication also works when browser storage is disabled.
  }
}

export const sessionStorage = {
  get<TActor extends ActorType>(actor: TActor): ActorSessionMap[TActor] | null {
    if (typeof window === "undefined") return null;
    return (sessions.get(actor) as ActorSessionMap[TActor] | undefined) ?? null;
  },
  set<TActor extends ActorType>(actor: TActor, session: ActorSessionMap[TActor]): void {
    if (typeof window === "undefined") return;
    clearLegacyAuthStorage(actor);
    sessions.set(actor, session);
  },
  clear(actor: ActorType): void {
    clearLegacyAuthStorage(actor);
    sessions.delete(actor);
    timings.delete(actor);
  },
};

export function setSessionTiming(actor: ActorType, timing: SessionTiming): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(timing.expires_at) || !Number.isFinite(timing.idle_expires_at)) return;
  timings.set(actor, timing);
}

export function getSessionTiming(actor: ActorType): SessionTiming | null {
  return timings.get(actor) ?? null;
}

export function broadcastAuthChange(actor: ActorType): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(`beaulab.auth.${actor}`);
  channel.postMessage("changed");
  channel.close();
}

export function subscribeAuthChange(actor: ActorType, onChange: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(`beaulab.auth.${actor}`);
  channel.onmessage = () => {
    sessionStorage.clear(actor);
    onChange();
  };
  return () => channel.close();
}
