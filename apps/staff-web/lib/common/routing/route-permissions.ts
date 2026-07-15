export type RoutePermissionRule = {
  path: string;
  requiredPermissions: string[];
};

export const STATIC_ADMIN_ROUTE_PERMISSIONS = {
  "/admin-settings/profile": ["common.profile.show"],
  "/admin-settings/harmful-words": ["beaulab.category.manage"],
  "/admin-settings/nicknames": ["beaulab.user.show"],
  "/admin-settings/staff": ["beaulab.agency.show"],
  "/admin-settings/event-display-positions": ["beaulab.hospital_event_ad.show"],
  "/hospital-dashboard/dashboard": ["common.dashboard.show"],
  "/user-manage/users": ["beaulab.user.show"],
  "/hospital-manage/hospitals": ["beaulab.hospital.show"],
  "/hospital-manage/doctors": ["beaulab.doctor.show"],
  "/hospital-manage/hospital-entries": ["beaulab.hospital_entry.show"],
  "/wallet-manage/deposits": ["beaulab.hospital.show"],
  "/wallet-manage/hospitals": ["beaulab.hospital.show"],
  "/wallet-manage/history": ["beaulab.hospital.show"],
  "/customer-db-manage/events": ["beaulab.hospital_event_db.show"],
  "/customer-db-manage/real-models": ["beaulab.hospital_event_real_model_db.show"],
  "/ads-manage/events": ["beaulab.hospital_event.show"],
  "/ads-manage/event-ads": ["beaulab.hospital_event_ad.show"],
  "/ads-manage/calendar": ["beaulab.hospital_event_ad.show"],
  "/ads-manage/products": ["beaulab.hospital_event_ad.show"],
  "/video-manage/videos": ["beaulab.video.show"],
  "/post-manage/surgery-reviews": ["beaulab.hospital_review.show"],
  "/post-manage/treatment-reviews": ["beaulab.hospital_review.show"],
  "/post-manage/hospital-evaluations": ["beaulab.hospital_evaluation.show"],
  "/post-manage/talks": ["beaulab.talk.show"],
  "/reported-post-manage/surgery-reviews": ["beaulab.reported_hospital_review.show"],
  "/reported-post-manage/treatment-reviews": ["beaulab.reported_hospital_review.show"],
  "/reported-post-manage/hospital-evaluations": ["beaulab.reported_hospital_evaluation.show"],
  "/reported-post-manage/talks": ["beaulab.reported_talk.show"],
  "/reported-post-manage/chats": ["beaulab.reported_chat_message.show"],
  "/notice-manage/notices": ["beaulab.notice.show"],
  "/notice-manage/hospital-notices": ["beaulab.notice.show"],
  "/notice-manage/faqs": ["beaulab.faq.show"],
  "/notice-manage/inquiries": ["beaulab.notice.show"],
  "/content-manage/banners": ["beaulab.notice.show"],
  "/content-manage/popups": ["beaulab.notice.show"],
  "/content-manage/top-titles": ["beaulab.category.manage"],
  "/statistics-manage/statistics": ["common.dashboard.show"],
  "/category-hashtag-manage/categories": ["beaulab.category.manage"],
  "/category-hashtag-manage/hashtags": ["beaulab.hashtag.manage"],
  "/beauty-dashboard/dashboard": ["beaulab.beauty.show"],
  "/beauty-shop-manage/beauties": ["beaulab.beauty.show"],
  "/beauty-shop-manage/experts": ["beaulab.expert.show"],
  "/beauty-customer-db-manage/real-models": ["beaulab.beauty.show"],
  "/beauty-ads-manage/events": ["beaulab.beauty.show"],
  "/beauty-ads-manage/products": ["beaulab.beauty.show"],
  "/beauty-ads-manage/calendar": ["beaulab.beauty.show"],
  "/beauty-wallet-manage/beauties": ["beaulab.beauty.show"],
  "/beauty-wallet-manage/usages": ["beaulab.beauty.show"],
  "/beauty-post-manage/beauty-reviews": ["beaulab.beauty.show"],
  "/beauty-post-manage/beauty-posts": ["beaulab.beauty.show"],
  "/beauty-post-manage/talks": ["beaulab.beauty.show"],
  "/beauty-reported-content-manage/posts": ["beaulab.beauty.show"],
  "/beauty-reported-content-manage/comments": ["beaulab.beauty.show"],
  "/beauty-notice-manage/notices": ["beaulab.notice.show"],
  "/beauty-notice-manage/faqs": ["beaulab.faq.show"],
  "/beauty-notice-manage/inquiries": ["beaulab.notice.show"],
} as const;

export type StaticAdminRoutePath = keyof typeof STATIC_ADMIN_ROUTE_PERMISSIONS;

const STATIC_ADMIN_ROUTE_PERMISSION_RULES: RoutePermissionRule[] = Object.entries(STATIC_ADMIN_ROUTE_PERMISSIONS).map(
  ([path, requiredPermissions]) => ({
    path,
    requiredPermissions: [...requiredPermissions],
  }),
);

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
  { path: "/hospital-manage/hospital-entries/[id]", requiredPermissions: ["beaulab.hospital_entry.show"] },
  { path: "/hospital-manage/hospital-entries/[id]/edit", requiredPermissions: ["beaulab.hospital_entry.update"] },
  { path: "/video-manage/videos/[id]", requiredPermissions: ["beaulab.video.show"] },
  { path: "/video-manage/videos/[id]/edit", requiredPermissions: ["beaulab.video.update"] },
  { path: "/video-manage/videos/new", requiredPermissions: ["beaulab.video.create"] },
  { path: "/ads-manage/events/[id]", requiredPermissions: ["beaulab.hospital_event.show"] },
  { path: "/ads-manage/events/[id]/edit", requiredPermissions: ["beaulab.hospital_event.update"] },
  { path: "/ads-manage/events/new", requiredPermissions: ["beaulab.hospital_event.create"] },
  { path: "/ads-manage/event-ads/[id]", requiredPermissions: ["beaulab.hospital_event_ad.show"] },
  { path: "/ads-manage/event-ads/[id]/edit", requiredPermissions: ["beaulab.hospital_event_ad.update"] },
  { path: "/ads-manage/event-ads/new", requiredPermissions: ["beaulab.hospital_event_ad.create"] },
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

export function resolveRoutePermissionRule(
  pathname: string | null,
  rules: RoutePermissionRule[],
): RoutePermissionRule | null {
  if (!pathname) return null;

  return (
    rules
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
      })[0] ?? null
  );
}

export function resolveRoutePermissions(pathname: string | null, rules: RoutePermissionRule[]): string[] {
  return resolveRoutePermissionRule(pathname, rules)?.requiredPermissions ?? [];
}
