import { api } from "@/lib/common/api";
import { tokenStorage, sessionStorage } from "@beaulab/auth";
import type { ActorAuthorization, StaffProfile, StaffSession } from "@beaulab/types";
import { isApiSuccess } from "@beaulab/types";


type LoginPayload = { nickname: string; password: string };
type AuthFields = {
  auth?: Partial<ActorAuthorization>;
  roles?: string[];
  permissions?: string[];
};

type LoginResponse = {
  token: string;
  profile?: StaffProfile;
} & AuthFields;

type StaffProfileResponse = {
  profile: StaffProfile;
} & AuthFields;

function resolveAuth(data: AuthFields): Partial<ActorAuthorization> | undefined {
  if (data.auth) return data.auth;

  const hasAuthFields =
      Array.isArray(data.roles) ||
      Array.isArray(data.permissions)

  if (!hasAuthFields) return undefined;

  return {
    roles: data.roles ?? [],
    permissions: data.permissions ?? [],
  };
}

export async function login(payload: LoginPayload): Promise<StaffSession> {
  const res = await api.post<LoginResponse>("/auth/login", payload);

  if (!isApiSuccess(res)) throw res;

  tokenStorage.set("staff", res.data.token);

  if (res.data.profile) {
    const session: StaffSession = {
      actor: "staff",
      profile: res.data.profile,
      auth: resolveAuth(res.data),
    };

    sessionStorage.set("staff", session);
    return session;
  }

  return restoreSession();
}

export async function restoreSession(): Promise<StaffSession> {
  const me = await api.get<StaffProfileResponse>("/profile");

  if (!isApiSuccess(me)) throw me;

  const session: StaffSession = {
    actor: "staff",
    profile: me.data.profile,
    auth: resolveAuth(me.data),
  };

  sessionStorage.set("staff", session);
  return session;
}

export function getSession(): StaffSession | null {
  return sessionStorage.get("staff") as StaffSession | null;
}

export async function ensureSession(): Promise<StaffSession | null> {
  const cached = getSession();
  if (cached) return cached;

  const token = tokenStorage.get("staff");
  if (!token) return null;

  try {
    return await restoreSession();
  } catch {
    logout();
    return null;
  }
}


export function logout() {
  tokenStorage.clear("staff");
  sessionStorage.clear("staff");
}
