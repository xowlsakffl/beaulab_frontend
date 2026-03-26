import { ADMIN_PAGE_ROUTE_PERMISSIONS } from "@/lib/common/routing/admin-pages";

export type RoutePermissionRule = {
  path: string;
  requiredPermissions: string[];
};

export const ADMIN_ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { path: "/", requiredPermissions: ["common.dashboard.show"] },
  { path: "/profile", requiredPermissions: ["common.profile.show"] },
  { path: "/hospitals", requiredPermissions: ["beaulab.hospital.show"] },
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
  ...ADMIN_PAGE_ROUTE_PERMISSIONS,
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
