import type { ActorAuthorization } from "@beaulab/types";

type AuthorizationLike = Partial<ActorAuthorization> | undefined;

/**
 * 사용법 예)
 * const session = sessionStorage.get("staff");
 *
 * {hasPermission(session?.auth, "hospital.create") && (
 *   <button>병원 등록</button>
 * )}
 * 또는
 * const menus = allMenus.filter(m => hasAnyPermission(session.auth, m.permissions));
 */

/**
 * 단일 permission 확인
 */
export function hasPermission(
    auth: AuthorizationLike,
    permission: string
): boolean {
    const grantedPermissions = auth?.permissions;
    if (!grantedPermissions) return false;
    return grantedPermissions.includes(permission);
}

/**
 * 여러 permission 중 하나라도 있으면 true
 */
export function hasAnyPermission(
    auth: AuthorizationLike,
    permissions: string[]
): boolean {
    const grantedPermissions = auth?.permissions;
    if (!grantedPermissions) return false;
    return permissions.some((permission) => grantedPermissions.includes(permission));
}

/**
 * 모든 permission을 가지고 있어야 true
 */
export function hasAllPermissions(
    auth: AuthorizationLike,
    permissions: string[]
): boolean {
    const grantedPermissions = auth?.permissions;
    if (!grantedPermissions) return false;
    return permissions.every((permission) => grantedPermissions.includes(permission));
}
