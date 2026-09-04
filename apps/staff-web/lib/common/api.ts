import { createClient, type ApiUnauthorizedContext } from "@beaulab/api-client";
import { sessionStorage } from "@beaulab/auth";
import { invalidateListDataCache } from "@/lib/common/list-data-cache";

export { isApiRequestCanceledError } from "@beaulab/api-client";

export const NAVIGATION_BADGE_REFRESH_EVENT = "staff:navigation-badges:refresh";

let isRedirectingToLogin = false;

function dispatchNavigationBadgeRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_BADGE_REFRESH_EVENT));
}

function wrapMutation<Args extends unknown[], Result extends { success?: boolean }>(
  request: (...args: Args) => Promise<Result>,
) {
  return async (...args: Args): Promise<Result> => {
    const response = await request(...args);

    if (response.success) {
      invalidateListDataCache();
      dispatchNavigationBadgeRefresh();
    }

    return response;
  };
}

function redirectToLoginAfterUnauthorized(context: ApiUnauthorizedContext) {
  if (typeof window === "undefined" || isRedirectingToLogin) return;

  sessionStorage.clear(context.actor);
  invalidateListDataCache();

  if (window.location.pathname === "/login") return;

  isRedirectingToLogin = true;

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const next = currentPath ? `?next=${encodeURIComponent(currentPath)}` : "";

  window.location.replace(`/login${next}`);
}

const staffApi = createClient({
  baseURL: "/api/v1/staff",
  actor: "staff",
  onUnauthorized: redirectToLoginAfterUnauthorized,
});

export const api: typeof staffApi = {
  ...staffApi,
  post: wrapMutation(staffApi.post) as typeof staffApi.post,
  put: wrapMutation(staffApi.put) as typeof staffApi.put,
  patch: wrapMutation(staffApi.patch) as typeof staffApi.patch,
  delete: wrapMutation(staffApi.delete) as typeof staffApi.delete,
};

function parseContentDispositionFileName(headerValue: string | null): string | null {
  if (!headerValue) return null;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const quotedMatch = headerValue.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = headerValue.match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() ?? null;
}

export async function downloadFile(pathOrUrl: string, fallbackFileName?: string): Promise<void> {
  const baseURL = "/api/v1/staff";
  const url = /^(?:https?:\/\/|blob:|data:)/i.test(pathOrUrl)
    ? pathOrUrl
    : `${baseURL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const target = new URL(url, window.location.origin);
  const isApi = target.origin === window.location.origin && target.pathname.startsWith(`${baseURL}/`);
  if (isApi) headers.set("X-Beaulab-Client", "web");

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: isApi ? "include" : "omit",
    cache: "no-store",
    referrerPolicy: "strict-origin",
  });

  if (isApi && response.status === 401) {
    redirectToLoginAfterUnauthorized({
      actor: "staff",
      path: pathOrUrl,
      url,
      status: response.status,
      response,
      payload: {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "인증이 필요합니다.",
        },
        traceId: response.headers.get("X-Request-Id"),
      },
    });
    throw new Error("인증이 필요합니다.");
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      let errorMessage: string | null = null;

      try {
        const payload = (await response.json()) as { error?: { message?: string } };
        errorMessage = payload.error?.message?.trim() || null;
      } catch {
        errorMessage = null;
      }

      if (errorMessage) {
        throw new Error(errorMessage);
      }
    }

    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const contentDisposition = response.headers.get("content-disposition");
  const resolvedFileName =
    parseContentDispositionFileName(contentDisposition) ||
    fallbackFileName ||
    url.split("?")[0].split("/").filter(Boolean).pop() ||
    "download";

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = resolvedFileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
}
