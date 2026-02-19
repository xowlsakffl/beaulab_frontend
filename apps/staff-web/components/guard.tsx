"use client"
import { ReactNode, useEffect, useMemo, useState } from "react";
import { hasPermission, hasAnyPermission } from "@beaulab/auth";
import { ensureSession, getSession } from "@/lib/session";
import { usePathname, useRouter } from "next/navigation";

export function Guard(props: { children: ReactNode }) {
    const [session, setSession] = useState(() => getSession());
    const [isChecking, setIsChecking] = useState(() => !getSession());
    const router = useRouter();
    const pathname = usePathname();

    const next = useMemo(
        () => (pathname ? `?next=${encodeURIComponent(pathname)}` : ""),
        [pathname],
    );

    useEffect(() => {
        let isMounted = true;

        if (!session) {
            void ensureSession().then((resolvedSession) => {
                if (!isMounted) return;

                if (!resolvedSession) {
                    router.replace(`/signin${next}`);
                    setIsChecking(false);
                    return;
                }

                setSession(resolvedSession);
                setIsChecking(false);
            });
        }

        return () => {
            isMounted = false;
        };
    }, [next, router, session]);

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
