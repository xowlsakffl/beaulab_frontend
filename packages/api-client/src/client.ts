import type { ActorType, ApiResponse } from "@beaulab/types";
import { clearLegacyAuthStorage, setSessionTiming } from "@beaulab/auth";
import { buildUrl, type Query } from "./url";

/**
 * Actor별 웹 세션과 CSRF를 처리하는 공통 HTTP client.
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
  onUnauthorized?: (context: ApiUnauthorizedContext) => void;
};

/** 원래 fetch는 RequestInit을 받음
 * 여기서는 body를 unknown으로 받고 내부에서 안전하게 변환해줌
 * query는 url.ts에서 처리하도록 분리
 */
type RequestOptions = Omit<RequestInit, "body"> & {
  query?: Query;
  body?: unknown; // object | FormData | string | etc
  latestKey?: string;
  skipUnauthorizedHandler?: boolean;
  timeoutMs?: number;
};

export type ApiUnauthorizedContext = {
  actor: ActorType;
  path: string;
  url: string;
  status: number;
  response: Response;
  payload: ApiResponse<unknown>;
};

type LatestRequest = {
  controller: AbortController;
  requestId: number;
};

type ApiResponseWithHttp<T> = {
  response: Response;
  payload: ApiResponse<T>;
};

const latestRequests = new Map<string, LatestRequest>();
let latestRequestSequence = 0;

export class ApiRequestCanceledError extends Error {
  constructor(message = "API request canceled") {
    super(message);
    this.name = "ApiRequestCanceledError";
  }
}

export function isApiRequestCanceledError(error: unknown): error is ApiRequestCanceledError {
  return error instanceof ApiRequestCanceledError;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

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
  const { baseURL, actor, onUnauthorized } = options;
  let csrfToken: string | null = null;
  let csrfPromise: Promise<string> | null = null;

  async function ensureCsrfToken(): Promise<string> {
    if (csrfToken) return csrfToken;
    if (csrfPromise) return csrfPromise;
    csrfPromise = (async () => {
      const response = await fetch(buildUrl(baseURL, "/auth/csrf"), {
        credentials: "include",
        cache: "no-store",
        referrerPolicy: "strict-origin",
        headers: { Accept: "application/json", "X-Beaulab-Client": "web" },
        signal: AbortSignal.timeout(15_000),
      });
      const payload = (await response.json()) as ApiResponse<{ csrf_token: string }>;
      if (!response.ok || !payload.success || !payload.data?.csrf_token) {
        throw new Error(
          !payload.success ? payload.error.message : "인증 정보를 확인하지 못했습니다. 다시 시도해 주세요.",
        );
      }
      csrfToken = payload.data.csrf_token;
      return csrfToken;
    })().finally(() => {
      csrfPromise = null;
    });
    return csrfPromise;
  }

  async function requestWithResponse<T>(path: string, opts: RequestOptions = {}): Promise<ApiResponseWithHttp<T>> {
    const { query, body: rawBody, latestKey, skipUnauthorizedHandler, timeoutMs, ...rest } = opts;

    const url = buildUrl(baseURL, path, query);
    const headers = new Headers(rest.headers);
    headers.set("Accept", "application/json");

    clearLegacyAuthStorage(actor);
    headers.delete("Authorization");
    headers.set("X-Beaulab-Client", "web");

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

    const controller = new AbortController();
    const latestRequestKey = latestKey ? `${actor}:${baseURL}:${latestKey}` : null;
    let latestRequest: LatestRequest | null = null;

    if (latestRequestKey) {
      latestRequests.get(latestRequestKey)?.controller.abort();

      latestRequest = {
        controller,
        requestId: (latestRequestSequence += 1),
      };
      latestRequests.set(latestRequestKey, latestRequest);
    }

    const abortFromCaller = () => controller.abort();
    if (rest.signal?.aborted) controller.abort();
    else rest.signal?.addEventListener("abort", abortFromCaller, { once: true });

    const readTimeoutMs = timeoutMs ?? ((rest.method ?? "GET").toUpperCase() === "GET" ? 30_000 : 0);
    let timedOut = false;
    const timeoutId =
      readTimeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, readTimeoutMs)
        : undefined;

    try {
      if (latestRequestKey) {
        await Promise.resolve();
        if (controller.signal.aborted) throw new ApiRequestCanceledError();
      }

      if (!["GET", "HEAD", "OPTIONS"].includes((rest.method ?? "GET").toUpperCase())) {
        headers.set("X-CSRF-TOKEN", await ensureCsrfToken());
      }
      if (controller.signal.aborted) throw new ApiRequestCanceledError();
      const res = await fetch(url, {
        ...rest,
        credentials: "include",
        cache: "no-store",
        referrerPolicy: "strict-origin",
        signal: controller.signal,
        headers,
        body,
      });

      if (latestRequestKey && latestRequests.get(latestRequestKey)?.requestId !== latestRequest?.requestId) {
        throw new ApiRequestCanceledError("Stale API response ignored");
      }

      const payload = (await res.json()) as ApiResponse<T>;
      if (res.status === 419 || (res.ok && (path === "/auth/login" || path === "/auth/logout"))) {
        csrfToken = null;
      }
      const expires = res.headers.get("X-Session-Expires-At");
      const idleExpires = res.headers.get("X-Session-Idle-Expires-At");
      if (expires && idleExpires) {
        setSessionTiming(actor, { expires_at: Number(expires), idle_expires_at: Number(idleExpires) });
      }

      if (latestRequestKey && latestRequests.get(latestRequestKey)?.requestId !== latestRequest?.requestId) {
        throw new ApiRequestCanceledError("Stale API response ignored");
      }

      if (!skipUnauthorizedHandler && res.status === 401) {
        onUnauthorized?.({
          actor,
          path,
          url,
          status: res.status,
          response: res,
          payload: payload as ApiResponse<unknown>,
        });
      }

      return {
        response: res,
        payload,
      };
    } catch (error) {
      if (timedOut) {
        throw new Error("응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      }
      if (isAbortError(error)) {
        throw new ApiRequestCanceledError();
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      rest.signal?.removeEventListener("abort", abortFromCaller);
      if (latestRequestKey && latestRequests.get(latestRequestKey)?.requestId === latestRequest?.requestId) {
        latestRequests.delete(latestRequestKey);
      }
    }
  }

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { payload } = await requestWithResponse<T>(path, opts);

    return payload;
  }

  return {
    get: <T>(path: string, query?: Query, options?: Omit<RequestOptions, "query" | "body" | "method">) =>
      request<T>(path, { ...options, method: "GET", query }),

    post: <T>(
      path: string,
      body?: unknown,
      query?: Query,
      options?: Omit<RequestOptions, "query" | "body" | "method">,
    ) => request<T>(path, { ...options, method: "POST", body, query }),

    put: <T>(
      path: string,
      body?: unknown,
      query?: Query,
      options?: Omit<RequestOptions, "query" | "body" | "method">,
    ) => request<T>(path, { ...options, method: "PUT", body, query }),

    patch: <T>(
      path: string,
      body?: unknown,
      query?: Query,
      options?: Omit<RequestOptions, "query" | "body" | "method">,
    ) => request<T>(path, { ...options, method: "PATCH", body, query }),

    delete: <T>(path: string, query?: Query, options?: Omit<RequestOptions, "query" | "body" | "method">) =>
      request<T>(path, { ...options, method: "DELETE", query }),

    // 필요하면 외부에서 커스텀 옵션까지 쓰게 raw도 제공 가능
    raw: request,
    rawWithResponse: requestWithResponse,
  };
}
