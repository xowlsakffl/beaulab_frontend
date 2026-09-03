import { hospitalApi } from "@/lib/common/api";

type HospitalPasswordResetVerification = {
  valid: boolean;
  hospital_name: string;
  masked_nickname: string;
};

export function verifyHospitalPasswordResetToken(token: string) {
  return hospitalApi.rawWithResponse<HospitalPasswordResetVerification>("/auth/password-reset/verify", {
    method: "POST",
    body: { token },
    cache: "no-store",
    skipUnauthorizedHandler: true,
  });
}

export function resetHospitalPassword(token: string, password: string, passwordConfirmation: string) {
  return hospitalApi.rawWithResponse<{ message: string }>("/auth/password-reset", {
    method: "POST",
    body: { token, password, password_confirmation: passwordConfirmation },
    skipUnauthorizedHandler: true,
  });
}
