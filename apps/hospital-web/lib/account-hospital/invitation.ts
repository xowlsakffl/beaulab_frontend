import type { ApiResponse } from "@beaulab/types";

import { hospitalApi } from "@/lib/common/api";

export type HospitalAccountInvitation = {
  hospital_name: string;
  expires_at: string | null;
  phone_verification_required: boolean;
};

export type HospitalAccountPhoneVerification = {
  verification_id: number;
  phone: string;
  code_expires_at: string | null;
  resend_after_seconds: number;
};

export type HospitalAccountPhoneVerificationResult = {
  phone_verification_token: string;
  phone: string;
  expires_at: string | null;
};

export type HospitalAccountInvitationCompletion = {
  account_hospital_id: number;
  hospital_id: number;
  message: string;
};

export type HospitalAccountInvitationPayload = {
  nickname: string;
  password: string;
  password_confirmation: string;
  phone_verification_token: string;
};

type ApiResultWithStatus<T> = {
  status: number;
  payload: ApiResponse<T>;
};

export async function getHospitalAccountInvitation(
  token: string,
): Promise<ApiResultWithStatus<HospitalAccountInvitation>> {
  const result = await hospitalApi.rawWithResponse<HospitalAccountInvitation>(
    `/auth/account-invitations/${encodeURIComponent(token)}`,
    {
      method: "GET",
      skipUnauthorizedHandler: true,
    },
  );

  return {
    status: result.response.status,
    payload: result.payload,
  };
}

export async function completeHospitalAccountInvitation(
  token: string,
  payload: HospitalAccountInvitationPayload,
): Promise<ApiResultWithStatus<HospitalAccountInvitationCompletion>> {
  const result = await hospitalApi.rawWithResponse<HospitalAccountInvitationCompletion>(
    `/auth/account-invitations/${encodeURIComponent(token)}`,
    {
      method: "POST",
      body: payload,
      skipUnauthorizedHandler: true,
    },
  );

  return {
    status: result.response.status,
    payload: result.payload,
  };
}

export async function sendHospitalAccountPhoneVerification(token: string, phone: string) {
  const result = await hospitalApi.rawWithResponse<HospitalAccountPhoneVerification>(
    `/auth/account-invitations/${encodeURIComponent(token)}/phone-verifications`,
    {
      method: "POST",
      body: { phone },
      skipUnauthorizedHandler: true,
    },
  );

  return {
    status: result.response.status,
    payload: result.payload,
  };
}

export async function verifyHospitalAccountPhoneVerification(token: string, verificationId: number, code: string) {
  const result = await hospitalApi.rawWithResponse<HospitalAccountPhoneVerificationResult>(
    `/auth/account-invitations/${encodeURIComponent(token)}/phone-verifications/${verificationId}/verify`,
    {
      method: "POST",
      body: { code },
      skipUnauthorizedHandler: true,
    },
  );

  return {
    status: result.response.status,
    payload: result.payload,
  };
}
