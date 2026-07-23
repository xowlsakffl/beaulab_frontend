import type { ActorSessionMap, ActorType } from "@beaulab/types";

const TOKEN_KEY_PREFIX = "beaulab.token.";
const SESSION_KEY_PREFIX = "beaulab.session.";

type StorageSetOptions = {
  persistent?: boolean;
};

/**
 * 사용법 예)
 * import { tokenStorage, sessionStorage } from "@beaulab/auth"; // storage.ts가 여기서 export된다고 가정
 *
 * // 로그인 성공 후
 * tokenStorage.set("staff", token, { persistent: true });
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

function storageFor(options?: StorageSetOptions): Storage {
  return options?.persistent === false ? window.sessionStorage : window.localStorage;
}

function getItem(key: string): string | null {
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

function setItem(key: string, value: string, options?: StorageSetOptions): void {
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
  storageFor(options).setItem(key, value);
}

function removeItem(key: string): void {
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

function isPersistentKey(key: string): boolean {
  return window.localStorage.getItem(key) !== null;
}

/**
 * Actor별 token 저장소
 */
export const tokenStorage = {
  get(actor: ActorType): string | null {
    if (!isBrowser()) return null;
    return getItem(TOKEN_KEY_PREFIX + actor);
  },

  set(actor: ActorType, token: string, options?: StorageSetOptions): void {
    if (!isBrowser()) return;
    setItem(TOKEN_KEY_PREFIX + actor, token, options);
  },

  clear(actor: ActorType): void {
    if (!isBrowser()) return;
    removeItem(TOKEN_KEY_PREFIX + actor);
  },

  isPersistent(actor: ActorType): boolean {
    if (!isBrowser()) return false;
    return isPersistentKey(TOKEN_KEY_PREFIX + actor);
  },
};

/**
 * Actor별 session 저장소
 */
export const sessionStorage = {
  get<TActor extends ActorType>(actor: TActor): ActorSessionMap[TActor] | null {
    if (!isBrowser()) return null;

    const raw = getItem(SESSION_KEY_PREFIX + actor);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as ActorSessionMap[TActor];
    } catch {
      removeItem(SESSION_KEY_PREFIX + actor);
      return null;
    }
  },

  set<TActor extends ActorType>(actor: TActor, session: ActorSessionMap[TActor], options?: StorageSetOptions): void {
    if (!isBrowser()) return;
    setItem(SESSION_KEY_PREFIX + actor, JSON.stringify(session), options);
  },

  clear(actor: ActorType): void {
    if (!isBrowser()) return;
    removeItem(SESSION_KEY_PREFIX + actor);
  },
};
