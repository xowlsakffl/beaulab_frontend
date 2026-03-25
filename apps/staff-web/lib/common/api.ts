import { createClient } from "@beaulab/api-client";
import { tokenStorage } from "@beaulab/auth";

export const api = createClient({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/staff`,
    actor: "staff",
});

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
    const token = tokenStorage.get("staff");
    const baseURL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/staff`;
    const url = /^https?:\/\//i.test(pathOrUrl)
        ? pathOrUrl
        : `${baseURL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
            try {
                const payload = await response.json() as { error?: { message?: string } };
                throw new Error(payload.error?.message || `Download failed with status ${response.status}`);
            } catch {
                throw new Error(`Download failed with status ${response.status}`);
            }
        }

        throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const contentDisposition = response.headers.get("content-disposition");
    const resolvedFileName =
        parseContentDispositionFileName(contentDisposition)
        || fallbackFileName
        || url.split("?")[0].split("/").filter(Boolean).pop()
        || "download";

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = resolvedFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.URL.revokeObjectURL(objectUrl);
}
