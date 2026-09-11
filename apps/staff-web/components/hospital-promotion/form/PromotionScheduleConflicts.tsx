import Link from "next/link";
import { CircleAlert } from "@beaulab/ui-admin";
import { promotionPeriod } from "@/lib/hospital-promotion/list";
import { promotionPositionOption } from "@/lib/hospital-promotion/options";
import { PROMOTION_PATH, type PromotionAvailability } from "@/lib/hospital-promotion/types";

export function PromotionScheduleConflicts({ availability }: { availability: PromotionAvailability }) {
  return (
    <div role="alert" className="mt-3 min-w-0 text-xs leading-relaxed">
      <p className="flex items-start gap-1.5 font-medium text-error-600">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        같은 게시위치에 겹치는 일정이 있습니다.
      </p>
      {availability.conflicts.length ? (
        <ul className="mt-2 max-h-60 space-y-2 overflow-y-auto">
          {availability.conflicts.map((promotion) => (
            <li key={promotion.id}>
              <Link
                href={`${PROMOTION_PATH}/${promotion.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-800 transition-colors hover:border-brand-300 hover:bg-brand-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                aria-label={`${promotion.title} 상세 새 창에서 보기`}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span className="pt-0.5 text-xs text-gray-400 tabular-nums">#{promotion.id}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium break-words">{promotion.title}</span>
                </div>
                <dl className="mt-2 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                  <dt className="text-gray-500">게시위치</dt>
                  <dd className="min-w-0 text-gray-700">
                    {promotionPositionOption(promotion.side, String(promotion.slot))?.label}
                  </dd>
                  <dt className="text-gray-500">게시기간</dt>
                  <dd className="min-w-0 text-gray-700 tabular-nums">
                    {promotionPeriod(promotion.start_date, promotion.end_date)}
                  </dd>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-gray-500">겹치는 프로모션의 상세 정보는 조회 권한이 필요합니다.</p>
      )}
      {availability.has_more ? (
        <p className="mt-2 text-gray-500">겹치는 일정이 더 있습니다. 목록에서 해당 게시기간을 확인해 주세요.</p>
      ) : null}
    </div>
  );
}
