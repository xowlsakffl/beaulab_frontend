import {
  broadcastAuthChange,
  clearLegacyAuthStorage,
  getSessionTiming,
  sessionStorage,
  setSessionTiming,
  subscribeAuthChange,
  type SessionTiming,
} from "@beaulab/auth";
import type { ActorAuthorization, ActorSessionMap, ActorType } from "@beaulab/types";
import type { createClient } from "./client";

type Client = ReturnType<typeof createClient>;
type ProfileResponse<A extends ActorType> = {
  profile: ActorSessionMap[A]["profile"];
  roles?: string[];
  permissions?: string[];
  auth?: Partial<ActorAuthorization>;
};

export function createWebSession<A extends ActorType>(client: Client, actor: A) {
  let pending: Promise<ActorSessionMap[A] | null> | null = null;
  function save(data: ProfileResponse<A>): ActorSessionMap[A] {
    const session = {
      actor,
      profile: data.profile,
      auth: data.auth ?? { roles: data.roles ?? [], permissions: data.permissions ?? [] },
    } as ActorSessionMap[A];
    sessionStorage.set(actor, session);
    return session;
  }
  async function restore(): Promise<ActorSessionMap[A] | null> {
    const response = await client.rawWithResponse<ProfileResponse<A>>("/profile", { skipUnauthorizedHandler: true });
    if (response.response.status === 401) {
      sessionStorage.clear(actor);
      return null;
    }
    if (!response.payload.success || !response.payload.data) throw response.payload;
    return save(response.payload.data);
  }
  return {
    get: () => sessionStorage.get(actor),
    async ensure(): Promise<ActorSessionMap[A] | null> {
      clearLegacyAuthStorage(actor);
      const cached = sessionStorage.get(actor);
      if (cached) return cached;
      pending ??= restore().finally(() => {
        pending = null;
      });
      return pending;
    },
    async login(credentials: { nickname?: string; email?: string; password: string }): Promise<ActorSessionMap[A]> {
      type LoginResponse = Partial<Record<A, ActorSessionMap[A]["profile"]>> &
        Omit<ProfileResponse<A>, "profile"> & { session: SessionTiming };
      const response = await client.post<LoginResponse>("/auth/login", credentials, undefined, {
        skipUnauthorizedHandler: true,
      });
      if (!response.success || !response.data) throw response;
      const profile = response.data[actor];
      if (!profile) throw new Error("계정 정보를 확인하지 못했습니다.");
      sessionStorage.clear(actor);
      setSessionTiming(actor, response.data.session);
      const session = save({ ...response.data, profile });
      broadcastAuthChange(actor);
      return session;
    },
    async logout(): Promise<void> {
      const response = await client.rawWithResponse("/auth/logout", { method: "POST", skipUnauthorizedHandler: true });
      if (!response.payload.success && response.response.status !== 401) {
        if (response.response.status !== 419) throw response.payload;
        const status = await client.rawWithResponse("/auth/session", { skipUnauthorizedHandler: true });
        if (status.response.status !== 401) throw response.payload;
      }
      sessionStorage.clear(actor);
      broadcastAuthChange(actor);
    },
  };
}

export function monitorWebSession(
  client: Client,
  actor: ActorType,
  callbacks: {
    onExpired: () => void;
    onChanged: () => void;
    onWarning?: (seconds: number) => void;
    onError?: (error: unknown) => void;
  },
): () => void {
  let lastActivitySent = 0;
  let lastVerification = 0;
  let checking = false;
  let disposed = false;
  const verify = async (activity: boolean) => {
    if (checking || disposed) return;
    checking = true;
    try {
      const result = await client.rawWithResponse("/auth/" + (activity ? "activity" : "session"), {
        method: activity ? "POST" : "GET",
        skipUnauthorizedHandler: true,
      });
      if (disposed) return;
      if (result.response.status === 401) {
        sessionStorage.clear(actor);
        callbacks.onExpired();
      } else if (!result.payload.success) callbacks.onError?.(result.payload);
    } catch (error) {
      if (!disposed) callbacks.onError?.(error);
    } finally {
      checking = false;
    }
  };
  const activity = (event: Event) => {
    if (!event.isTrusted || document.visibilityState !== "visible") return;
    if (Date.now() - lastActivitySent < 60_000) return;
    lastActivitySent = Date.now();
    void verify(true);
  };
  const check = () => {
    const timing = getSessionTiming(actor);
    if (!timing) return;
    const remaining = Math.ceil(Math.min(timing.expires_at, timing.idle_expires_at) - Date.now() / 1000);
    callbacks.onWarning?.(remaining > 0 && remaining <= 120 ? remaining : 0);
    if (remaining <= 0 && Date.now() - lastVerification > 30_000) {
      lastVerification = Date.now();
      void verify(false);
    }
  };
  const focus = () => {
    void verify(false);
  };
  for (const event of ["pointerdown", "keydown", "input", "scroll"])
    document.addEventListener(event, activity, { capture: true, passive: true });
  window.addEventListener("focus", focus);
  const unsubscribe = subscribeAuthChange(actor, callbacks.onChanged);
  const interval = window.setInterval(check, 5_000);
  return () => {
    disposed = true;
    clearInterval(interval);
    unsubscribe();
    window.removeEventListener("focus", focus);
    for (const event of ["pointerdown", "keydown", "input", "scroll"])
      document.removeEventListener(event, activity, true);
  };
}
