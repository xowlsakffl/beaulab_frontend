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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  formatReportedContentAuthorName,
  formatReportedContentDetailDate,
  formatReportedContentDetailDateTime,
  formatReportedContentReason,
  type ReportedChatMessageDetailTarget,
  type ReportedContentDetailAuthor,
  type ReportedContentOperationHistory,
  type ReportedContentDetailReportItem,
  type ReportedContentDetailReportSubItem,
  type ReportedContentDetailResponse,
  type ReportedContentWarningStatusUpdatePayload,
} from "@/lib/reported-content/detail";

type WarningActionStatus = "WARNED" | "IGNORED";

type ReportedChatDetailResponse = ReportedContentDetailResponse & {
  target?: ReportedChatMessageDetailTarget | null;
  report?: ReportedContentDetailResponse["report"] & {
    latest_report?: ReportedContentDetailReportItem | null;
  } | null;
};

type ReportedChatMessageDisplay = {
  key: string;
  body: string;
};
type ChatReportMember = ReportedContentDetailAuthor | NonNullable<ReportedContentDetailReportItem["reporter"]>;

const targetType = "chat_message";
const listPath = "/reported-content/chats";
const labelClassName = "text-xs font-semibold text-gray-500 ";
const valueClassName = "text-sm font-medium text-gray-800 ";

export default function ReportedChatDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const targetId = Number(rawId);
  const [detail, setDetail] = React.useState<ReportedChatDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updatingWarningStatus, setUpdatingWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [pendingWarningStatus, setPendingWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [warningModalError, setWarningModalError] = React.useState<string | null>(null);

  const getReturnToPath = React.useCallback(
    () =>
      buildReturnToPath({
        searchParams,
        fallbackPath: listPath,
        allowedPrefix: listPath,
        highlightId: targetId,
      }),
    [searchParams, targetId],
  );

  const fetchDetail = React.useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) {
      setError("올바르지 않은 신고 채팅 경로입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ReportedChatDetailResponse>(
        `/reported-contents/detail/${targetType}/${targetId}`,
      );

      if (!isApiSuccess(response)) {
        setError(response.error.message || "신고 채팅 상세 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setError("신고 채팅 상세 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const updateWarningStatus = React.useCallback(
    async (warningStatus: WarningActionStatus) => {
      setUpdatingWarningStatus(warningStatus);
      setWarningModalError(null);

      const payload: ReportedContentWarningStatusUpdatePayload = {
        target_type: targetType,
        target_id: targetId,
        warning_status: warningStatus,
      };

      try {
        const response = await api.patch("/reported-contents/warning-status", payload);

        if (!isApiSuccess(response)) {
          setWarningModalError(response.error.message || "경고 처리 상태 변경에 실패했습니다.");
          return;
        }

        setPendingWarningStatus(null);
        await fetchDetail();
      } catch {
        setWarningModalError("경고 처리 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setUpdatingWarningStatus(null);
      }
    },
    [fetchDetail, targetId],
  );

  const reportState = detail?.report ?? null;
  const latestReport = reportState?.latest_report ?? null;
  const target = detail?.target ?? null;
  const author = detail?.author ?? null;
  const reporter = latestReport?.reporter ?? null;
  const warningStatus = reportState?.warning_status?.trim() || "NONE";
  const warningCount = Number(author?.warning_count ?? 0);
  const histories = detail?.operation_histories ?? [];
  const latestReportReason = latestReport ? formatReportedContentReason(latestReport) : "-";
  const messages = React.useMemo(
    () => buildReportedMessages(latestReport?.items, target),
    [latestReport?.items, target],
  );

  const openWarningModal = React.useCallback((nextStatus: WarningActionStatus) => {
    setPendingWarningStatus(nextStatus);
    setWarningModalError(null);
  }, []);

  const closeWarningModal = React.useCallback(() => {
    if (updatingWarningStatus !== null) return;

    setPendingWarningStatus(null);
    setWarningModalError(null);
  }, [updatingWarningStatus]);

  if (loading && !detail) {
    return <SpinnerBlock label="신고 채팅 상세 정보를 불러오는 중" />;
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10">
          <p className="text-sm text-rose-600 ">{error || "신고 채팅 상세 정보가 없습니다."}</p>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  const warningModalMessage = pendingWarningStatus === "WARNED"
    ? warningStatus === "IGNORED"
      ? "무시를 경고로 변경하시겠습니까?"
      : "해당 유저에게 경고하시겠습니까?"
    : warningStatus === "WARNED"
      ? "해당 경고를 무시로 변경하시겠습니까?"
      : "해당 채팅 신고의 경고 처리를 무시하시겠습니까?";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ChatMemberInfoCard
            title="작성자 회원정보"
            user={author}
            ip={target?.author_ip}
            dateLabel="작성일"
            date={target?.created_at}
            onBack={() => router.push(getReturnToPath())}
          />
          <ChatMemberInfoCard
            title="신고자 회원정보"
            user={reporter}
            ip={latestReport?.reporter_ip}
            dateLabel="신고일"
            date={latestReport?.created_at}
          />
          <ChatOperationHistoryCard histories={histories} />
        </div>

        <div className="space-y-6">
          <ReportedChatMessagesCard
            messages={messages}
            reportReason={latestReportReason}
          />
          <ChatReportActionCard
            warningStatus={warningStatus}
            updatingWarningStatus={updatingWarningStatus}
            onOpenWarningModal={openWarningModal}
          />
        </div>
      </div>

      <Modal
        isOpen={pendingWarningStatus !== null}
        onClose={closeWarningModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>경고 처리</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5 space-y-3">
            <p className="text-sm font-medium text-gray-800 ">
              {warningModalMessage}
            </p>
            {pendingWarningStatus === "WARNED" ? (
              <div className="space-y-1 text-sm text-gray-500 ">
                <p>경고가 누적 10회가 되면 해당 회원은 차단됩니다.</p>
                <p>
                  현재누적 <span className="font-semibold text-red-500">{warningCount.toLocaleString()}</span>건
                </p>
              </div>
            ) : null}
            {warningModalError ? (
              <p className="text-sm font-medium text-rose-600 ">
                {warningModalError}
              </p>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeWarningModal} disabled={updatingWarningStatus !== null}>
              취소
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => pendingWarningStatus ? void updateWarningStatus(pendingWarningStatus) : undefined}
              disabled={updatingWarningStatus !== null}
            >
              {updatingWarningStatus !== null ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}

function ChatMemberInfoCard({
  title,
  user,
  ip,
  dateLabel,
  date,
  onBack,
}: {
  title: string;
  user?: ChatReportMember | null;
  ip?: string | null;
  dateLabel: string;
  date?: string | null;
  onBack?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {onBack ? (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBack}>
              목록으로
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          <InfoValue label={title.startsWith("신고자") ? "신고자" : "작성자"} value={formatReportedContentAuthorName(user)} />
          <InfoValue label="전화번호" value={user?.phone?.trim() || "-"} />
          <InfoValue label={title.startsWith("신고자") ? "신고 IP" : "작성 IP"} value={ip?.trim() || "-"} />
          <InfoValue label={dateLabel} value={formatReportedContentDetailDateTime(date)} />
          <InfoValue label="가입일" value={formatReportedContentDetailDate(user?.created_at)} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3">
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

function ReportedChatMessagesCard({
  messages,
  reportReason,
}: {
  messages: ReportedChatMessageDisplay[];
  reportReason: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-4 pb-4">
        <section className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <CardTitle>신고 사유</CardTitle>
          <p className="text-sm font-medium text-gray-800 ">{reportReason}</p>
        </section>
        <CardTitle>신고 내용</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.key} className="flex items-start gap-4">
                <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700 ring-1 ring-gray-200   ">
                  {index + 1}
                </span>
                <div className="min-w-0 rounded-lg bg-[#FA6FA9] px-4 py-2.5 text-sm font-semibold leading-6 text-white">
                  {message.body}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500   ">
            신고된 채팅 메시지가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatOperationHistoryCard({ histories }: { histories: ReportedContentOperationHistory[] }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>히스토리</CardTitle>
      </CardHeader>
      <CardContent>
        {histories.length > 0 ? (
          <div className="divide-y divide-gray-200 ">
            {histories.map((history, index) => (
              <div
                key={history.id ?? `${history.created_at ?? "history"}-${index}`}
                className="grid gap-2 py-3 text-sm text-gray-700 md:grid-cols-[10rem_8rem_8rem_minmax(0,1fr)] "
              >
                <span className="whitespace-nowrap text-xs text-gray-500 ">
                  {formatReportedContentDetailDateTime(history.created_at)}
                </span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span className="font-medium">{labelChatHistoryChange(history)}</span>
                <span className="min-w-0 break-words text-sm text-gray-600 ">
                  {history.reason?.trim() || "-"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500   ">
            등록된 히스토리가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function labelChatHistoryChange(history: ReportedContentOperationHistory) {
  const metadata = history.metadata ?? {};
  const afterLabel = typeof metadata.after_label === "string" ? metadata.after_label.trim() : "";

  if (afterLabel) {
    return afterLabel;
  }

  return history.field === "warning_status" ? "경고여부" : "신고처리";
}

function ChatReportActionCard({
  warningStatus,
  updatingWarningStatus,
  onOpenWarningModal,
}: {
  warningStatus: string;
  updatingWarningStatus: WarningActionStatus | null;
  onOpenWarningModal: (status: WarningActionStatus) => void;
}) {
  return (
    <Card>
      <CardContent>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 ">경고여부</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={warningStatus === "WARNED" ? "brand" : "outline"}
              disabled={warningStatus === "WARNED" || updatingWarningStatus !== null}
              onClick={() => onOpenWarningModal("WARNED")}
              className={[
                "h-12 px-6 text-base font-semibold",
                warningStatus === "WARNED" ? "" : "text-gray-500",
              ].join(" ")}
            >
              {updatingWarningStatus === "WARNED" ? "처리 중" : "경고"}
            </Button>
            <Button
              type="button"
              variant={warningStatus === "IGNORED" ? "brand" : "outline"}
              disabled={warningStatus === "IGNORED" || updatingWarningStatus !== null}
              onClick={() => onOpenWarningModal("IGNORED")}
              className={[
                "h-12 px-6 text-base font-semibold",
                warningStatus === "IGNORED" ? "" : "text-gray-500",
              ].join(" ")}
            >
              {updatingWarningStatus === "IGNORED" ? "처리 중" : "무시"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildReportedMessages(
  items?: ReportedContentDetailReportSubItem[] | null,
  fallbackTarget?: ReportedChatMessageDetailTarget | null,
): ReportedChatMessageDisplay[] {
  const messages = (items ?? [])
    .map((item, index) => ({
      key: String(item.id ?? item.target_id ?? `item-${index}`),
      body: messageBody(item.target, item.content_snapshot),
    }))
    .filter((message) => message.body !== "-");

  if (messages.length > 0) {
    return messages.slice(0, 5);
  }

  if (!fallbackTarget) {
    return [];
  }

  return [{
    key: String(fallbackTarget.id ?? "target"),
    body: messageBody(fallbackTarget, null),
  }];
}

function messageBody(target?: ReportedChatMessageDetailTarget | null, snapshot?: string | null) {
  const body = target?.body_preview?.trim() || target?.body?.trim();

  if (body) {
    return body;
  }

  const snapshotBody = snapshot?.trim();
  if (snapshotBody) {
    const separatorIndex = snapshotBody.indexOf(": ");

    return separatorIndex >= 0 ? snapshotBody.slice(separatorIndex + 2) : snapshotBody;
  }

  const messageType = target?.message_type?.trim();

  return messageType ? `[${messageType}]` : "-";
}
