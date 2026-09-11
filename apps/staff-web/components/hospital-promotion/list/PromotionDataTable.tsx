import { DataTable, StatusValueBadge, type DataTableColumn, type DataTableMeta } from "@beaulab/ui-admin";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import { formatLocalDateTime } from "@/lib/common/date-time";
import { promotionPeriod } from "@/lib/hospital-promotion/list";
import { labelPromotionProgress, promotionProgressColor } from "@/lib/hospital-promotion/options";
import type { HospitalPromotion, PromotionSlot } from "@/lib/hospital-promotion/types";

type Row = PromotionSlot & { id: string };
type Props = {
  title?: string;
  description?: string;
  rows: Row[];
  onOpenDetail: (promotion: HospitalPromotion) => void;
  ended?: boolean;
  upcoming?: boolean;
  meta?: DataTableMeta | null;
  onGoPage?: (page: number) => void;
  refreshing?: boolean;
  highlightedId?: number | null;
};

export function promotionRows(items: HospitalPromotion[]): Row[] {
  return items.map((promotion) => ({
    id: String(promotion.id),
    promotion,
    slot: promotion.slot,
    filtered_out: false,
  }));
}

export function PromotionDataTable({
  title,
  description,
  rows,
  onOpenDetail,
  ended,
  upcoming,
  meta,
  onGoPage,
  refreshing,
  highlightedId,
}: Props) {
  const padding = ended ? "px-4" : "px-2";
  const head = `${padding} py-3 text-left text-theme-xs font-semibold text-gray-600`;
  const cell = `${padding} py-4 align-middle text-theme-sm text-gray-700`;
  const columns: DataTableColumn<Row>[] = [
    ...(upcoming
      ? [
          {
            key: "queue",
            header: "대기순번",
            headerClassName: `${head} w-[64px]`,
            cellClassName: `${cell} text-center`,
            render: (row: Row) => ((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? 15) + rows.indexOf(row) + 1,
          },
        ]
      : []),
    ...(!upcoming && !ended
      ? [
          {
            key: "slot",
            header: "노출순서",
            headerClassName: `${head} w-[64px]`,
            cellClassName: `${cell} text-center`,
            render: (row: Row) => row.slot,
          },
        ]
      : []),
    {
      key: "id",
      header: "ID",
      headerClassName: `${head} ${ended ? "w-[64px]" : "w-[56px]"}`,
      cellClassName: cell,
      render: (row) => row.promotion?.id ?? "-",
    },
    ...(ended
      ? [
          {
            key: "created_at",
            header: "작성일",
            headerClassName: `${head} w-[168px]`,
            cellClassName: `${cell} whitespace-nowrap tabular-nums`,
            render: ({ promotion }: Row) => formatLocalDateTime(promotion?.created_at),
          },
        ]
      : []),
    {
      key: "title",
      header: "프로모션",
      headerClassName: head,
      cellClassName: cell,
      render: (row) =>
        row.promotion ? (
          <span className="block truncate font-medium text-gray-800" title={row.promotion.title}>
            {row.promotion.title}
          </span>
        ) : (
          <span className="text-xs text-gray-400">{row.filtered_out ? "검색 조건 불일치" : "미등록"}</span>
        ),
    },
    {
      key: "period",
      header: "기간",
      headerClassName: `${head} ${ended ? "w-[236px]" : "w-[130px]"}`,
      cellClassName: ended ? `${cell} whitespace-nowrap tabular-nums` : `${cell} text-xs`,
      render: ({ promotion }) =>
        promotion ? (
          ended ? (
            promotionPeriod(promotion.start_date, promotion.end_date)
          ) : (
            <span title={promotionPeriod(promotion.start_date, promotion.end_date)} className="block leading-5">
              <span className="block">{promotion.start_date.replaceAll("-", ".")} ~</span>
              <span className="block">{promotion.end_date.replaceAll("-", ".")}</span>
            </span>
          )
        ) : (
          "-"
        ),
    },
    ...(upcoming
      ? [
          {
            key: "slot",
            header: "예정노출순서",
            headerClassName: `${head} w-[90px]`,
            cellClassName: `${cell} text-center`,
            render: (row: Row) => row.slot,
          },
        ]
      : [
          {
            key: "status",
            header: "공개여부",
            headerClassName: `${head} ${ended ? "w-[104px]" : "w-[90px]"}`,
            cellClassName: cell,
            render: ({ promotion }: Row) =>
              promotion ? (
                <StatusValueBadge
                  label={promotion.status === "ACTIVE" ? "공개" : "비공개"}
                  color={ownerVisibilityStatusColor(promotion.status)}
                />
              ) : (
                "-"
              ),
          },
        ]),
    ...(ended
      ? [
          {
            key: "progress",
            header: "진행상태",
            headerClassName: `${head} w-[104px]`,
            cellClassName: cell,
            render: ({ promotion }: Row) =>
              promotion ? (
                <StatusValueBadge
                  label={labelPromotionProgress(promotion.progress)}
                  color={promotionProgressColor(promotion.progress)}
                />
              ) : (
                "-"
              ),
          },
        ]
      : []),
    {
      key: "clicks",
      header: "클릭수",
      headerClassName: `${head} ${ended ? "w-[80px]" : "w-[60px]"}`,
      cellClassName: cell,
      render: (row) => row.promotion?.click_count.toLocaleString() ?? "-",
    },
    {
      key: "creator",
      header: "담당자",
      headerClassName: `${head} ${ended ? "w-[112px]" : "w-[88px]"}`,
      cellClassName: `${cell} break-words`,
      render: (row) => row.promotion?.creator?.name || "-",
    },
  ];

  return (
    <DataTable
      title={title}
      headerClassName={description ? "pb-2" : undefined}
      description={
        description ? <span className="mt-6 block text-sm font-semibold text-gray-800">{description}</span> : undefined
      }
      tableClassName="w-full table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      onRowClick={(row) => {
        if (row.promotion) onOpenDetail(row.promotion);
      }}
      getRowClassName={(row) =>
        [
          !upcoming && !ended ? "h-[74px]" : "",
          row.promotion?.id === highlightedId ? "bg-emerald-50/90" : "",
          !row.promotion ? "bg-gray-50/60" : "",
        ].join(" ")
      }
      getRowPlaceholder={(row) =>
        row.promotion ? null : (
          <span className="text-sm font-medium text-gray-500">{row.filtered_out ? "검색 조건 불일치" : "미등록"}</span>
        )
      }
      emptyText="조건에 맞는 프로모션이 없습니다."
      meta={meta}
      onGoPage={onGoPage}
      refreshing={refreshing}
      hideFooterSummary
      footerLeft={
        meta ? (
          <span className="text-xs whitespace-nowrap text-gray-500">총 {meta.total.toLocaleString()}개</span>
        ) : undefined
      }
    />
  );
}
