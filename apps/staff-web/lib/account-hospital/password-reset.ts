import { api } from "@/lib/common/api";

export const HOSPITAL_ACCOUNT_PASSWORD_RESET_PERMISSION = "beaulab.hospital_account_password_reset.send";

export type HospitalAccountPasswordResetSendResponse = {
  message: string;
  email: string;
  expires_at: string | null;
  resend_after_seconds: number;
};

export function sendHospitalAccountPasswordResetLink(hospitalId: number, recipientEmail: string) {
  return api.post<HospitalAccountPasswordResetSendResponse>(`/hospitals/${hospitalId}/password-reset-link`, {
    recipient_email: recipientEmail,
  });
}
