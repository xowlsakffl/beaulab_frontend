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
  SpinnerBlock,
} from "@beaulab/ui-admin";

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
import { getHospitalReviewDetailSmallCategoryNames } from "@/lib/hospital-review/detail";
import {
  formatReportedContentDetailDateTime,
  type ReportedContentDetailResponse,
  type ReportedContentTargetType,
} from "@/lib/reported-content/detail";
import {
  formatTalkCategoryName,
} from "@/lib/talk/list";
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
};

type ReportedContentCommentDetailPageClientProps = {
  type: ReportedContentCommentDetailType;
};

type CommentTarget = (TalkCommentApiItem | HospitalReviewCommentApiItem) & {
  author_ip?: string | null;
};

const COMMENT_DETAIL_CONFIGS: Record<ReportedContentCommentDetailType, ReportedContentCommentDetailConfig> = {
  "talk-comments": {
    kind: "talk-comment",
    title: "토크 댓글",
    listPath: "/reported-content/talks",
    targetType: "talk_comment",
  },
  "surgery-review-comments": {
    kind: "review-comment",
    title: "성형후기 댓글",
    listPath: "/reported-content/surgery-reviews",
    targetType: "hospital_review_comment",
  },
  "treatment-review-comments": {
    kind: "review-comment",
    title: "시술후기 댓글",
    listPath: "/reported-content/treatment-reviews",
    targetType: "hospital_review_comment",
  },
};

const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 dark:text-gray-100";

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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  if (loading && !detail) {
    return <SpinnerBlock label="신고 댓글 상세 정보를 불러오는 중" />;
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10">
          <p className="text-sm text-rose-600 dark:text-rose-300">{error || "신고 댓글 상세 정보가 없습니다."}</p>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  const target = detail.target as CommentTarget | null | undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          {renderCommentSummary(config, target, () => router.push(getReturnToPath(Number(detail.target_id ?? targetId))))}
          {renderCommentContent(config, target)}
        </div>

        <div className="space-y-6">
          <ReportedContentDetailPanel
            targetType={config.targetType}
            targetId={targetId}
            onStatusUpdated={() => void fetchDetail()}
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
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">댓글 내용</p>
      <div className="min-h-36 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-100">
        {content?.trim() || "-"}
      </div>
    </section>
  );
}

function CategoryBadges({ categories }: { categories: HospitalReviewCategory[] }) {
  const categoryNames = getHospitalReviewDetailSmallCategoryNames(categories);

  if (categoryNames.length === 0) return "-";

  return (
    <div className="flex flex-wrap gap-1.5">
      {categoryNames.map((category) => (
        <span
          key={category}
          className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20"
        >
          #{category}
        </span>
      ))}
    </div>
  );
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
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">게시글 이미지</p>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400">
          등록된 이미지가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">게시글 이미지</p>
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
                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30"
                style={{ flex: "0 0 calc((100% - 2.25rem) / 4)" }}
              >
                <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm dark:bg-gray-900/90 dark:text-gray-200">
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
                  <span className="px-3 text-center text-xs text-gray-500 dark:text-gray-400">미리보기 없음</span>
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
