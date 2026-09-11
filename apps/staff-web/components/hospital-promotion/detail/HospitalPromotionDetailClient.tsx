"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, SpinnerBlock } from "@beaulab/ui-admin";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { useOperationHistories } from "@/hooks/common/useOperationHistories";
import { useHospitalPromotionDetail } from "@/hooks/hospital-promotion/useHospitalPromotionDetail";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { PROMOTION_API, PROMOTION_PATH, PROMOTION_PERMISSIONS } from "@/lib/hospital-promotion/types";
import { PromotionBannerCard, PromotionContentCard, PromotionSettingsCard } from "./PromotionDetailSections";
import { PromotionHistorySection } from "./PromotionHistorySection";

export default function HospitalPromotionDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  const { detail, isLoading, loadError } = useHospitalPromotionDetail(id);
  const history = useOperationHistories(
    Number.isSafeInteger(id) && id > 0 ? `${PROMOTION_API}/${id}/operation-histories` : null,
  );
  const returnTo = buildReturnToPath({ searchParams, fallbackPath: PROMOTION_PATH });
  const editPath = `${PROMOTION_PATH}/${id}/edit?returnTo=${encodeURIComponent(returnTo)}`;
  const actions = React.useMemo(
    () => (
      <Can permission={PROMOTION_PERMISSIONS.update}>
        <Button size="sm" variant="brand" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    ),
    [editPath, router],
  );
  usePageHeaderExtra(isLoading || loadError || !detail ? null : actions);

  if (isLoading) return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  if (loadError || !detail)
    return (
      <LoadErrorState
        title="프로모션 정보를 불러오지 못했습니다."
        message={loadError ?? "프로모션 정보를 찾을 수 없습니다."}
      />
    );
  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,1fr)]">
      <div className="min-w-0 space-y-4">
        <PromotionBannerCard detail={detail} />
        <PromotionContentCard detail={detail} />
      </div>
      <aside className="min-w-0 space-y-4">
        <PromotionSettingsCard detail={detail} />
        <PromotionHistorySection history={history} />
      </aside>
    </div>
  );
}
