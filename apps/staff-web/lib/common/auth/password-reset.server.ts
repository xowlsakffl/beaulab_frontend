import "server-only";
import type { ApiResponse } from "@beaulab/types";

type VerifyResult = { status: "valid" | "invalid" | "rate_limited" } | { status: "retry"; message: string };
const RETRY = { status: "retry" as const, message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };

export async function verifyPasswordResetToken({
  email,
  token,
}: {
  email: string;
  token: string;
}): Promise<VerifyResult> {
  if (!email || !token) return { status: "invalid" };
  const origin = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!origin) return RETRY;
  try {
    // Public link verification does not authenticate or forward a browser session.
    const response = await fetch(`${origin.replace(/\/$/, "")}/api/v1/staff/auth/password-reset/verify`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    if (response.status === 419 || response.status === 422) return { status: "invalid" };
    if (response.status === 429) return { status: "rate_limited" };
    if (!response.ok) return RETRY;
    const payload = (await response.json()) as ApiResponse<{ valid: boolean }>;
    return payload.success ? { status: payload.data.valid ? "valid" : "invalid" } : RETRY;
  } catch {
    return RETRY;
  }
}
