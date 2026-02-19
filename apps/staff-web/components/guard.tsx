"use client"
import { ReactNode, useEffect } from "react";
import { hasPermission, hasAnyPermission } from "@beaulab/auth";
import { getSession } from "@/lib/session";
import { usePathname, useRouter } from "next/navigation";

export function Guard(props: { children: ReactNode }) {
    const session = getSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!session) {
            const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
            router.replace(`/login${next}`);
        }
    }, [pathname, router, session]);

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
