export type NavigationBadge = {
  count?: number | null;
  has_new?: boolean | null;
};

export type NavigationBadgesApiResponse = {
  badges?: Record<string, NavigationBadge> | null;
};

export type NavigationBadgeMap = Record<string, NavigationBadge>;

export function normalizeNavigationBadges(response: NavigationBadgesApiResponse): NavigationBadgeMap {
  return response.badges ?? {};
}
