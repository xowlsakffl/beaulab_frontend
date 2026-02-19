import type { ActorType, StaffSession, PartnerSession, UserSession } from "@beaulab/types";

const TOKEN_KEY_PREFIX = "beaulab.token.";
const SESSION_KEY_PREFIX = "beaulab.session.";

/**
 * 사용법 예)
 * import { tokenStorage, sessionStorage } from "@beaulab/auth"; // storage.ts가 여기서 export된다고 가정
 *
 * // 로그인 성공 후
 * tokenStorage.set("staff", token);
 *
 * // 로그아웃
 * tokenStorage.remove("staff");
 * sessionStorage.remove("staff");
 *
 * 앱 시작 시 “이미 로그인 상태인지” 확인도 storage로 함:
 * const token = tokenStorage.get("staff");
 * if (token) {
 *   // profile 호출해서 session 복구
 * }
 */

/**
 * 브라우저 환경 체크
 */
function isBrowser(): boolean {
    return typeof window !== "undefined";
}

/**
 * Actor별 token 저장소
 */
export const tokenStorage = {
    get(actor: ActorType): string | null {
        if (!isBrowser()) return null;
        return window.localStorage.getItem(TOKEN_KEY_PREFIX + actor);
    },

    set(actor: ActorType, token: string): void {
        if (!isBrowser()) return;
        window.localStorage.setItem(TOKEN_KEY_PREFIX + actor, token);
    },

    clear(actor: ActorType): void {
        if (!isBrowser()) return;
        window.localStorage.removeItem(TOKEN_KEY_PREFIX + actor);
    },
};

/**
 * Actor별 session 저장소
 */
export const sessionStorage = {
    get(actor: ActorType): StaffSession | PartnerSession | UserSession | null {
        if (!isBrowser()) return null;

        const raw = window.localStorage.getItem(SESSION_KEY_PREFIX + actor);
        return raw ? JSON.parse(raw) : null;
    },

    set(actor: ActorType, session: unknown): void {
        if (!isBrowser()) return;
        window.localStorage.setItem(
            SESSION_KEY_PREFIX + actor,
            JSON.stringify(session)
        );
    },

    clear(actor: ActorType): void {
        if (!isBrowser()) return;
        window.localStorage.removeItem(SESSION_KEY_PREFIX + actor);
    },
};
