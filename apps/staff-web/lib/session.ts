// apps/staff-web/src/lib/session.ts
import { api } from "./api";
import { tokenStorage, sessionStorage } from "@beaulab/auth";
import { isApiSuccess, StaffSession } from "@beaulab/types";

type LoginPayload = { nickname: string; password: string };

// 1) 로그인
export async function login(payload: LoginPayload): Promise<{ actor: string; profile: any; auth: any }> {
    const res = await api.post<{ token: string }>("/login", payload);

    if (!isApiSuccess(res)) throw res; // 서비스/페이지에서 공통 처리
    tokenStorage.set("staff", res.data.token);

    return await restoreSession(); // 로그인 직후 me로 세션 구성
}

// 2) 세션 복구(/me)
export async function restoreSession(): Promise<{ actor: string; profile: any; auth: any }> {
    const me = await api.get<{
        profile: any; //
        auth: { roles: string[]; permissions: string[]; scope?: string };
    }>("/profile");

    if (!isApiSuccess(me)) throw me;

    const session: { actor: string; profile: any; auth: any } = {
        actor: "staff",
        profile: me.data.profile,
        auth: me.data.auth,
    };

    sessionStorage.set("staff", session);
    return session;
}

// 3) 현재 세션 읽기
export function getSession(): StaffSession | null {
    return sessionStorage.get("staff") as StaffSession | null;
}

// 4) 로그아웃
export function logout() {
    tokenStorage.clear("staff");
    sessionStorage.clear("staff");
}
