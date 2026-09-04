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

export async function sendPasswordResetLink(payload: SendPasswordResetLinkPayload): Promise<string> {
  const res = await api.post<PasswordResetMessageResponse>("/auth/password-reset-link", payload, undefined, {
    skipUnauthorizedHandler: true,
  });

  if (!isApiSuccess(res)) throw res;

  return res.data.message;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  const res = await api.post<PasswordResetMessageResponse>("/auth/password-reset", payload, undefined, {
    skipUnauthorizedHandler: true,
  });

  if (!isApiSuccess(res)) throw res;

  return res.data.message;
}
