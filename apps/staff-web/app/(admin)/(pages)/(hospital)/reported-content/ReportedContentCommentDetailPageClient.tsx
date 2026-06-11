"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  SpinnerBlock,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { CategoryBadgeList } from "@beaulab/ui-admin";
import { ReportedContentDetailPanel } from "@/components/reported-content/detail/ReportedContentDetailPanel";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  buildHospitalReviewCommentContentPreview,
  type HospitalReviewCommentApiItem,
} from "@/lib/hospital-review/comment-list";
import {
  formatHospitalReviewAuthorName,
  resolveHospitalReviewMediaUrl,
  type HospitalReviewCategory,
  type HospitalReviewMediaAsset,
} from "@/lib/hospital-review/list";
import {
  formatHospitalReviewHistoryReason,
  getHospitalReviewDetailCategoryFullPaths,
  labelHospitalReviewHistoryChange,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import {
  formatReportedContentDetailDateTime,
  type ReportedContentDetailResponse,
  type ReportedContentTargetType,
} from "@/lib/reported-content/detail";
import {
  formatTalkCategoryName,
} from "@/lib/talk/list";
import {
  formatTalkHistoryReason,
  labelTalkHistoryChange,
  type TalkOperationHistory,
} from "@/lib/talk/detail";
import type { TalkCommentApiItem } from "@/lib/talk/comment-list";

type ReportedContentCommentDetailType =
  | "talk-comments"
  | "surgery-review-comments"
  | "treatment-review-comments";

type ReportedContentCommentDetailKind = "talk-comment" | "review-comment";

type ReportedContentCommentDetailConfig = {
  kind: ReportedContentCommentDetailKind;
  title: string;
  listPath: string;
  targetType: ReportedContentTargetType;
  historyApiPath: (id: number) => string;
};

type ReportedContentCommentDetailPageClientProps = {
  type: ReportedContentCommentDetailType;
};

type CommentTarget = (TalkCommentApiItem | HospitalReviewCommentApiItem) & {
  author_ip?: string | null;
};
type CommentHistory = TalkOperationHistory | HospitalReviewOperationHistory;
type CommentHistoryBlock = {
  items?: CommentHistory[] | null;
  meta?: DataTableMeta | null;
};

const COMMENT_DETAIL_CONFIGS: Record<ReportedContentCommentDetailType, ReportedContentCommentDetailConfig> = {
  "talk-comments": {
    kind: "talk-comment",
    title: "토크 댓글",
    listPath: "/reported-content/talks",
    targetType: "talk_comment",
    historyApiPath: (id) => `/talk-comments/${id}/operation-histories`,
  },
  "surgery-review-comments": {
    kind: "review-comment",
    title: "성형후기 댓글",
    listPath: "/reported-content/surgery-reviews",
    targetType: "hospital_review_comment",
    historyApiPath: (id) => `/hospital-review-comments/${id}/operation-histories`,
  },
  "treatment-review-comments": {
    kind: "review-comment",
    title: "시술후기 댓글",
    listPath: "/reported-content/treatment-reviews",
    targetType: "hospital_review_comment",
    historyApiPath: (id) => `/hospital-review-comments/${id}/operation-histories`,
  },
};

const COMMENT_HISTORY_PER_PAGE = 10;
const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 ";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 ";

export default function ReportedContentCommentDetailPageClient({
  type,
}: ReportedContentCommentDetailPageClientProps) {
  const config = COMMENT_DETAIL_CONFIGS[type];
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const targetId = Number(rawId);
  const [detail, setDetail] = React.useState<ReportedContentDetailResponse | null>(null);
  const [historyBlock, setHistoryBlock] = React.useState<CommentHistoryBlock | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [historiesPage, setHistoriesPage] = React.useState(1);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: `${config.listPath}?board=comments`,
        allowedPrefix: config.listPath,
        highlightId,
      }),
    [config.listPath, searchParams],
  );

  const fetchDetail = React.useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) {
      setError("올바르지 않은 신고 댓글 경로입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ReportedContentDetailResponse>(
        `/reported-contents/detail/${config.targetType}/${targetId}`,
      );

      if (!isApiSuccess(response)) {
        setError(response.error.message || "신고 댓글 상세 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setError("신고 댓글 상세 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [config.targetType, targetId]);

  const fetchHistories = React.useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) return;

    setRefreshing(true);
    setHistoryError(null);

    try {
      const response = await api.get<CommentHistory[]>(config.historyApiPath(targetId), {
        operation_histories_page: historiesPage,
        operation_histories_per_page: COMMENT_HISTORY_PER_PAGE,
      });

      if (!isApiSuccess(response)) {
        setHistoryBlock(null);
        setHistoryError(response.error.message || "신고 댓글 히스토리를 불러오지 못했습니다.");
        return;
      }

      setHistoryBlock({
        items: response.data,
        meta: (response.meta as DataTableMeta | null) ?? null,
      });
    } catch {
      setHistoryBlock(null);
      setHistoryError("신고 댓글 히스토리를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setRefreshing(false);
    }
  }, [config, historiesPage, targetId]);

  const refreshDetail = React.useCallback(async () => {
    await Promise.all([fetchDetail(), fetchHistories()]);
  }, [fetchDetail, fetchHistories]);

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  React.useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  if (loading && !detail) {
    return <SpinnerBlock label="신고 댓글 상세 정보를 불러오는 중" />;
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10">
          <p className="text-sm text-rose-600 ">{error || "신고 댓글 상세 정보가 없습니다."}</p>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  const target = detail.target as CommentTarget | null | undefined;
  const histories = historyBlock?.items ?? [];
  const historiesMeta = historyBlock?.meta ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          {renderCommentSummary(config, target, () => router.push(getReturnToPath(Number(detail.target_id ?? targetId))))}
          {renderCommentContent(config, target)}
          <CommentHistoryCard
            config={config}
            histories={histories}
            meta={historiesMeta}
            refreshing={refreshing}
            error={historyError}
            onGoPage={setHistoriesPage}
          />
        </div>

        <div className="space-y-6">
          <ReportedContentDetailPanel
            targetType={config.targetType}
            targetId={targetId}
            onStatusUpdated={() => void refreshDetail()}
          />
        </div>
      </div>
    </div>
  );
}

function renderCommentSummary(
  config: ReportedContentCommentDetailConfig,
  target: CommentTarget | null | undefined,
  onBack: () => void,
) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>회원정보</CardTitle>
          <div className="flex w-full flex-row gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onBack}
            >
              목록으로
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <DetailField label="작성자" value={formatCommentAuthorName(config, target)} />
        <DetailField label="작성일" value={formatReportedContentDetailDateTime(target?.created_at)} />
        <DetailField label="작성 IP" value={target?.author_ip?.trim() || "-"} />
        <DetailField label="노출여부" value={labelVisibility(target?.status)} />
      </CardContent>
    </Card>
  );
}

function renderCommentContent(config: ReportedContentCommentDetailConfig, target?: CommentTarget | null) {
  if (config.kind === "talk-comment") {
    const comment = target as TalkCommentApiItem | null | undefined;

    return (
      <Card as="section">
        <CardHeader className="pb-4">
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <DetailField label="토크유형" value={formatTalkCategoryName(comment?.category) || "-"} />
          <DetailField label="토크제목" value={comment?.parentTalkTitle?.trim() || comment?.parent_talk_title?.trim() || "-"} />
          <DetailField label="좋아요 수" value={Number(comment?.likeCount ?? comment?.like_count ?? 0).toLocaleString()} />
          {comment?.mention?.mention_text ? (
            <DetailField label="멘션" value={<MentionText text={comment.mention.mention_text} />} />
          ) : null}
          <ContentBox content={comment?.content} />
        </CardContent>
      </Card>
    );
  }

  const comment = target as HospitalReviewCommentApiItem | null | undefined;
  const categories = Array.isArray(comment?.categories) && comment.categories.length > 0
    ? comment.categories
    : comment?.parent?.categories ?? [];
  const beforeImages = comment?.parent?.before_images ?? [];
  const afterImages = comment?.parent?.after_images ?? [];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <DetailField label="카테고리" value={<CategoryBadges categories={categories} />} />
        <DetailField label="후기제목" value={comment?.parent?.title?.trim() || "-"} />
        <DetailField label="좋아요 수" value={Number(comment?.like_count ?? 0).toLocaleString()} />
        <ContentBox content={comment?.content || buildHospitalReviewCommentContentPreview(comment?.content)} />
        <ReviewImageGallery beforeImages={beforeImages} afterImages={afterImages} />
      </CardContent>
    </Card>
  );
}

function CommentHistoryCard({
  config,
  histories,
  meta,
  refreshing,
  error,
  onGoPage,
}: {
  config: ReportedContentCommentDetailConfig;
  histories: CommentHistory[];
  meta: DataTableMeta | null;
  refreshing: boolean;
  error: string | null;
  onGoPage: (page: number) => void;
}) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>히스토리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
            {error}
          </div>
        ) : histories.length > 0 ? (
          <div className="divide-y divide-gray-200 ">
            {histories.map((history) => (
              <div
                key={history.id}
                className="grid gap-2 py-3 text-sm text-gray-700 md:grid-cols-[10rem_8rem_8rem_minmax(0,1fr)] "
              >
                <span className="whitespace-nowrap text-xs text-gray-500 ">
                  {formatReportedContentDetailDateTime(history.created_at)}
                </span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span className="font-medium">{labelCommentHistoryChange(config, history)}</span>
                <span className="min-w-0 break-words text-sm text-gray-600 ">
                  {formatCommentHistoryReason(config, history)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500   ">
            등록된 히스토리가 없습니다.
          </div>
        )}

        {meta ? (
          <div className="flex justify-center pt-1">
            <Pagination
              currentPage={meta.current_page}
              totalPages={Math.max(1, meta.last_page)}
              onPageChange={onGoPage}
              disabled={refreshing}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={detailGridClass}>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueClass}>{value}</div>
    </div>
  );
}

function ContentBox({ content }: { content?: string | null }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">댓글 내용</p>
      <div className="min-h-36 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800   ">
        {content?.trim() || "-"}
      </div>
    </section>
  );
}

function CategoryBadges({ categories }: { categories: HospitalReviewCategory[] }) {
  return <CategoryBadgeList values={getHospitalReviewDetailCategoryFullPaths(categories)} />;
}

function ReviewImageGallery({
  beforeImages,
  afterImages,
}: {
  beforeImages: HospitalReviewMediaAsset[];
  afterImages: HospitalReviewMediaAsset[];
}) {
  const images = [
    ...beforeImages.map((image) => ({ image, label: "전" })),
    ...afterImages.map((image) => ({ image, label: "후" })),
  ];

  if (images.length === 0) {
    return (
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 ">게시글 이미지</p>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500   ">
          등록된 이미지가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">게시글 이미지</p>
      <div className="max-w-full overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex min-w-full gap-3">
          {images.map(({ image, label }, index) => {
            const imageUrl = resolveHospitalReviewMediaUrl(image);

            return (
              <a
                key={`${label}-${image.id ?? image.path ?? index}`}
                href={imageUrl ?? undefined}
                target={imageUrl ? "_blank" : undefined}
                rel={imageUrl ? "noreferrer" : undefined}
                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50  "
                style={{ flex: "0 0 calc((100% - 2.25rem) / 4)" }}
              >
                <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm  ">
                  {label}
                </span>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- backend returns storage URLs
                  <img
                    src={imageUrl}
                    alt={`신고 댓글 부모 게시글 이미지 ${index + 1}`}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="px-3 text-center text-xs text-gray-500 ">미리보기 없음</span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MentionText({ text }: { text: string }) {
  return (
    <span className="font-semibold text-brand-500">
      {text.startsWith("@") ? text : `@${text}`}
    </span>
  );
}

function formatCommentAuthorName(config: ReportedContentCommentDetailConfig, target?: CommentTarget | null) {
  if (config.kind === "review-comment") {
    return formatHospitalReviewAuthorName((target as HospitalReviewCommentApiItem | null | undefined)?.author);
  }

  const author = (target as TalkCommentApiItem | null | undefined)?.author;

  return author?.nickname?.trim() || author?.name?.trim() || author?.email?.trim() || "-";
}

function labelVisibility(status?: string | null) {
  if (!status) return "-";

  return status === "ACTIVE" ? "노출" : "미노출";
}

function labelCommentHistoryChange(
  config: ReportedContentCommentDetailConfig,
  history: CommentHistory,
) {
  if (config.kind === "talk-comment") {
    return labelTalkHistoryChange(history as TalkOperationHistory);
  }

  return labelHospitalReviewHistoryChange(history as HospitalReviewOperationHistory);
}

function formatCommentHistoryReason(
  config: ReportedContentCommentDetailConfig,
  history: CommentHistory,
) {
  if (config.kind === "talk-comment") {
    return formatTalkHistoryReason(history as TalkOperationHistory);
  }

  return formatHospitalReviewHistoryReason(history as HospitalReviewOperationHistory);
}
