export type HospitalAccountCreateFieldName =
  "nickname" | "password" | "password_confirmation" | "phone" | "code" | "phone_verification_token";

export type HospitalAccountCreateFieldErrors = Partial<Record<HospitalAccountCreateFieldName, string>>;

export const PHONE_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9]{64}$/;

export function validateHospitalAccountCreateForm({
  nickname,
  password,
  passwordConfirmation,
  phone,
  phoneVerificationToken,
}: {
  nickname: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  phoneVerificationToken: string;
}): HospitalAccountCreateFieldErrors {
  const errors: HospitalAccountCreateFieldErrors = {};
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) errors.nickname = "아이디를 입력해 주세요.";
  else if (trimmedNickname.length < 4) errors.nickname = "아이디는 4자 이상 입력해 주세요.";
  else if (!/^[A-Za-z0-9._-]+$/.test(trimmedNickname)) {
    errors.nickname = "아이디는 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.";
  }

  if (!password) errors.password = "비밀번호를 입력해 주세요.";
  else if (password.length < 8) errors.password = "비밀번호는 8자 이상 입력해 주세요.";

  if (!passwordConfirmation) errors.password_confirmation = "비밀번호 확인을 입력해 주세요.";
  else if (password !== passwordConfirmation) errors.password_confirmation = "비밀번호 확인이 일치하지 않습니다.";

  if (!isValidPhone(phone)) errors.phone = "휴대폰 번호를 정확히 입력해 주세요.";
  if (!PHONE_VERIFICATION_TOKEN_PATTERN.test(phoneVerificationToken)) {
    errors.phone_verification_token = "휴대폰 인증을 완료해 주세요.";
  }

  return errors;
}

export function extractHospitalAccountCreateFieldErrors(details: unknown): HospitalAccountCreateFieldErrors {
  if (typeof details !== "object" || details === null) return {};

  const detailsRecord = details as Record<string, unknown>;
  const source =
    typeof detailsRecord.errors === "object" && detailsRecord.errors !== null
      ? (detailsRecord.errors as Record<string, unknown>)
      : detailsRecord;
  const result: HospitalAccountCreateFieldErrors = {};
  const fields: HospitalAccountCreateFieldName[] = [
    "nickname",
    "password",
    "password_confirmation",
    "phone",
    "code",
    "phone_verification_token",
  ];

  fields.forEach((field) => {
    const value = source[field];
    if (typeof value === "string") result[field] = value;
    else if (Array.isArray(value) && typeof value[0] === "string") result[field] = value[0];
  });

  return result;
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value: string) {
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(value);
}
