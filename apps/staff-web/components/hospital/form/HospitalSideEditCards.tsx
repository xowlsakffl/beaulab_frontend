"use client";

import { Button, Card, InputField, Mail, Send, StatusValueBadge } from "@beaulab/ui-admin";

import { reviewAllowStatusColor } from "@/lib/common/review-status";
import { formatHospitalWalletBalance, type AccountHospitalAsset } from "@/lib/hospital/detail";
import type { HospitalFormErrors, HospitalFormValues } from "@/lib/hospital/form";
import { labelReviewStatus } from "@/lib/hospital/list";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const readonlyValueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

export function HospitalVerifiedAccountContactEditCard({
  accountHospital,
  onOpenAccountInvitation,
  onOpenPasswordReset,
  className,
}: {
  accountHospital: AccountHospitalAsset | null;
  onOpenAccountInvitation?: () => void;
  onOpenPasswordReset?: () => void;
  className?: string;
}) {
  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">인증된 계정 연락처</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="brand"
            size="sm"
            disabled={!onOpenAccountInvitation}
            onClick={onOpenAccountInvitation}
          >
            <Mail className="size-4" />
            계정 생성 이메일
          </Button>
          <Button type="button" variant="brand" size="sm" disabled={!onOpenPasswordReset} onClick={onOpenPasswordReset}>
            <Send className="size-4" />
            비밀번호 재설정 링크
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <ReadonlyInfoField label="전화번호" value={accountHospital?.phone} compact />
      </div>
    </Card>
  );
}

export function HospitalAllowStatusReadOnlyCard({
  allowStatus,
  className,
}: {
  allowStatus: string;
  className?: string;
}) {
  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-8 gap-y-3">
        <h3 className="text-sm font-bold text-gray-900">검수상태</h3>
        <StatusValueBadge label={labelReviewStatus(allowStatus)} color={reviewAllowStatusColor(allowStatus)} />
      </div>
    </Card>
  );
}

function ReadonlyInfoField({
  label,
  value,
  compact = false,
  className,
}: {
  label: string;
  value?: string | number | null;
  compact?: boolean;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div
      className={[
        compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className={labelClassName}>{label}</p>
      <p className={readonlyValueClassName}>{displayValue}</p>
    </div>
  );
}

export function HospitalPointEditCard({ walletBalance }: { walletBalance?: number | string | null }) {
  return (
    <Card className={cardClassName}>
      <div className="flex min-h-[6.25rem] flex-col justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">현재 충전금 잔액</h3>
        <p className="text-right text-base font-bold text-gray-900">{formatHospitalWalletBalance(walletBalance)}</p>
      </div>
    </Card>
  );
}

export function HospitalAdReceptionEditCard({
  form,
  errors,
  onFieldChange,
}: {
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
}) {
  return (
    <Card className={[cardClassName, "flex-1"].join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">광고 안내 수신 접수전화번호</h3>
      <div className="space-y-4">
        <CompactPhoneField
          id="ad_reception_phone_1"
          label="[필수] 담당자1"
          required
          placeholder="필수 담당자 전화번호를 입력해 주세요."
          value={form.ad_reception_phone_1}
          error={errors.ad_reception_phone_1}
          onChange={(value) => onFieldChange("ad_reception_phone_1", value)}
        />
        <CompactPhoneField
          id="ad_reception_phone_2"
          label="[선택] 담당자2"
          placeholder="추가 담당자 전화번호를 입력해 주세요."
          value={form.ad_reception_phone_2}
          error={errors.ad_reception_phone_2}
          onChange={(value) => onFieldChange("ad_reception_phone_2", value)}
        />
        <CompactPhoneField
          id="ad_reception_phone_3"
          label="[선택] 담당자3"
          placeholder="추가 담당자 전화번호를 입력해 주세요."
          value={form.ad_reception_phone_3}
          error={errors.ad_reception_phone_3}
          onChange={(value) => onFieldChange("ad_reception_phone_3", value)}
        />
      </div>
    </Card>
  );
}

function CompactPhoneField({
  id,
  label,
  required = false,
  value,
  error,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
      <p className={labelClassName}>
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <InputField
        id={id}
        name={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        error={Boolean(error)}
        className="h-11 bg-white px-4 py-2.5"
      />
      {error ? <p className="col-span-2 text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function RequiredMark() {
  return <span className="text-error-500">*</span>;
}
