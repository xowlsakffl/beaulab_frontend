import { api } from "@/lib/common/api";
import { tokenStorage, sessionStorage } from "@beaulab/auth";
import type { ActorAuthorization, StaffProfile, StaffSession } from "@beaulab/types";
import { isApiSuccess } from "@beaulab/types";
import { invalidateListDataCache } from "@/lib/common/list-data-cache";
import { clearNavigationBadgesCache, fetchNavigationBadges } from "@/lib/common/navigation-badges";

type LoginPayload = { nickname: string; password: string; keep_logged_in?: boolean };
type AuthFields = {
  auth?: Partial<ActorAuthorization>;
  roles?: string[];
  permissions?: string[];
};

type LoginResponse = {
  token: string;
  profile?: StaffProfile;
  staff?: StaffProfile;
} & AuthFields;

type StaffProfileResponse = {
  profile: StaffProfile;
} & AuthFields;

function resolveAuth(data: AuthFields): Partial<ActorAuthorization> | undefined {
  if (data.auth) return data.auth;

  const hasAuthFields = Array.isArray(data.roles) || Array.isArray(data.permissions);

  if (!hasAuthFields) return undefined;

  return {
    roles: data.roles ?? [],
    permissions: data.permissions ?? [],
  };
}

export async function login(payload: LoginPayload): Promise<StaffSession> {
  const persistent = Boolean(payload.keep_logged_in);
  const res = await api.post<LoginResponse>("/auth/login", payload, undefined, {
    skipUnauthorizedHandler: true,
  });

  if (!isApiSuccess(res)) throw res;

  tokenStorage.set("staff", res.data.token, { persistent });

  const profile = res.data.profile ?? res.data.staff;

  if (profile) {
    const session: StaffSession = {
      actor: "staff",
      profile,
      auth: resolveAuth(res.data),
    };

    sessionStorage.set("staff", session, { persistent });
    void fetchNavigationBadges(profile.id);
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

  sessionStorage.set("staff", session, { persistent: tokenStorage.isPersistent("staff") });
  return session;
}

export function getSession(): StaffSession | null {
  return sessionStorage.get("staff") as StaffSession | null;
}

export async function ensureSession(): Promise<StaffSession | null> {
  const token = tokenStorage.get("staff");
  if (!token) {
    sessionStorage.clear("staff");
    return null;
  }

  const cached = getSession();
  if (cached) return cached;

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
  clearNavigationBadgesCache();
  invalidateListDataCache();
}
