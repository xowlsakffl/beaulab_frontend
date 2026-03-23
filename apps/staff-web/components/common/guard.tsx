"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { hasPermission, hasAnyPermission } from "@beaulab/auth";
import { ensureSession, getSession } from "@/lib/common/auth/session";
import { usePathname, useRouter } from "next/navigation";
import { StaffSession } from "@beaulab/types";
import { ADMIN_ROUTE_PERMISSION_RULES, resolveRoutePermissions } from "@/lib/common/routing/route-permissions";

type GuardProps = {
  children: ReactNode;
  requiredPermissions?: string[];
  unauthorizedRedirectPath?: string;
};

export function Guard(props: GuardProps) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const next = useMemo(() => (pathname ? `?next=${encodeURIComponent(pathname)}` : ""), [pathname]);
  const routePermissions = useMemo(() => resolveRoutePermissions(pathname, ADMIN_ROUTE_PERMISSION_RULES), [pathname]);

  useEffect(() => {
    let isMounted = true;

    void ensureSession().then((resolvedSession) => {
      if (!isMounted) return;

      if (!resolvedSession) {
        router.replace(`/login${next}`);
        setIsChecking(false);
        return;
      }

      const requiredPermissions =
        props.requiredPermissions && props.requiredPermissions.length > 0
          ? props.requiredPermissions
          : routePermissions;

      if (requiredPermissions.length > 0) {
        const canAccess = hasAnyPermission(resolvedSession.auth, requiredPermissions);

        if (!canAccess) {
          router.replace(props.unauthorizedRedirectPath ?? "/error-404");
          setIsChecking(false);
          return;
        }
      }

      setSession(resolvedSession);
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
    };
  }, [next, props.requiredPermissions, props.unauthorizedRedirectPath, routePermissions, router]);

  if (isChecking) return null;
  if (!session) return null;

  return props.children;
}

export function Can(props: { permission: string; children: ReactNode }) {
  const session = getSession();
  if (!session?.auth) return null;
  return hasPermission(session.auth, props.permission) ? props.children : null;
}

export function CanAny(props: { permissions: string[]; children: ReactNode }) {
  const session = getSession();
  if (!session?.auth) return null;
  return hasAnyPermission(session.auth, props.permissions) ? props.children : null;
}
