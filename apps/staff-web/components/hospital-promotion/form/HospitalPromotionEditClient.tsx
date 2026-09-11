"use client";

import { useParams } from "next/navigation";
import { SpinnerBlock } from "@beaulab/ui-admin";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { useOperationHistories } from "@/hooks/common/useOperationHistories";
import { useHospitalPromotionDetail } from "@/hooks/hospital-promotion/useHospitalPromotionDetail";
import { PROMOTION_API } from "@/lib/hospital-promotion/types";
import HospitalPromotionFormClient from "./HospitalPromotionFormClient";

export default function HospitalPromotionEditClient() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { detail, isLoading, loadError } = useHospitalPromotionDetail(id);
  const history = useOperationHistories(
    Number.isSafeInteger(id) && id > 0 ? `${PROMOTION_API}/${id}/operation-histories` : null,
  );

  if (isLoading) return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  if (loadError || !detail)
    return (
      <LoadErrorState
        title="프로모션 정보를 불러오지 못했습니다."
        message={loadError ?? "프로모션 정보를 찾을 수 없습니다."}
      />
    );
  return <HospitalPromotionFormClient key={detail.id} detail={detail} history={history} />;
}
