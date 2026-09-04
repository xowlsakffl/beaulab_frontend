"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { hasPermission, hasAnyPermission } from "@beaulab/auth";
import { ensureSession, getSession } from "@/lib/common/auth/session";
import { usePathname, useRouter } from "next/navigation";
import { StaffSession } from "@beaulab/types";
import { SpinnerBlock } from "@beaulab/ui-admin";
import { ADMIN_ROUTE_PERMISSION_RULES, resolveRoutePermissionRule } from "@/lib/common/routing/route-permissions";
import { LoadErrorState } from "@/components/common/LoadErrorState";

type GuardProps = {
  children: ReactNode;
  requiredPermissions?: string[];
  unauthorizedRedirectPath?: string;
};

export function Guard(props: GuardProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [{ session, isChecking }, setGuardState] = useState<{
    session: StaffSession | null;
    isChecking: boolean;
  }>({
    session: null,
    isChecking: true,
  });

  const router = useRouter();
  const pathname = usePathname();

  const next = useMemo(() => (pathname ? `?next=${encodeURIComponent(pathname)}` : ""), [pathname]);
  const routePermissionRule = useMemo(
    () => resolveRoutePermissionRule(pathname, ADMIN_ROUTE_PERMISSION_RULES),
    [pathname],
  );
  const requiredPermissions =
    props.requiredPermissions && props.requiredPermissions.length > 0
      ? props.requiredPermissions
      : routePermissionRule?.requiredPermissions;
  const canAccess = Boolean(
    session &&
    requiredPermissions &&
    requiredPermissions.length > 0 &&
    hasAnyPermission(session.auth, requiredPermissions),
  );

  useEffect(() => {
    let isMounted = true;

    const authorize = async () => {
      const resolvedSession = session ?? getSession() ?? (await ensureSession());

      if (!isMounted) return;

      if (!resolvedSession) {
        router.replace(`/login${next}`);
        setGuardState({ session: null, isChecking: false });
        return;
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        router.replace(props.unauthorizedRedirectPath ?? "/error-404");
        setGuardState({ session: resolvedSession, isChecking: false });
        return;
      }

      if (!hasAnyPermission(resolvedSession.auth, requiredPermissions)) {
        router.replace(props.unauthorizedRedirectPath ?? "/error-404");
        setGuardState({ session: resolvedSession, isChecking: false });
        return;
      }

      if (session !== resolvedSession || isChecking) {
        setGuardState({ session: resolvedSession, isChecking: false });
      }
    };

    void authorize().catch((error: unknown) => {
      if (isMounted) setLoadError(error instanceof Error ? error.message : "로그인 정보를 확인하지 못했습니다.");
    });

    return () => {
      isMounted = false;
    };
  }, [isChecking, next, props.unauthorizedRedirectPath, requiredPermissions, router, session]);

  if (loadError) return <LoadErrorState title="로그인 확인 실패" message={loadError} />;
  if (isChecking) {
    return <SpinnerBlock className="min-h-dvh bg-gray-50" spinnerClassName="size-10" label="관리자 확인 중" />;
  }
  if (!session) return null;
  if (!canAccess) return null;

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
