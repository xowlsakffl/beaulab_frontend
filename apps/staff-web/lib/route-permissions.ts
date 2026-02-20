export type RoutePermissionRule = {
  path: string;
  requiredPermissions: string[];
};

export const ADMIN_ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { path: "/", requiredPermissions: ["common.dashboard.show"] },
  { path: "/profile", requiredPermissions: ["common.profile.show"] },
  { path: "/hospitals", requiredPermissions: ["beaulab.hospital.show"] },
  { path: "/hospitals/new", requiredPermissions: ["beaulab.hospital.create"] },
];

export function resolveRoutePermissions(pathname: string | null, rules: RoutePermissionRule[]): string[] {
  if (!pathname) return [];

  const matchedRule = rules
      .filter((rule) => {
        if (rule.path === "/") return pathname === "/";
        return pathname === rule.path || pathname.startsWith(`${rule.path}/`);
      })
      .sort((a, b) => b.path.length - a.path.length)[0];

  return matchedRule?.requiredPermissions ?? [];
}
