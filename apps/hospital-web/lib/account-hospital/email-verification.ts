import { hospitalApi } from "@/lib/common/api";

export type EmailVerificationSent = {
  verification_id: number;
  email: string;
  code_expires_at: string;
  resend_after_seconds: number;
};
export type EmailVerificationResult = {
  email_verification_token: string;
  email: string;
  expires_at: string;
};

function endpoint(invitationToken: string) {
  return `/auth/account-invitations/${encodeURIComponent(invitationToken)}/email-verifications`;
}
export function sendEmailVerification(invitationToken: string, email: string) {
  return hospitalApi.rawWithResponse<EmailVerificationSent>(endpoint(invitationToken), {
    method: "POST",
    body: { email },
    skipUnauthorizedHandler: true,
  });
}
export function verifyEmailCode(invitationToken: string, id: number, code: string) {
  return hospitalApi.rawWithResponse<EmailVerificationResult>(`${endpoint(invitationToken)}/${id}/verify`, {
    method: "POST",
    body: { code },
    skipUnauthorizedHandler: true,
  });
}
