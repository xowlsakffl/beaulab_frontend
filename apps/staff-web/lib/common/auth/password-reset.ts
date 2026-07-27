import { api } from "@/lib/common/api";
import { isApiSuccess } from "@beaulab/types";

type PasswordResetMessageResponse = {
  message: string;
};

type SendPasswordResetLinkPayload = {
  email: string;
};

type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

type VerifyPasswordResetTokenPayload = {
  email: string;
  token: string;
};

type VerifyPasswordResetTokenResponse = {
  valid: boolean;
};

export type PasswordResetTokenVerifyResult =
  | {
      status: "valid";
    }
  | {
      status: "invalid";
    }
  | {
      status: "rate_limited";
    }
  | {
      status: "retry";
      message: string;
    };

const RETRY_MESSAGE = "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

export async function sendPasswordResetLink(payload: SendPasswordResetLinkPayload): Promise<string> {
  const res = await api.post<PasswordResetMessageResponse>("/auth/password-reset-link", payload, undefined, {
    skipUnauthorizedHandler: true,
  });

  if (!isApiSuccess(res)) throw res;

  return res.data.message;
}

export async function verifyPasswordResetToken({
  email,
  token,
}: VerifyPasswordResetTokenPayload): Promise<PasswordResetTokenVerifyResult> {
  if (!email || !token) {
    return { status: "invalid" };
  }

  if (!process.env.NEXT_PUBLIC_API_URL) {
    return {
      status: "retry",
      message: RETRY_MESSAGE,
    };
  }

  try {
    const { response, payload } = await api.rawWithResponse<VerifyPasswordResetTokenResponse>(
      "/auth/password-reset/verify",
      {
        method: "POST",
        body: { email, token },
        cache: "no-store",
        skipUnauthorizedHandler: true,
      },
    );

    if (!response.ok) {
      if (response.status === 419 || response.status === 422) {
        return { status: "invalid" };
      }

      if (response.status === 429) {
        return { status: "rate_limited" };
      }

      return {
        status: "retry",
        message: RETRY_MESSAGE,
      };
    }

    if (!isApiSuccess(payload)) {
      return { status: "invalid" };
    }

    return payload.data.valid ? { status: "valid" } : { status: "invalid" };
  } catch {
    return {
      status: "retry",
      message: RETRY_MESSAGE,
    };
  }
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  const res = await api.post<PasswordResetMessageResponse>("/auth/password-reset", payload, undefined, {
    skipUnauthorizedHandler: true,
  });

  if (!isApiSuccess(res)) throw res;

  return res.data.message;
}
