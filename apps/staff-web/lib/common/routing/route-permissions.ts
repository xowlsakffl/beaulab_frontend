export type RoutePermissionRule = {
  path: string;
  requiredPermissions: string[];
};

export const STATIC_ADMIN_ROUTE_PERMISSIONS = {
  "/": ["common.dashboard.show"],
  "/profile": ["common.profile.show"],
  "/hospitals": ["beaulab.hospital.show"],
  "/doctors": ["beaulab.doctor.show"],
  "/videos": ["beaulab.video.show"],
  "/notices": ["beaulab.notice.show"],
  "/beauty-dashboard": ["common.dashboard.show"],
  "/beauties": ["beaulab.beauty.show"],
  "/experts": ["beaulab.expert.show"],
  "/wallet/deposits": ["common.access"],
  "/wallet/history": ["common.access"],
  "/customer-db/events": ["common.access"],
  "/customer-db/remote-consultations": ["common.access"],
  "/customer-db/real-models": ["common.access"],
  "/ads/events": ["common.access"],
  "/ads/products": ["common.access"],
  "/ads/calendar": ["common.access"],
  "/posts/surgery-reviews": ["common.access"],
  "/posts/hospital-reviews": ["common.access"],
  "/posts/talks": ["common.access"],
  "/reported-content/surgery-reviews": ["common.access"],
  "/reported-content/hospital-reviews": ["common.access"],
  "/reported-content/talks": ["common.access"],
  "/beauty-wallet/beauties": ["common.access"],
  "/beauty-wallet/usages": ["common.access"],
  "/beauty-customer-db/remote-consultations": ["common.access"],
  "/beauty-customer-db/real-models": ["common.access"],
  "/beauty-ads/events": ["common.access"],
  "/beauty-ads/products": ["common.access"],
  "/beauty-ads/calendar": ["common.access"],
  "/beauty-posts/beauty-posts": ["common.access"],
  "/beauty-posts/beauty-reviews": ["common.access"],
  "/beauty-posts/talks": ["common.access"],
  "/beauty-reported-content/posts": ["common.access"],
  "/beauty-reported-content/comments": ["common.access"],
  "/faqs": ["common.access"],
  "/inquiries": ["common.access"],
  "/users": ["common.access"],
  "/agencies": ["common.access"],
  "/categories": ["common.access"],
  "/hashtags": ["beaulab.hashtag.manage"],
  "/content/banners": ["common.access"],
  "/content/popups": ["common.access"],
  "/content/top-titles": ["common.access"],
  "/statistics": ["common.access"],
  "/settings/harmful-words": ["common.access"],
  "/settings/nicknames": ["common.access"],
  "/settings/staff": ["common.access"],
} as const;

export type StaticAdminRoutePath = keyof typeof STATIC_ADMIN_ROUTE_PERMISSIONS;

const STATIC_ADMIN_ROUTE_PERMISSION_RULES: RoutePermissionRule[] = Object.entries(
  STATIC_ADMIN_ROUTE_PERMISSIONS,
).map(([path, requiredPermissions]) => ({
  path,
  requiredPermissions: [...requiredPermissions],
}));

export function getStaticRoutePermissions(path: StaticAdminRoutePath): string[] {
  return [...STATIC_ADMIN_ROUTE_PERMISSIONS[path]];
}

export const ADMIN_ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { path: "/hospitals/[id]", requiredPermissions: ["beaulab.hospital.show"] },
  { path: "/hospitals/[id]/edit", requiredPermissions: ["beaulab.hospital.update"] },
  { path: "/hospitals/new", requiredPermissions: ["beaulab.hospital.create"] },
  { path: "/doctors/[id]", requiredPermissions: ["beaulab.doctor.show"] },
  { path: "/doctors/[id]/edit", requiredPermissions: ["beaulab.doctor.update"] },
  { path: "/doctors/new", requiredPermissions: ["beaulab.doctor.create"] },
  { path: "/videos/[id]", requiredPermissions: ["beaulab.video.show"] },
  { path: "/videos/[id]/edit", requiredPermissions: ["beaulab.video.update"] },
  { path: "/videos/new", requiredPermissions: ["beaulab.video.create"] },
  { path: "/notices/[id]", requiredPermissions: ["beaulab.notice.show"] },
  { path: "/notices/[id]/edit", requiredPermissions: ["beaulab.notice.update"] },
  { path: "/notices/new", requiredPermissions: ["beaulab.notice.create"] },
  ...STATIC_ADMIN_ROUTE_PERMISSION_RULES,
];

function isDynamicSegment(segment: string) {
  return /^\[[^/]+\]$/.test(segment);
}

function matchRouteRule(pathname: string, rulePath: string) {
  if (rulePath === "/") {
    return pathname === "/";
  }

  const ruleSegments = rulePath.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);
  const hasDynamicSegment = ruleSegments.some(isDynamicSegment);

  if (hasDynamicSegment) {
    if (ruleSegments.length !== pathSegments.length) {
      return false;
    }

    return ruleSegments.every((segment, index) => isDynamicSegment(segment) || segment === pathSegments[index]);
  }

  return pathname === rulePath || pathname.startsWith(`${rulePath}/`);
}

function getRuleScore(rulePath: string) {
  const segments = rulePath.split("/").filter(Boolean);

  return {
    staticSegmentCount: segments.filter((segment) => !isDynamicSegment(segment)).length,
    segmentCount: segments.length,
    pathLength: rulePath.length,
  };
}

export function resolveRoutePermissions(pathname: string | null, rules: RoutePermissionRule[]): string[] {
  if (!pathname) return [];

  const matchedRule = rules
    .filter((rule) => matchRouteRule(pathname, rule.path))
    .sort((a, b) => {
      const aScore = getRuleScore(a.path);
      const bScore = getRuleScore(b.path);

      if (aScore.staticSegmentCount !== bScore.staticSegmentCount) {
        return bScore.staticSegmentCount - aScore.staticSegmentCount;
      }

      if (aScore.segmentCount !== bScore.segmentCount) {
        return bScore.segmentCount - aScore.segmentCount;
      }

      return bScore.pathLength - aScore.pathLength;
    })[0];

  return matchedRule?.requiredPermissions ?? [];
}
