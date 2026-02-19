import { ReactNode } from "react";
import { hasPermission, hasAnyPermission } from "@beaulab/auth";
import { getSession } from "@/lib/session";

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
