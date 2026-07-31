import { api } from "@/lib/common/api";
import { isApiSuccess } from "@beaulab/types";

export type NavigationBadge = {
  count?: number | null;
  has_new?: boolean | null;
};

export type NavigationBadgesApiResponse = {
  badges?: Record<string, NavigationBadge> | null;
};

export type NavigationBadgeMap = Record<string, NavigationBadge>;

type NavigationBadgeCache = {
  staffId: string;
  badges: NavigationBadgeMap;
  cachedAt: number;
};

const CACHE_KEY = "staff:navigation-badges";
const CACHE_FRESH_MS = 10_000;

let memoryCache: NavigationBadgeCache | null = null;
let requestInFlight: Promise<NavigationBadgeMap> | null = null;

export function normalizeNavigationBadges(response: NavigationBadgesApiResponse): NavigationBadgeMap {
  return response.badges ?? {};
}

export function getCachedNavigationBadges(staffId: number | string): NavigationBadgeMap {
  return readCache(String(staffId))?.badges ?? {};
}

export async function fetchNavigationBadges(
  staffId: number | string,
  options: { force?: boolean } = {},
): Promise<NavigationBadgeMap> {
  const normalizedStaffId = String(staffId);
  const cached = readCache(normalizedStaffId);

  if (!options.force && cached && Date.now() - cached.cachedAt < CACHE_FRESH_MS) {
    return cached.badges;
  }

  if (requestInFlight) return requestInFlight;

  requestInFlight = api
    .get<NavigationBadgesApiResponse>("/navigation-badges")
    .then((response) => {
      if (!isApiSuccess(response)) return cached?.badges ?? {};

      const badges = normalizeNavigationBadges(response.data);
      writeCache(normalizedStaffId, badges);

      return badges;
    })
    .catch(() => cached?.badges ?? {})
    .finally(() => {
      requestInFlight = null;
    });

  return requestInFlight;
}

export function clearNavigationBadgesCache() {
  memoryCache = null;
  requestInFlight = null;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CACHE_KEY);
  }
}

function readCache(staffId: string): NavigationBadgeCache | null {
  if (memoryCache?.staffId === staffId) return memoryCache;
  if (typeof window === "undefined") return null;

  const serialized = window.sessionStorage.getItem(CACHE_KEY);
  if (!serialized) return null;

  try {
    const parsed = JSON.parse(serialized) as NavigationBadgeCache;

    if (parsed.staffId !== staffId || !parsed.badges || typeof parsed.cachedAt !== "number") {
      return null;
    }

    memoryCache = parsed;
    return parsed;
  } catch {
    window.sessionStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function writeCache(staffId: string, badges: NavigationBadgeMap) {
  const cache: NavigationBadgeCache = {
    staffId,
    badges,
    cachedAt: Date.now(),
  };

  memoryCache = cache;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
}
