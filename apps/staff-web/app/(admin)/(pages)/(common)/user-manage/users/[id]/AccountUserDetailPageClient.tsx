"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  FormTextArea,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  MoreVertical,
  SpinnerBlock,
  StatusBadge,
} from "@beaulab/ui-admin";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import { AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import { api } from "@/lib/common/api";
import { formatAccountUserStatusColor } from "@/lib/account-user/list";
import {
  ACCOUNT_USER_ADMIN_NOTE_TARGET_TYPE,
  compactPostCommentCount,
  formatAccountUserDetailDateTime,
  formatAgreementLabel,
  numberValue,
  totalCount,
  type AccountUserDetail,
  type AccountUserDetailResponse,
  type AdminNoteCreateResponse,
  type AdminNoteItem,
  type AdminNoteListResponse,
} from "@/lib/account-user/detail";

type AccountUserUpdateResponse = AccountUserDetail;

const labelClassName = "text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm text-gray-800";
const cardHeaderClassName = "mb-5";
const summaryCardLabelClassName = "text-xs font-medium text-gray-700";

function labelAccountUserStatus(status: string) {
  if (status === "BLOCKED") return "차단";
  return status;
}

function buildStatusHistoryText(user: AccountUserDetail) {
  const history = user.latest_status_history;
  const fallbackReason = user.status === "WITHDRAWN" ? user.withdrawal_reason?.trim() || "탈퇴사유 없음" : "";
  const fallbackDate =
    user.status === "WITHDRAWN"
      ? formatShortDateTime(user.deleted_at)
      : user.status === "BLOCKED"
        ? formatShortDateTime(user.blocked_at)
        : "";

  return [history?.reason?.trim() || fallbackReason, formatShortDateTime(history?.created_at) || fallbackDate]
    .filter(Boolean)
    .join(" · ");
}

function formatShortDateTime(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const year = String(parsed.getFullYear() % 100).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export default function AccountUserDetailPageClient() {
  const params = useParams<{ id: string }>();
  const rawUserId = Array.isArray(params.id) ? params.id[0] : params.id;
  const userId = Number(rawUserId);

  const [user, setUser] = React.useState<AccountUserDetail | null>(null);
  const [notes, setNotes] = React.useState<AdminNoteItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState("");
  const [noteError, setNoteError] = React.useState<string | null>(null);
  const [blockError, setBlockError] = React.useState<string | null>(null);
  const [blockReason, setBlockReason] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [blocking, setBlocking] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  const fetchUser = React.useCallback(async () => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setLoadError("올바르지 않은 회원 경로입니다.");
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) setLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<AccountUserDetailResponse>(`/users/${userId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "회원 상세 정보를 불러오지 못했습니다.");
        return;
      }

      setUser(response.data ?? null);
      hasLoadedRef.current = true;
    } catch {
      setLoadError("회원 상세 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchNotes = React.useCallback(async () => {
    if (!Number.isFinite(userId) || userId <= 0) return;

    try {
      const response = await api.get<AdminNoteListResponse>("/notes", {
        target_type: ACCOUNT_USER_ADMIN_NOTE_TARGET_TYPE,
        target_id: userId,
      });

      if (!isApiSuccess(response)) {
        setNotes([]);
        return;
      }

      setNotes(Array.isArray(response.data) ? response.data : []);
    } catch {
      setNotes([]);
    }
  }, [userId]);

  React.useEffect(() => {
    void fetchUser();
    void fetchNotes();
  }, [fetchNotes, fetchUser]);

  const openBlockModal = React.useCallback(() => {
    setIsMenuOpen(false);
    setBlockError(null);
    setBlockReason("");
    setIsBlockModalOpen(true);
  }, []);

  const closeBlockModal = React.useCallback(() => {
    if (blocking) return;
    setIsBlockModalOpen(false);
    setBlockError(null);
    setBlockReason("");
  }, [blocking]);

  const submitBlock = React.useCallback(async () => {
    const reason = blockReason.trim();

    if (!reason) {
      setBlockError("차단 사유를 입력해주세요.");
      return;
    }

    setBlocking(true);
    setBlockError(null);

    try {
      const response = await api.patch<AccountUserUpdateResponse>(`/users/${userId}/status`, {
        status: "BLOCKED",
        reason,
      });

      if (!isApiSuccess(response)) {
        setBlockError(response.error.message || "회원 차단 처리에 실패했습니다.");
        return;
      }

      if (response.data) {
        setUser((prev) => ({
          ...(prev ?? {}),
          ...response.data,
          activity_info: prev?.activity_info,
          reported_info: prev?.reported_info,
          access_logs: prev?.access_logs,
        }));
      }

      setIsBlockModalOpen(false);
      await fetchUser();
    } catch {
      setBlockError("회원 차단 처리 중 오류가 발생했습니다.");
    } finally {
      setBlocking(false);
    }
  }, [blockReason, fetchUser, userId]);

  const openNoteModal = React.useCallback(() => {
    setNoteInput("");
    setNoteError(null);
    setIsNoteModalOpen(true);
  }, []);

  const closeNoteModal = React.useCallback(() => {
    if (savingNote) return;
    setIsNoteModalOpen(false);
  }, [savingNote]);

  const submitNote = React.useCallback(async () => {
    const note = noteInput.trim();

    if (!note) {
      setNoteError("메모 내용을 입력해주세요.");
      return;
    }

    setSavingNote(true);
    setNoteError(null);

    try {
      const response = await api.post<AdminNoteCreateResponse>("/notes", {
        target_type: ACCOUNT_USER_ADMIN_NOTE_TARGET_TYPE,
        target_id: userId,
        note,
        is_internal: true,
      });

      if (!isApiSuccess(response)) {
        setNoteError(response.error.message || "관리자 메모 등록에 실패했습니다.");
        return;
      }

      if (response.data) {
        setNotes((prev) => [response.data as AdminNoteItem, ...prev]);
      }

      setIsNoteModalOpen(false);
    } catch {
      setNoteError("관리자 메모 등록 중 오류가 발생했습니다.");
    } finally {
      setSavingNote(false);
    }
  }, [noteInput, userId]);

  if (loading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="회원 상세 정보를 불러오는 중" />;
  }

  if (loadError || !user) {
    return (
      <LoadErrorState
        title="회원 상세 정보를 불러오지 못했습니다."
        message={loadError || "회원 상세 정보가 없습니다."}
        onRetry={() => {
          void fetchUser();
          void fetchNotes();
        }}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <MemberInfoCard
            user={user}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onCloseMenu={() => setIsMenuOpen(false)}
            onOpenBlockModal={openBlockModal}
          />
          <ConsultationInfoCard user={user} />
          <NotificationSettingsCard user={user} />
          <AdminMemoCard notes={notes} onOpenNoteModal={openNoteModal} />
        </div>

        <div className="min-w-0 space-y-5">
          <ActivityInfoCard user={user} />
          <AccessInfoCard user={user} />
        </div>
      </div>

      <AllowStatusConfirmModal
        pending={isBlockModalOpen ? { allowStatus: "BLOCKED", reason: blockReason } : null}
        title="차단 처리"
        subjectLabel="해당 회원을"
        messageAction="등록"
        labelStatus={labelAccountUserStatus}
        updating={blocking}
        error={blockError}
        rejectStatus="BLOCKED"
        reasonInputId="account-user-block-reason"
        reasonLabel="차단 사유"
        reasonPlaceholder="차단 사유를 입력해주세요."
        processingText="등록 중"
        confirmText="등록"
        onReasonChange={setBlockReason}
        onClose={closeBlockModal}
        onConfirm={() => void submitBlock()}
      />

      <Modal isOpen={isNoteModalOpen} onClose={closeNoteModal} className="mx-4 max-w-lg" showCloseButton={false}>
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>관리자 메모</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <FormTextArea
              rows={5}
              value={noteInput}
              onChange={setNoteInput}
              placeholder="관리자 메모를 입력해주세요."
              error={Boolean(noteError)}
              hint={noteError ?? undefined}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeNoteModal} disabled={savingNote}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={submitNote} disabled={savingNote}>
              등록
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}

function MemberInfoCard({
  user,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenBlockModal,
}: {
  user: AccountUserDetail;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpenBlockModal: () => void;
}) {
  const status = user.status ?? "";
  const statusHistoryText = buildStatusHistoryText(user);
  const shouldShowStatus = Boolean(status && status !== "ACTIVE");
  const cannotBlock = status === "BLOCKED" || status === "WITHDRAWN";

  return (
    <Card>
      <CardHeader className={`${cardHeaderClassName} flex flex-row items-start justify-between gap-4`}>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>회원정보</CardTitle>
            {shouldShowStatus ? (
              <StatusBadge size="sm" color={formatAccountUserStatusColor(status)}>
                {user.status_label ?? status}
              </StatusBadge>
            ) : null}
            {shouldShowStatus && statusHistoryText ? (
              <span className="text-xs text-gray-700">[{statusHistoryText}]</span>
            ) : null}
          </div>
        </div>

        <Can permission="beaulab.user.update">
          <div className="relative">
            <button
              type="button"
              className="dropdown-toggle rounded-full p-1 text-gray-700 hover:bg-gray-50"
              aria-label="회원 메뉴"
              aria-expanded={isMenuOpen}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu();
              }}
            >
              <MoreVertical className="size-4" />
            </button>
            <Dropdown isOpen={isMenuOpen} onClose={onCloseMenu} className="w-36 overflow-hidden py-1">
              <DropdownItem
                disabled={cannotBlock}
                onItemClick={onCloseMenu}
                onClick={onOpenBlockModal}
                baseClassName={
                  cannotBlock
                    ? "block w-full cursor-not-allowed px-4 py-2 text-left text-sm font-semibold text-gray-300"
                    : "block w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
              >
                차단
              </DropdownItem>
            </Dropdown>
          </div>
        </Can>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <DetailField label="UID" value={numberValue(user.id)} />
          <DetailField label="닉네임" value={user.nickname || "-"} />
          <DetailField label="Email" value={user.email || "-"} />
          <DetailField label="이름" value={user.name || "-"} />
          <DetailField label="가입경로" value={user.signup_channel_label || "-"} />
          <DetailField label="전화번호" value={user.phone || "-"} />
          <DetailField label="가입일" value={formatAccountUserDetailDateTime(user.created_at)} />
        </div>
      </CardContent>
    </Card>
  );
}

function ConsultationInfoCard({ user }: { user: AccountUserDetail }) {
  const router = useRouter();
  const consultation = user.consultation_info;
  const accountUserId = Number(user.id ?? 0);
  const accountUserQuery =
    Number.isInteger(accountUserId) && accountUserId > 0 ? `?account_user_id=${accountUserId}` : "";

  return (
    <Card>
      <CardHeader className={cardHeaderClassName}>
        <CardTitle>상담신청정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCountCard
            layout="center"
            label="이벤트 DB"
            value={Number(consultation?.event_dbs ?? 0).toLocaleString()}
            onClick={() => router.push(`/customer-db-manage/events${accountUserQuery}`)}
          />
          <SummaryCountCard
            layout="center"
            label="리얼모델 DB"
            value={Number(consultation?.real_model_dbs ?? 0).toLocaleString()}
            onClick={() => router.push(`/customer-db-manage/real-models${accountUserQuery}`)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettingsCard({ user }: { user: AccountUserDetail }) {
  const settings = user.notification_settings;

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className={cardHeaderClassName}>
            <CardTitle>알림설정</CardTitle>
          </div>
          <div className="space-y-4">
            <AgreementRow label="댓글" value={settings?.comment_notification_enabled} />
            <AgreementRow label="쪽지" value={settings?.note_notification_enabled} />
          </div>
        </div>

        <div>
          <div className={cardHeaderClassName}>
            <CardTitle>이벤트/마케팅 수신 동의</CardTitle>
          </div>
          <div className="space-y-4">
            <AgreementRow label="SMS" value={settings?.marketing_sms_agreed} />
            <AgreementRow label="이메일" value={settings?.marketing_email_agreed} />
            <AgreementRow label="푸시" value={settings?.marketing_push_agreed} />
            <AgreementRow label="야간푸시" value={settings?.marketing_night_push_agreed} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminMemoCard({ notes, onOpenNoteModal }: { notes: AdminNoteItem[]; onOpenNoteModal: () => void }) {
  return (
    <Card>
      <CardHeader className="relative mb-4 min-h-7 border-b border-gray-200 pr-9 pb-3">
        <CardTitle className="font-bold text-gray-900">관리자 메모</CardTitle>
        <AddCircleButton label="관리자 메모 추가" onClick={onOpenNoteModal} className="absolute top-0 right-0" />
      </CardHeader>
      <CardContent>
        <div className="max-h-44 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              등록된 관리자 메모가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id ?? `${note.created_at}-${note.note}`}
                  className="grid grid-cols-[6.5rem_5rem_minmax(0,1fr)] gap-3 text-xs text-gray-600"
                >
                  <span>{formatAccountUserDetailDateTime(note.created_at)}</span>
                  <span>{note.creator_name || "-"}</span>
                  <span className="break-words">{note.note || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityInfoCard({ user }: { user: AccountUserDetail }) {
  const router = useRouter();
  const accountUserId = Number(user.id ?? 0);
  const authorQuery = Number.isInteger(accountUserId) && accountUserId > 0 ? `?author_id=${accountUserId}` : "";
  const reportedAuthorQuery =
    Number.isInteger(accountUserId) && accountUserId > 0 ? `?target_author_id=${accountUserId}` : "";
  const activity = user.activity_info;
  const reported = user.reported_info;
  const warningCount = Number(reported?.warnings?.count ?? user.warning_count ?? 0);

  return (
    <Card>
      <CardHeader className={cardHeaderClassName}>
        <CardTitle>활동정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCountCard
              layout="center"
              label="성형후기/댓글"
              labelClassName={summaryCardLabelClassName}
              value={compactPostCommentCount(activity?.hospital_reviews)}
              onClick={() => router.push(`/post-manage/surgery-reviews${authorQuery}`)}
            />
            <SummaryCountCard
              layout="center"
              label="시술후기/댓글"
              labelClassName={summaryCardLabelClassName}
              value={compactPostCommentCount(activity?.treatment_reviews)}
              onClick={() => router.push(`/post-manage/treatment-reviews${authorQuery}`)}
            />
            <SummaryCountCard
              layout="center"
              label="토크/댓글"
              labelClassName={summaryCardLabelClassName}
              value={compactPostCommentCount(activity?.talks)}
              onClick={() => router.push(`/post-manage/talks${authorQuery}`)}
            />
            <SummaryCountCard
              layout="center"
              label="병의원평가"
              labelClassName={summaryCardLabelClassName}
              value={totalCount(activity?.hospital_evaluations)}
              onClick={() => router.push(`/post-manage/hospital-evaluations${authorQuery}`)}
            />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">신고게시물</h3>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
              <SummaryCountCard
                layout="center"
                label="성형후기/댓글"
                labelClassName={summaryCardLabelClassName}
                value={compactPostCommentCount(reported?.hospital_reviews)}
                onClick={() => router.push(`/reported-post-manage/surgery-reviews${reportedAuthorQuery}`)}
              />
              <SummaryCountCard
                layout="center"
                label="시술후기/댓글"
                labelClassName={summaryCardLabelClassName}
                value={compactPostCommentCount(reported?.treatment_reviews)}
                onClick={() => router.push(`/reported-post-manage/treatment-reviews${reportedAuthorQuery}`)}
              />
              <SummaryCountCard
                layout="center"
                label="토크/댓글"
                labelClassName={summaryCardLabelClassName}
                value={compactPostCommentCount(reported?.talks)}
                onClick={() => router.push(`/reported-post-manage/talks${reportedAuthorQuery}`)}
              />
              <SummaryCountCard
                layout="center"
                label="병의원평가"
                labelClassName={summaryCardLabelClassName}
                value={totalCount(reported?.hospital_evaluations)}
                onClick={() => router.push(`/reported-post-manage/hospital-evaluations${reportedAuthorQuery}`)}
              />
              <SummaryCountCard
                layout="center"
                label="채팅"
                labelClassName={summaryCardLabelClassName}
                value={totalCount(reported?.chats)}
                onClick={() => router.push(`/reported-post-manage/chats${reportedAuthorQuery}`)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">경고횟수</h3>
            <SummaryCountCard
              layout="center"
              label="경고"
              labelClassName={summaryCardLabelClassName}
              value={warningCount}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessInfoCard({ user }: { user: AccountUserDetail }) {
  const logs = user.access_logs ?? [];

  return (
    <Card>
      <CardHeader className={cardHeaderClassName}>
        <CardTitle>접속정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-gray-100 pb-3 text-sm font-semibold text-gray-700">
          <span>접속 IP</span>
          <span>최근접속일</span>
        </div>
        {logs.length === 0 ? (
          <p className="py-6 text-sm text-gray-500">접속 기록이 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, index) => (
              <div
                key={`${log.ip}-${log.accessed_at}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3 text-sm text-gray-700"
              >
                <span className="min-w-0 break-words">{log.ip || "-"}</span>
                <span>{formatAccountUserDetailDateTime(log.accessed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3">
      <dt className={labelClassName}>{label}</dt>
      <dd className={valueClassName}>{value}</dd>
    </div>
  );
}

function AgreementRow({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-800">{formatAgreementLabel(value)}</span>
    </div>
  );
}
