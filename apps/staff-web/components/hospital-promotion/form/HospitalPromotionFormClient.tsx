"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@beaulab/ui-admin";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import {
  PromotionHistorySection,
  type PromotionHistories,
} from "@/components/hospital-promotion/detail/PromotionHistorySection";
import { useHospitalPromotionForm } from "@/hooks/hospital-promotion/useHospitalPromotionForm";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { HospitalPromotionDetail } from "@/lib/hospital-promotion/types";
import { PromotionContentSection } from "./PromotionContentSection";
import { PromotionSettingsSection } from "./PromotionSettingsSection";

export default function HospitalPromotionFormClient({
  detail,
  history,
}: {
  detail?: HospitalPromotionDetail;
  history?: PromotionHistories;
}) {
  const router = useRouter();
  const state = useHospitalPromotionForm(detail);
  const { canEdit, canSave, isSubmitting, saved, returnTo, setField, handleBlur } = state;
  const onContentChange = React.useCallback((value: string) => setField("content", value), [setField]);
  const onContentBlur = React.useCallback(() => handleBlur("content"), [handleBlur]);
  const actions = React.useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSubmitting || saved}
          onClick={() => router.push(returnTo)}
        >
          취소
        </Button>
        <Button type="submit" form="hospital-promotion-form" size="sm" variant="brand" disabled={!canSave}>
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    ),
    [canSave, isSubmitting, returnTo, router, saved],
  );
  usePageHeaderExtra(canEdit ? actions : null);

  if (!canEdit)
    return <LoadErrorState title="프로모션 편집 권한이 없습니다." message="등록 또는 수정 권한을 확인해 주세요." />;
  return (
    <form
      id="hospital-promotion-form"
      noValidate
      onSubmit={state.handleSubmit}
      className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,1fr)]"
    >
      <PromotionContentSection
        content={state.form.content}
        banner={state.banner}
        existingBanner={detail?.banner}
        bannerError={state.errors.banner}
        contentError={state.errors.content}
        disabled={isSubmitting || saved}
        onBannerChange={state.changeBanner}
        onContentChange={onContentChange}
        onUploadImage={state.uploadImage}
        onContentBlur={onContentBlur}
      />
      <aside className="min-w-0 space-y-4">
        <PromotionSettingsSection
          form={state.form}
          errors={state.errors}
          disabled={isSubmitting || saved}
          isEditing={Boolean(detail)}
          minStartDate={state.minStartDate}
          canStatus={state.canStatus}
          scheduleLocked={state.scheduleLocked}
          progress={state.progress}
          periodWarning={state.periodWarning}
          scheduleConflict={state.scheduleConflict}
          checkingAvailability={state.checkingAvailability}
          periodOpen={state.periodOpen}
          onPeriodOpenChange={state.setPeriodOpen}
          onPeriodChange={state.changePeriod}
          onFieldChange={state.setField}
          onBlur={state.handleBlur}
        />
        {history ? <PromotionHistorySection history={history} /> : null}
      </aside>
    </form>
  );
}
