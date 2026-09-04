import { createWebSession } from "@beaulab/api-client";
import { sessionStorage } from "@beaulab/auth";
import { api } from "@/lib/common/api";
import { invalidateListDataCache } from "@/lib/common/list-data-cache";
import { clearNavigationBadgesCache, fetchNavigationBadges } from "@/lib/common/navigation-badges";

const staffSession = createWebSession(api, "staff");

export async function login(payload: { nickname: string; password: string }) {
  const session = await staffSession.login(payload);
  clearNavigationBadgesCache();
  invalidateListDataCache();
  void fetchNavigationBadges(session.profile.id);
  return session;
}

export const getSession = staffSession.get;
export const ensureSession = staffSession.ensure;

export function clearLocalSession() {
  sessionStorage.clear("staff");
  clearNavigationBadgesCache();
  invalidateListDataCache();
}

export async function logout(): Promise<void> {
  await staffSession.logout();
  clearLocalSession();
}
