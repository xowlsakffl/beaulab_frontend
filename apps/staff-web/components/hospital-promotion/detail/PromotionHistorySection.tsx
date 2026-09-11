import { OperationHistoryCard } from "@/components/common/OperationHistoryCard";
import type { useOperationHistories } from "@/hooks/common/useOperationHistories";
import { formatPromotionDateTime } from "@/lib/hospital-promotion/detail";
import { labelPromotionStatus, promotionStatusColor } from "@/lib/hospital-promotion/options";

export type PromotionHistories = ReturnType<typeof useOperationHistories>;

export function PromotionHistorySection({ history }: { history: PromotionHistories }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <OperationHistoryCard
        histories={history.histories}
        meta={history.meta}
        loading={history.loading}
        error={history.error}
        onPageChange={history.setPage}
        formatDateTime={formatPromotionDateTime}
        statusLabel={labelPromotionStatus}
        statusBadgeColor={promotionStatusColor}
        cardClassName="min-w-[420px] rounded-xl border border-gray-200 bg-white p-5"
      />
    </div>
  );
}
