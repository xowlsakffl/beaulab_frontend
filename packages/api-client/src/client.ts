import type { ApiResponse, ActorType } from "@beaulab/types";
import { tokenStorage } from "@beaulab/auth";
import { buildUrl, type Query } from "./url";

/**
 * staff/partner/user 각각 다른 baseURL + 다른 토큰을 자동으로 붙여서 fetch 하는 래퍼.
 *
 * 사용법 예)
 * import { createClient } from "@beaulab/api-client"; // client.ts가 export된 패키지 경로
 * export const staffClient = createClient({
 *   baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/staff`,
 *   actor: "staff",
 * });
 *
 * 이후 화면 등에서
 * const res = await staffClient.get<Hospital[]>("/hospitals", { page: 1 });
 * const res2 = await staffClient.post<LoginDto>("/login", { email, password });
 */
type CreateClientOptions = {
    baseURL: string; // ex: http://localhost:8000/api/v1/staff
    actor: ActorType;
};

/** 원래 fetch는 RequestInit을 받음
 * 여기서는 body를 unknown으로 받고 내부에서 안전하게 변환해줌
 * query는 url.ts에서 처리하도록 분리
 */
type RequestOptions = Omit<RequestInit, "body"> & {
    query?: Query;
    body?: unknown; // object | FormData | string | etc
};

function isFormData(v: unknown): v is FormData {
    return typeof FormData !== "undefined" && v instanceof FormData;
}

/**
 * 객체를 넣으면 자동으로 JSON 보내주기
 * 파일/바이너리/문자열은 JSON으로 바꾸면 안 됨
 */
function shouldJsonify(body: unknown): boolean {
    if (body === undefined || body === null) return false;
    if (isFormData(body)) return false;
    if (typeof body === "string") return false;
    if (typeof Blob !== "undefined" && body instanceof Blob) return false;
    if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return false;
    return true;
}

//baseURL+actor를 클로저로 고정
export function createClient(options: CreateClientOptions) {
    const { baseURL, actor } = options;

    async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
        const { query, body: rawBody, ...rest } = opts;

        const url = buildUrl(baseURL, path, query);

        const headers = new Headers(rest.headers);
        headers.set("Accept", "application/json");

        const token = tokenStorage.get(actor);
        if (token) headers.set("Authorization", `Bearer ${token}`);

        let body: BodyInit | undefined = undefined;

        if (rawBody !== undefined) {
            if (isFormData(rawBody)) {
                body = rawBody;
            } else if (shouldJsonify(rawBody)) {
                body = JSON.stringify(rawBody);
                if (!headers.has("Content-Type")) {
                    headers.set("Content-Type", "application/json");
                }
            } else {
                body = rawBody as BodyInit;
            }
        }

        const res = await fetch(url, {
            ...rest,
            headers,
            body,
        });

        return (await res.json()) as ApiResponse<T>;
    }

    return {
        get: <T>(path: string, query?: Query) =>
            request<T>(path, { method: "GET", query }),

        post: <T>(path: string, body?: unknown, query?: Query) =>
            request<T>(path, { method: "POST", body, query }),

        put: <T>(path: string, body?: unknown, query?: Query) =>
            request<T>(path, { method: "PUT", body, query }),

        patch: <T>(path: string, body?: unknown, query?: Query) =>
            request<T>(path, { method: "PATCH", body, query }),

        delete: <T>(path: string, query?: Query) =>
            request<T>(path, { method: "DELETE", query }),

        // 필요하면 외부에서 커스텀 옵션까지 쓰게 raw도 제공 가능
        raw: request,
    };
}
