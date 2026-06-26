export type RoutePermissionRule = {
  path: string;
  requiredPermissions: string[];
};

export const STATIC_ADMIN_ROUTE_PERMISSIONS = {
  "/admin-settings/profile": ["common.profile.show"],
  "/hospital-dashboard/dashboard": ["common.dashboard.show"],
  "/hospital-manage/hospitals": ["beaulab.hospital.show"],
  "/hospital-manage/doctors": ["beaulab.doctor.show"],
  "/hospital-manage/hospital-entries": ["beaulab.hospital_entry.show"],
  "/wallet-manage/deposits": ["common.access"],
  "/wallet-manage/history": ["common.access"],
  "/customer-db-manage/events": ["common.access"],
  "/customer-db-manage/real-models": ["common.access"],
  "/ads-manage/events": ["beaulab.hospital_event.show"],
  "/ads-manage/products": ["common.access"],
  "/ads-manage/calendar": ["common.access"],
  "/video-manage/videos": ["beaulab.video.show"],
  "/post-manage/surgery-reviews": ["beaulab.hospital_review.show"],
  "/post-manage/treatment-reviews": ["beaulab.hospital_review.show"],
  "/post-manage/hospital-evaluations": ["beaulab.hospital_evaluation.show"],
  "/post-manage/talks": ["beaulab.talk.show"],
  "/reported-post-manage/surgery-reviews": ["common.access"],
  "/reported-post-manage/treatment-reviews": ["common.access"],
  "/reported-post-manage/hospital-evaluations": ["common.access"],
  "/reported-post-manage/talks": ["common.access"],
  "/reported-post-manage/chats": ["common.access"],
  "/beauty-dashboard/dashboard": ["common.dashboard.show"],
  "/beauty-shop-manage/beauties": ["beaulab.beauty.show"],
  "/beauty-shop-manage/experts": ["beaulab.expert.show"],
  "/beauty-wallet-manage/beauties": ["common.access"],
  "/beauty-wallet-manage/usages": ["common.access"],
  "/beauty-customer-db-manage/real-models": ["common.access"],
  "/beauty-ads-manage/events": ["common.access"],
  "/beauty-ads-manage/products": ["common.access"],
  "/beauty-ads-manage/calendar": ["common.access"],
  "/beauty-post-manage/beauty-posts": ["common.access"],
  "/beauty-post-manage/beauty-reviews": ["common.access"],
  "/beauty-post-manage/talks": ["common.access"],
  "/beauty-reported-content-manage/posts": ["common.access"],
  "/beauty-reported-content-manage/comments": ["common.access"],
  "/notice-manage/notices": ["beaulab.notice.show"],
  "/notice-manage/faqs": ["common.access"],
  "/notice-manage/inquiries": ["common.access"],
  "/user-manage/users": ["common.access"],
  "/category-hashtag-manage/categories": ["common.access"],
  "/category-hashtag-manage/hashtags": ["beaulab.hashtag.manage"],
  "/content-manage/banners": ["common.access"],
  "/content-manage/popups": ["common.access"],
  "/content-manage/top-titles": ["common.access"],
  "/statistics-manage/statistics": ["common.access"],
  "/admin-settings/harmful-words": ["common.access"],
  "/admin-settings/nicknames": ["common.access"],
  "/admin-settings/staff": ["common.access"],
  "/admin-settings/agencies": ["common.access"],
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
  { path: "/hospital-manage/hospitals/[id]", requiredPermissions: ["beaulab.hospital.show"] },
  { path: "/hospital-manage/hospitals/[id]/edit", requiredPermissions: ["beaulab.hospital.update"] },
  { path: "/hospital-manage/hospitals/new", requiredPermissions: ["beaulab.hospital.create"] },
  { path: "/hospital-manage/doctors/[id]", requiredPermissions: ["beaulab.doctor.show"] },
  { path: "/hospital-manage/doctors/[id]/edit", requiredPermissions: ["beaulab.doctor.update"] },
  { path: "/hospital-manage/doctors/new", requiredPermissions: ["beaulab.doctor.create"] },
  { path: "/video-manage/videos/[id]", requiredPermissions: ["beaulab.video.show"] },
  { path: "/video-manage/videos/[id]/edit", requiredPermissions: ["beaulab.video.update"] },
  { path: "/video-manage/videos/new", requiredPermissions: ["beaulab.video.create"] },
  { path: "/ads-manage/events/[id]", requiredPermissions: ["beaulab.hospital_event.show"] },
  { path: "/ads-manage/events/[id]/edit", requiredPermissions: ["beaulab.hospital_event.update"] },
  { path: "/ads-manage/events/new", requiredPermissions: ["beaulab.hospital_event.create"] },
  { path: "/notice-manage/notices/[id]", requiredPermissions: ["beaulab.notice.show"] },
  { path: "/notice-manage/notices/[id]/edit", requiredPermissions: ["beaulab.notice.update"] },
  { path: "/notice-manage/notices/new", requiredPermissions: ["beaulab.notice.create"] },
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
