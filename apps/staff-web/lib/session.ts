import { api } from "./api";
import { tokenStorage, sessionStorage } from "@beaulab/auth";
import type { ActorAuthorization, StaffProfile, StaffSession } from "@beaulab/types";
import { isApiSuccess } from "@beaulab/types";


type LoginPayload = { nickname: string; password: string };
type LoginResponse = { token: string };
type StaffProfileResponse = {
  profile: StaffProfile;
  auth?: Partial<ActorAuthorization>;
};

export async function login(payload: LoginPayload): Promise<StaffSession> {
  const res = await api.post<LoginResponse>("/auth/login", payload);

  if (!isApiSuccess(res)) throw res;

  tokenStorage.set("staff", res.data.token);

  return restoreSession();
}

export async function restoreSession(): Promise<StaffSession> {
  const me = await api.get<StaffProfileResponse>("/profile");

  if (!isApiSuccess(me)) throw me;

  const session: StaffSession = {
    actor: "staff",
    profile: me.data.profile,
    auth: me.data.auth,
  };

  sessionStorage.set("staff", session);
  return session;
}

export function getSession(): StaffSession | null {
  return sessionStorage.get("staff") as StaffSession | null;
}

export function logout() {
  tokenStorage.clear("staff");
  sessionStorage.clear("staff");
}
