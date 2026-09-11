"use client";

import React from "react";
import { hasPermission } from "@beaulab/auth";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert } from "@beaulab/ui-admin";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormFieldFocus } from "@/hooks/common/useFormFieldFocus";
import { usePromotionEditorImages } from "./usePromotionEditorImages";
import { getSession } from "@/lib/common/auth/session";
import { parseDateParam } from "@/lib/common/date-range-filter";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { fetchPromotionAvailability, saveHospitalPromotion } from "@/lib/hospital-promotion/api";
import { getPromotionProgress, promotionTodayKst } from "@/lib/hospital-promotion/detail";
import {
  buildPromotionFormData,
  extractPromotionFieldErrors,
  extractPromotionAvailability,
  INITIAL_PROMOTION_FORM,
  mapPromotionDetailToForm,
  PROMOTION_CONFLICT_MESSAGE,
  PROMOTION_FIELD_FOCUS_ORDER,
  PROMOTION_PAST_START_DATE_MESSAGE,
  promotionFormChanged,
  promotionSaveErrorMessage,
  validatePromotionBanner,
  validatePromotionForm,
  type PromotionFieldName,
  type PromotionFormErrors,
  type PromotionFormValues,
} from "@/lib/hospital-promotion/form";
import {
  PROMOTION_PATH,
  PROMOTION_PERMISSIONS,
  type HospitalPromotionDetail,
  type PromotionAvailability,
} from "@/lib/hospital-promotion/types";

export function useHospitalPromotionForm(detail?: HospitalPromotionDetail) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const auth = getSession()?.auth;
  const canEdit = hasPermission(auth, detail ? PROMOTION_PERMISSIONS.update : PROMOTION_PERMISSIONS.create);
  const canStatus = hasPermission(auth, PROMOTION_PERMISSIONS.status);
  const scheduleLocked = detail?.status === "ACTIVE" && !canStatus;
  const initial = React.useMemo(() => (detail ? mapPromotionDetailToForm(detail) : INITIAL_PROMOTION_FORM), [detail]);
  const [form, setForm] = React.useState<PromotionFormValues>(initial);
  const [banner, setBanner] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<PromotionFormErrors>({});
  const [periodOpen, setPeriodOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const submitting = React.useRef(false);
  const [today, setToday] = React.useState(promotionTodayKst);
  const { uploadImage, isUploading, beginSave, finishSave } = usePromotionEditorImages(detail?.id);
  const availabilityRequest = React.useRef(0);
  const [availability, setAvailability] = React.useState<{
    key: string;
    result: PromotionAvailability | null;
    checking: boolean;
  }>({ key: "", result: null, checking: false });
  const resolveTarget = React.useCallback((field: PromotionFieldName) => {
    if (field === "side" || field === "slot") return document.getElementById("promotion-position");
    if (field === "start_date" || field === "end_date")
      return document.querySelector<HTMLElement>("#promotion-period button");
    return document.getElementById(`promotion-${field}`);
  }, []);
  const { focusFirstErrorField } = useFormFieldFocus({ focusOrder: PROMOTION_FIELD_FOCUS_ORDER, resolveTarget });

  React.useEffect(() => {
    const timer = window.setInterval(() => setToday(promotionTodayKst()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const setField = React.useCallback(
    <K extends keyof PromotionFormValues>(field: K, value: PromotionFormValues[K]) => {
      if (submitting.current || !canEdit || (field === "status" && !canStatus)) return;
      if (scheduleLocked && ["side", "slot", "start_date", "end_date"].includes(field)) return;
      setForm((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        if (["side", "slot", "start_date", "end_date", "status"].includes(field)) {
          delete next.start_date;
          delete next.end_date;
          for (const scheduleField of ["side", "slot"] as const) {
            if (next[scheduleField]?.includes(PROMOTION_CONFLICT_MESSAGE)) delete next[scheduleField];
          }
        }
        return next;
      });
    },
    [canEdit, canStatus, scheduleLocked],
  );

  const changeBanner = React.useCallback(
    (file: File | null) => {
      if (submitting.current || !canEdit) return;
      const message = file ? validatePromotionBanner(file) : null;
      setErrors((current) => ({ ...current, banner: message ?? undefined }));
      if (message) return;
      setBanner(file);
    },
    [canEdit],
  );

  const changePeriod = React.useCallback(
    (period: Pick<PromotionFormValues, "start_date" | "end_date">) => {
      if (submitting.current || !canEdit || scheduleLocked) return;
      const nextErrors = validatePromotionForm(
        { ...form, ...period },
        banner,
        Boolean(detail?.banner),
        detail ? null : promotionTodayKst(),
      );
      setForm((current) =>
        current.start_date === period.start_date && current.end_date === period.end_date
          ? current
          : { ...current, ...period },
      );
      setErrors((current) => {
        const next = { ...current, start_date: nextErrors.start_date, end_date: nextErrors.end_date };
        for (const field of ["side", "slot"] as const) {
          if (next[field]?.includes(PROMOTION_CONFLICT_MESSAGE)) delete next[field];
        }
        return next;
      });
    },
    [banner, canEdit, detail, form, scheduleLocked],
  );

  const availabilityQuery = React.useMemo(
    () => ({
      side: form.side,
      slot: form.slot,
      start_date: form.start_date,
      end_date: form.end_date,
      ...(detail ? { exclude_id: detail.id } : {}),
    }),
    [detail, form.end_date, form.side, form.slot, form.start_date],
  );
  const availabilityKey = JSON.stringify(availabilityQuery);
  const hasPastStartDate = !detail && Boolean(parseDateParam(form.start_date)) && form.start_date < today;
  const checkEnabled =
    !hasPastStartDate &&
    (form.side === "LEFT" || form.side === "RIGHT") &&
    ["1", "2", "3"].includes(form.slot) &&
    Boolean(parseDateParam(form.start_date) && parseDateParam(form.end_date)) &&
    form.start_date <= form.end_date;

  React.useEffect(() => {
    if (!checkEnabled || scheduleLocked || periodOpen) return;
    const controller = new AbortController();
    const request = ++availabilityRequest.current;
    setAvailability((current) => ({
      key: availabilityKey,
      result: current.key === availabilityKey ? current.result : null,
      checking: true,
    }));
    void (async () => {
      try {
        const response = await fetchPromotionAvailability(availabilityQuery, controller.signal);
        if (!controller.signal.aborted && request === availabilityRequest.current)
          setAvailability({
            key: availabilityKey,
            result: isApiSuccess(response) ? response.data : null,
            checking: false,
          });
      } catch {
        if (!controller.signal.aborted && request === availabilityRequest.current)
          setAvailability({ key: availabilityKey, result: null, checking: false });
      }
    })();
    return () => {
      controller.abort();
    };
  }, [availabilityKey, availabilityQuery, checkEnabled, periodOpen, scheduleLocked]);

  const conflict =
    checkEnabled && !scheduleLocked && availability.key === availabilityKey && availability.result?.available === false;
  const checkingAvailability =
    checkEnabled && !scheduleLocked && !periodOpen && (availability.key !== availabilityKey || availability.checking);
  const validationErrors = validatePromotionForm(form, banner, Boolean(detail?.banner), detail ? null : today);
  const isDirty = Boolean(banner) || promotionFormChanged(form, initial);
  const canSave =
    canEdit &&
    isDirty &&
    Object.keys(validationErrors).length === 0 &&
    !conflict &&
    !periodOpen &&
    !checkingAvailability &&
    !isSubmitting &&
    !isUploading &&
    !saved;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || !canEdit || !isDirty || isUploading || saved || periodOpen || checkingAvailability)
      return;
    if (conflict) {
      focusFirstErrorField({ start_date: PROMOTION_CONFLICT_MESSAGE });
      return;
    }
    const nextErrors = validatePromotionForm(
      form,
      banner,
      Boolean(detail?.banner),
      detail ? null : promotionTodayKst(),
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstErrorField(nextErrors);
      return;
    }
    if (!beginSave(form.content)) return;
    submitting.current = true;
    setIsSubmitting(true);
    let outcome: "saved" | "rejected" | "uncertain" = "uncertain";
    try {
      const response = await saveHospitalPromotion(
        buildPromotionFormData({ form, banner, includeStatus: canStatus, detail }),
        detail?.id,
      );
      if (!isApiSuccess(response)) {
        const fieldErrors = extractPromotionFieldErrors(response.error.details);
        const scheduleAvailability = extractPromotionAvailability(response.error.details);
        if (scheduleAvailability?.available === false) {
          outcome = "rejected";
          // The locking save check is newer than any pending preflight response.
          availabilityRequest.current += 1;
          setAvailability({ key: availabilityKey, result: scheduleAvailability, checking: false });
          setErrors({});
          focusFirstErrorField({ start_date: PROMOTION_CONFLICT_MESSAGE });
          return;
        }
        const message = promotionSaveErrorMessage(
          response.error.details,
          response.error.message || "프로모션 저장에 실패했습니다.",
        );
        // Only explicit validation/authorization failures prove the mutation was rejected.
        if (Object.keys(fieldErrors).length || /VALIDATION|FORBIDDEN|UNAUTHORIZED|CONFLICT/.test(response.error.code))
          outcome = "rejected";
        if (
          message.includes(PROMOTION_CONFLICT_MESSAGE) ||
          Object.values(fieldErrors).some((value) => value?.includes(PROMOTION_CONFLICT_MESSAGE))
        ) {
          fieldErrors.start_date = PROMOTION_CONFLICT_MESSAGE;
        }
        setErrors(fieldErrors);
        focusFirstErrorField(fieldErrors);
        showAlert({ variant: "error", title: "프로모션 저장 실패", message });
        return;
      }
      outcome = "saved";
      setSaved(true);
      showAlert({
        variant: "success",
        title: detail ? "프로모션 수정 완료" : "프로모션 등록 완료",
        message: "저장된 프로모션을 목록에서 확인할 수 있습니다.",
      });
      router.push(buildReturnToPath({ searchParams, fallbackPath: PROMOTION_PATH, highlightId: response.data.id }));
    } catch {
      showAlert({
        variant: "error",
        title: "프로모션 저장 실패",
        message: "프로모션 저장 중 오류가 발생했습니다. 입력 내용은 유지됩니다.",
      });
    } finally {
      finishSave(outcome);
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const handleBlur = React.useCallback(
    (field: PromotionFieldName) => {
      const message = validatePromotionForm(form, banner, Boolean(detail?.banner), detail ? null : promotionTodayKst())[
        field
      ];
      setErrors((current) => ({ ...current, [field]: message }));
    },
    [banner, detail, form],
  );

  return {
    form,
    banner,
    errors,
    setField,
    changeBanner,
    changePeriod,
    periodOpen,
    setPeriodOpen,
    handleBlur,
    handleSubmit,
    uploadImage,
    canEdit,
    canStatus,
    scheduleLocked,
    isSubmitting,
    canSave,
    saved,
    minStartDate: detail ? undefined : today,
    progress: getPromotionProgress(form.start_date, form.end_date, today),
    scheduleConflict: conflict ? availability.result : null,
    periodWarning: hasPastStartDate && !errors.start_date ? PROMOTION_PAST_START_DATE_MESSAGE : null,
    checkingAvailability,
    returnTo: buildReturnToPath({ searchParams, fallbackPath: PROMOTION_PATH }),
  };
}
