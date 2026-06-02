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
  FormTextArea,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
  StatusBadge,
} from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
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

const listPath = "/users";
const labelClassName = "text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm font-medium text-gray-800";
const cardHeaderClassName = "mb-5";

export default function AccountUserDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const goBackToList = React.useCallback(() => {
    router.push(buildReturnToPath({
      searchParams,
      fallbackPath: listPath,
      allowedPrefix: listPath,
      highlightId: Number.isFinite(userId) ? userId : undefined,
    }));
  }, [router, searchParams, userId]);

  const openBlockModal = React.useCallback(() => {
    setIsMenuOpen(false);
    setBlockError(null);
    setIsBlockModalOpen(true);
  }, []);

  const closeBlockModal = React.useCallback(() => {
    if (blocking) return;
    setIsBlockModalOpen(false);
  }, [blocking]);

  const submitBlock = React.useCallback(async () => {
    setBlocking(true);
    setBlockError(null);

    try {
      const response = await api.patch<AccountUserUpdateResponse>(`/users/${userId}`, {
        status: "BLOCKED",
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
  }, [fetchUser, userId]);

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
    return <SpinnerBlock className="min-h-[360px]" label="회원 상세 정보를 불러오는 중" />;
  }

  if (loadError || !user) {
    return (
      <Card>
        <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4">
          <p className="text-sm text-rose-600">{loadError || "회원 상세 정보가 없습니다."}</p>
          <Button type="button" variant="outline" onClick={goBackToList}>목록으로</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <MemberInfoCard
            user={user}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
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

      <Modal isOpen={isBlockModalOpen} onClose={closeBlockModal} className="mx-4 max-w-md" showCloseButton={false}>
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>차단신고</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="text-sm text-gray-700">해당 회원을 차단하기 위해 등록하시겠습니까?</p>
            {blockError ? <p className="text-sm text-rose-600">{blockError}</p> : null}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeBlockModal} disabled={blocking}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={submitBlock} disabled={blocking}>
              등록
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>

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
  onOpenBlockModal,
}: {
  user: AccountUserDetail;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onOpenBlockModal: () => void;
}) {
  const status = user.status ?? "";
  const shouldShowStatus = status === "BLOCKED" || status === "WITHDRAWN";
  const canBlock = status !== "BLOCKED" && status !== "WITHDRAWN";

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
            {status === "WITHDRAWN" ? (
              <span className="text-xs font-medium text-gray-500">
                [{user.withdrawal_reason || "탈퇴사유 없음"} · {formatAccountUserDetailDateTime(user.deleted_at)}]
              </span>
            ) : null}
          </div>
        </div>

        {canBlock ? (
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100"
              onClick={onToggleMenu}
              aria-label="회원 메뉴"
            >
              ⋮
            </button>
            {isMenuOpen ? (
              <div className="absolute right-0 z-10 mt-1 min-w-32 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={onOpenBlockModal}
                >
                  차단신고
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
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
  const consultation = user.consultation_info;

  return (
    <Card>
      <CardHeader className={cardHeaderClassName}>
        <CardTitle>상담신청정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CountBox label="이벤트 신청" value={Number(consultation?.event_applications ?? 0)} />
          <CountBox label="비대면 상담신청" value={Number(consultation?.remote_consultations ?? 0)} />
          <CountBox label="리얼모델관리" value={Number(consultation?.real_model_applications ?? 0)} />
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

function AdminMemoCard({
  notes,
  onOpenNoteModal,
}: {
  notes: AdminNoteItem[];
  onOpenNoteModal: () => void;
}) {
  return (
    <Card>
      <CardHeader className={`${cardHeaderClassName} flex flex-row items-center justify-between`}>
        <CardTitle>관리자 메모</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenNoteModal}
          aria-label="관리자 메모 추가"
          className="rounded-full border border-gray-300 bg-white text-[#FA2875] shadow-none hover:border-gray-300 hover:bg-white hover:text-[#FA2875]"
        >
          <span className="text-2xl font-light leading-none">+</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-44 overflow-y-auto border-t border-gray-200">
          {notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">등록된 관리자 메모가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notes.map((note) => (
                <div key={note.id ?? `${note.created_at}-${note.note}`} className="grid grid-cols-[7rem_6rem_minmax(0,1fr)] gap-3 py-4 text-sm">
                  <span className="text-gray-500">{formatAccountUserDetailDateTime(note.created_at)}</span>
                  <span className="font-medium text-gray-700">{note.creator_name || "-"}</span>
                  <span className="min-w-0 break-words text-gray-700">{note.note || "-"}</span>
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
  const nicknameQuery = user.nickname ? `?q=${encodeURIComponent(user.nickname)}` : "";
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ClickableCountBox
              label="성형후기/댓글"
              value={compactPostCommentCount(activity?.hospital_reviews)}
              onClick={() => router.push(`/reviews/surgery-reviews${nicknameQuery}`)}
            />
            <ClickableCountBox
              label="토크/댓글"
              value={compactPostCommentCount(activity?.talks)}
              onClick={() => router.push(`/talks${nicknameQuery}`)}
            />
            <ClickableCountBox
              label="병의원평가"
              value={totalCount(activity?.hospital_evaluations)}
              onClick={() => router.push(`/reviews/hospital-evaluations${nicknameQuery}`)}
            />
          </div>
        </div>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_8.5rem]">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">신고게시물</h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ClickableCountBox
                label="성형후기/댓글"
                value={compactPostCommentCount(reported?.hospital_reviews)}
                onClick={() => router.push(`/reported-content/surgery-reviews${nicknameQuery}`)}
              />
              <ClickableCountBox
                label="토크/댓글"
                value={compactPostCommentCount(reported?.talks)}
                onClick={() => router.push(`/reported-content/talks${nicknameQuery}`)}
              />
              <ClickableCountBox
                label="병의원평가"
                value={totalCount(reported?.hospital_evaluations)}
                onClick={() => router.push(`/reported-content/hospital-evaluations${nicknameQuery}`)}
              />
              <ClickableCountBox
                label="채팅"
                value={totalCount(reported?.chats)}
                onClick={() => router.push(`/reported-content/chats${nicknameQuery}`)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">경고횟수</h3>
            <CountBox label="경고" value={warningCount} />
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
              <div key={`${log.ip}-${log.accessed_at}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3 text-sm text-gray-700">
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

function CountBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-300 px-4 py-3 text-center">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

function ClickableCountBox({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-gray-300 px-4 py-3 text-center transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
    </button>
  );
}
