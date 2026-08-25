import type { BadgeColor } from "@beaulab/ui-admin";

export const HOSPITAL_ACCOUNT_INVITATION_PERMISSIONS = {
  show: "beaulab.hospital_account_invitation.show",
  update: "beaulab.hospital_account_invitation.update",
} as const;

export type HospitalAccountInvitationSourceType = "HOSPITAL" | "HOSPITAL_ENTRY";

export type HospitalAccountInvitation = {
  id: number;
  source_type: HospitalAccountInvitationSourceType;
  source_id: number;
  recipient_email: string;
  status: {
    code: "ACTIVE" | "USED" | "REVOKED" | "EXPIRED" | string;
    label: string;
  };
  expires_at?: string | null;
  sent_at?: string | null;
  used_at?: string | null;
  revoked_at?: string | null;
  created_by_staff?: {
    id: number;
    name: string;
  } | null;
  completed_account_hospital_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalAccountInvitationSendResponse = {
  invitation: HospitalAccountInvitation;
  message: string;
};

export const HOSPITAL_ACCOUNT_INVITATIONS_PER_PAGE = 5;

export function hospitalAccountInvitationStatusColor(status?: string | null): BadgeColor {
  if (status === "ACTIVE") return "info";
  if (status === "USED") return "success";
  if (status === "REVOKED") return "error";
  if (status === "EXPIRED") return "gray";

  return "light";
}

export function formatHospitalAccountInvitationDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function validateHospitalAccountInvitationEmail(value: string) {
  const email = value.trim();

  if (!email) return "이메일 주소를 입력해 주세요.";
  if (email.length > 255) return "이메일 주소는 255자 이하로 입력해 주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 주소를 입력해 주세요.";

  return null;
}
