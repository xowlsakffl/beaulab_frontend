export type HospitalAccountCreateFieldName =
  "nickname" | "password" | "password_confirmation" | "email" | "code" | "email_verification_token";

export type HospitalAccountCreateFieldErrors = Partial<Record<HospitalAccountCreateFieldName, string>>;

export const EMAIL_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9]{64}$/;

export function validateHospitalAccountCreateForm({
  nickname,
  password,
  passwordConfirmation,
  email,
  emailVerificationToken,
}: {
  nickname: string;
  password: string;
  passwordConfirmation: string;
  email: string;
  emailVerificationToken: string;
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

  if (!isValidEmail(email)) errors.email = "이메일 주소를 정확히 입력해 주세요.";
  if (!EMAIL_VERIFICATION_TOKEN_PATTERN.test(emailVerificationToken)) {
    errors.email_verification_token = "이메일 인증을 완료해 주세요.";
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
    "email",
    "code",
    "email_verification_token",
  ];

  fields.forEach((field) => {
    const value = source[field];
    if (typeof value === "string") result[field] = value;
    else if (Array.isArray(value) && typeof value[0] === "string") result[field] = value[0];
  });

  return result;
}

export function isValidEmail(value: string) {
  return value.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
