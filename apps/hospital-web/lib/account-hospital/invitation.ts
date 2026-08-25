import type { ApiResponse } from "@beaulab/types";

import { hospitalApi } from "@/lib/common/api";

export type HospitalAccountInvitation = {
  hospital_name: string;
  expires_at: string | null;
  identity_verification_required: boolean;
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
  identity_verification_token: string;
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
