"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert, type DataTableMeta, type TemplateMessagePart } from "@beaulab/ui-admin";

import { HospitalWalletNoticeModal } from "@/components/hospital-wallet/list/HospitalWalletNoticeModal";
import { HospitalWalletRefundModal } from "@/components/hospital-wallet/list/HospitalWalletRefundModal";
import { HospitalWalletServicePointModal } from "@/components/hospital-wallet/list/HospitalWalletServicePointModal";
import { HospitalWalletsDataTable } from "@/components/hospital-wallet/list/HospitalWalletsDataTable";
import { HospitalWalletsFilterPanel } from "@/components/hospital-wallet/list/HospitalWalletsFilterPanel";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import {
  buildHospitalWalletsQuery,
  buildHospitalWalletsQueryString,
  nextSortState,
  normalizeHospitalWallet,
  parseHospitalWalletInsufficientHospitals,
  parseHospitalWalletsTableState,
  type HospitalWalletApiItem,
  type HospitalWalletBalanceChange,
  type HospitalWalletInsufficientHospital,
  type HospitalWalletNoticeBatchApiItem,
  type HospitalWalletRefundCreateResult,
  type HospitalWalletRefundSubmitPayload,
  type HospitalWalletServicePointMode,
  type HospitalWalletServicePointResult,
  type SortField,
} from "@/lib/hospital-wallet/list";

type IdempotencyAttempt = {
  signature: string;
  key: string;
};

export default function HospitalWalletsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const [initialTableState] = React.useState(() =>
    parseHospitalWalletsTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [sortState, setSortState] = React.useState(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);
  const perPage = initialTableState.perPage;
  const [selectedHospitalIds, setSelectedHospitalIds] = React.useState<Set<number>>(new Set());
  const [recentChanges, setRecentChanges] = React.useState<Map<number, HospitalWalletBalanceChange>>(new Map());
  const [servicePointMode, setServicePointMode] = React.useState<HospitalWalletServicePointMode | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [insufficientHospitals, setInsufficientHospitals] = React.useState<HospitalWalletInsufficientHospital[]>([]);
  const [noticeModalOpen, setNoticeModalOpen] = React.useState(false);
  const [noticeSubmitError, setNoticeSubmitError] = React.useState<string | null>(null);
  const [refundModalOpen, setRefundModalOpen] = React.useState(false);
  const [refundSubmitError, setRefundSubmitError] = React.useState<string | null>(null);
  const servicePointIdempotencyAttemptRef = React.useRef<IdempotencyAttempt | null>(null);
  const noticeIdempotencyAttemptRef = React.useRef<IdempotencyAttempt | null>(null);
  const refundIdempotencyAttemptRef = React.useRef<IdempotencyAttempt | null>(null);
  const canDirectRefund = getSession()?.auth?.permissions?.includes("beaulab.hospital_wallet.refund_process") ?? false;

  const query = React.useMemo(
    () =>
      buildHospitalWalletsQuery({
        searchKeyword,
        sortState,
        perPage,
        page,
      }),
    [page, perPage, searchKeyword, sortState],
  );
  const queryString = React.useMemo(() => buildHospitalWalletsQueryString(query), [query]);

  const fetchHospitalWalletRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<HospitalWalletApiItem[]>("/hospital-wallets", nextQuery, {
      latestKey: "hospital-wallets:list",
    });

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "병의원 충전금 목록 조회에 실패했습니다.");
    }

    const responseMeta = (response.meta as DataTableMeta | null) ?? null;

    return {
      rows: response.data.map(normalizeHospitalWallet),
      meta: responseMeta
        ? {
            current_page: responseMeta.current_page,
            per_page: responseMeta.per_page,
            total: responseMeta.total,
            last_page: responseMeta.last_page,
          }
        : null,
    };
  }, []);

  const {
    rows,
    setRows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchHospitalWallets,
  } = useListData({
    cacheNamespace: "hospital-wallets",
    query,
    fetchRows: fetchHospitalWalletRows,
    errorMessage: "병의원 충전금 목록 조회 중 오류가 발생했습니다.",
  });

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? pathname + "?" + queryString : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const selectedRows = React.useMemo(
    () => rows.filter((row) => selectedHospitalIds.has(row.hospitalId)),
    [rows, selectedHospitalIds],
  );

  React.useEffect(() => {
    if (recentChanges.size === 0) return;

    const timer = window.setTimeout(() => {
      setRecentChanges(new Map());
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [recentChanges]);

  const clearSelection = React.useCallback(() => {
    setSelectedHospitalIds(new Set());
  }, []);

  const applyFilters = React.useCallback(() => {
    clearSelection();
    setRecentChanges(new Map());
    setPage(1);
    setSearchKeyword(searchInput.trim());
  }, [clearSelection, searchInput]);

  const resetFilters = React.useCallback(() => {
    clearSelection();
    setRecentChanges(new Map());
    setPage(1);
    setSearchInput("");
    setSearchKeyword("");
  }, [clearSelection]);

  const toggleRow = React.useCallback((hospitalId: number, checked: boolean) => {
    if (hospitalId <= 0) return;

    setSelectedHospitalIds((current) => {
      const next = new Set(current);
      if (checked) next.add(hospitalId);
      else next.delete(hospitalId);
      return next;
    });
  }, []);

  const toggleAllRows = React.useCallback(
    (checked: boolean) => {
      setSelectedHospitalIds(checked ? new Set(rows.map((row) => row.hospitalId).filter((id) => id > 0)) : new Set());
    },
    [rows],
  );

  const openServicePointModal = React.useCallback(
    (mode: HospitalWalletServicePointMode) => {
      if (selectedHospitalIds.size === 0) return;

      servicePointIdempotencyAttemptRef.current = null;
      setSubmitError(null);
      setInsufficientHospitals([]);
      setServicePointMode(mode);
    },
    [selectedHospitalIds.size],
  );

  const closeServicePointModal = React.useCallback(() => {
    if (submitting) return;

    servicePointIdempotencyAttemptRef.current = null;
    setSubmitError(null);
    setInsufficientHospitals([]);
    setServicePointMode(null);
  }, [submitting]);

  const submitServicePoint = React.useCallback(
    async (amount: number, reason: string) => {
      if (!servicePointMode || selectedHospitalIds.size === 0) return;

      const hospitalIds = Array.from(selectedHospitalIds).sort((a, b) => a - b);
      const signature = JSON.stringify({
        mode: servicePointMode,
        hospitalIds,
        amount,
        reason,
      });
      const previousAttempt = servicePointIdempotencyAttemptRef.current;
      const idempotencyKey =
        previousAttempt?.signature === signature ? previousAttempt.key : window.crypto.randomUUID();
      servicePointIdempotencyAttemptRef.current = { signature, key: idempotencyKey };

      setSubmitting(true);
      setSubmitError(null);
      setInsufficientHospitals([]);

      try {
        const response = await api.post<HospitalWalletServicePointResult>(
          servicePointMode === "grant" ? "/hospital-wallets/service-grants" : "/hospital-wallets/service-reclaims",
          {
            hospital_ids: hospitalIds,
            amount,
            reason,
            idempotency_key: idempotencyKey,
          },
        );

        if (!isApiSuccess(response)) {
          const nextInsufficientHospitals =
            servicePointMode === "reclaim" ? parseHospitalWalletInsufficientHospitals(response.error.details) : [];

          setInsufficientHospitals(nextInsufficientHospitals);
          setSubmitError(
            nextInsufficientHospitals.length > 0
              ? "회수 포인트가 서비스 잔여 포인트를 초과할 수 없습니다."
              : response.error.message ||
                  (servicePointMode === "grant"
                    ? "서비스 포인트 지급에 실패했습니다."
                    : "서비스 포인트 회수에 실패했습니다."),
          );
          return;
        }

        const balancesByHospitalId = new Map(
          response.data.items
            .filter((item) => item.hospital?.id)
            .map((item) => [
              Number(item.hospital?.id),
              {
                totalBalance: Number(item.total_balance),
                paidBalance: Number(item.paid_balance),
                serviceBalance: Number(item.service_balance),
              },
            ]),
        );

        setRows((currentRows) =>
          currentRows.map((row) => {
            const balances = balancesByHospitalId.get(row.hospitalId);
            return balances ? { ...row, ...balances } : row;
          }),
        );

        const processedCount = Number(response.data.processed_count ?? hospitalIds.length);
        const completedMode = servicePointMode;
        const completedChanges = new Map<number, HospitalWalletBalanceChange>();

        response.data.items.forEach((item) => {
          const hospitalId = Number(item.hospital?.id ?? 0);
          if (hospitalId > 0) {
            completedChanges.set(hospitalId, {
              mode: completedMode,
              amount: Math.abs(Number(item.amount ?? amount)),
            });
          }
        });

        servicePointIdempotencyAttemptRef.current = null;
        setServicePointMode(null);
        setInsufficientHospitals([]);
        setRecentChanges(completedChanges);
        clearSelection();
        showAlert({
          variant: "success",
          title: completedMode === "grant" ? "서비스 포인트 지급 완료" : "서비스 포인트 회수 완료",
          message:
            processedCount.toLocaleString("ko-KR") +
            "개 병의원에 서비스 포인트 " +
            amount.toLocaleString("ko-KR") +
            " P를 " +
            (completedMode === "grant" ? "지급했습니다." : "회수했습니다."),
        });
        void fetchHospitalWallets(true);
      } catch {
        setSubmitError(
          servicePointMode === "grant"
            ? "서비스 포인트 지급 중 오류가 발생했습니다."
            : "서비스 포인트 회수 중 오류가 발생했습니다.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [clearSelection, fetchHospitalWallets, selectedHospitalIds, servicePointMode, setRows, showAlert],
  );

  const openNoticeModal = React.useCallback(() => {
    if (selectedHospitalIds.size === 0) return;

    noticeIdempotencyAttemptRef.current = null;
    setNoticeSubmitError(null);
    setNoticeModalOpen(true);
  }, [selectedHospitalIds.size]);

  const closeNoticeModal = React.useCallback(() => {
    if (submitting) return;

    noticeIdempotencyAttemptRef.current = null;
    setNoticeSubmitError(null);
    setNoticeModalOpen(false);
  }, [submitting]);

  const submitNotice = React.useCallback(
    async ({
      messageParts,
      sendToManager,
      sendToRepresentative,
    }: {
      messageParts: TemplateMessagePart[];
      sendToManager: boolean;
      sendToRepresentative: boolean;
    }) => {
      if (selectedHospitalIds.size === 0) return;

      const hospitalIds = Array.from(selectedHospitalIds).sort((a, b) => a - b);
      const signature = JSON.stringify({ hospitalIds, messageParts, sendToManager, sendToRepresentative });
      const previousAttempt = noticeIdempotencyAttemptRef.current;
      const idempotencyKey =
        previousAttempt?.signature === signature ? previousAttempt.key : window.crypto.randomUUID();
      noticeIdempotencyAttemptRef.current = { signature, key: idempotencyKey };

      setSubmitting(true);
      setNoticeSubmitError(null);

      try {
        const response = await api.post<HospitalWalletNoticeBatchApiItem>("/hospital-wallets/balance-notices", {
          hospital_ids: hospitalIds,
          message_parts: messageParts,
          send_to_manager: sendToManager,
          send_to_representative: sendToRepresentative,
          idempotency_key: idempotencyKey,
        });

        if (!isApiSuccess(response)) {
          setNoticeSubmitError(response.error.message || "충전금 안내 문자 발송 요청에 실패했습니다.");
          return;
        }

        const hospitalCount = Number(response.data.hospital_count ?? hospitalIds.length);
        const recipientCount = Number(response.data.recipient_count ?? 0);
        const skippedCount = Number(response.data.skipped_count ?? 0);
        const queuedCount = Math.max(0, recipientCount - skippedCount);
        const skippedRecipientCounts = (response.data.deliveries ?? [])
          .filter((delivery) => delivery.status === "SKIPPED")
          .flatMap((delivery) => delivery.recipient_kind_labels ?? [])
          .reduce<Map<string, number>>((counts, label) => {
            counts.set(label, (counts.get(label) ?? 0) + 1);
            return counts;
          }, new Map());
        const skippedRecipients = Array.from(skippedRecipientCounts.entries())
          .map(([label, count]) => `${label} ${count.toLocaleString("ko-KR")}개`)
          .join(", ");
        const skippedMessage = skippedCount
          ? ` 미등록 연락처: ${skippedRecipients || `${skippedCount.toLocaleString("ko-KR")}개`}.`
          : "";

        noticeIdempotencyAttemptRef.current = null;
        setNoticeModalOpen(false);
        clearSelection();
        showAlert({
          variant: "success",
          title: "충전금 안내 발송 요청 완료",
          message: `${hospitalCount.toLocaleString("ko-KR")}개 병의원의 발송 가능한 연락처 ${queuedCount.toLocaleString("ko-KR")}개를 대기열에 등록했습니다.${skippedMessage}`,
        });
      } catch {
        setNoticeSubmitError("충전금 안내 문자 발송 요청 중 오류가 발생했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [clearSelection, selectedHospitalIds, showAlert],
  );

  const openRefundModal = React.useCallback(() => {
    if (selectedHospitalIds.size === 0) return;
    if (selectedHospitalIds.size > 1) {
      showAlert({
        variant: "warning",
        title: "병의원 선택 확인",
        message: "충전금 환불은 1개의 병의원만 선택할 수 있습니다.",
      });
      return;
    }

    refundIdempotencyAttemptRef.current = null;
    setRefundSubmitError(null);
    setRefundModalOpen(true);
  }, [selectedHospitalIds.size, showAlert]);

  const closeRefundModal = React.useCallback(() => {
    if (submitting) return;
    refundIdempotencyAttemptRef.current = null;
    setRefundSubmitError(null);
    setRefundModalOpen(false);
  }, [submitting]);

  const submitRefund = React.useCallback(
    async (payload: HospitalWalletRefundSubmitPayload) => {
      const hospital = selectedRows[0];
      if (!hospital) return;

      const signature = JSON.stringify({
        hospitalId: hospital.hospitalId,
        points: payload.points,
        reason: payload.reason,
        bankName: payload.bankName,
        accountNumber: payload.accountNumber,
        businessFile: payload.businessRegistrationFile
          ? [
              payload.businessRegistrationFile.name,
              payload.businessRegistrationFile.size,
              payload.businessRegistrationFile.lastModified,
            ]
          : null,
        bankbookFile: payload.bankbookFile
          ? [payload.bankbookFile.name, payload.bankbookFile.size, payload.bankbookFile.lastModified]
          : null,
      });
      const previousAttempt = refundIdempotencyAttemptRef.current;
      const idempotencyKey =
        previousAttempt?.signature === signature ? previousAttempt.key : window.crypto.randomUUID();
      refundIdempotencyAttemptRef.current = { signature, key: idempotencyKey };

      const formData = new FormData();
      formData.append("hospital_id", String(hospital.hospitalId));
      formData.append("amount", String(payload.points));
      formData.append("reason", payload.reason);
      formData.append("bank_name", payload.bankName);
      formData.append("account_number", payload.accountNumber);
      if (payload.businessRegistrationFile) {
        formData.append("business_registration_file", payload.businessRegistrationFile);
      }
      if (payload.bankbookFile) {
        formData.append("bankbook_file", payload.bankbookFile);
      }
      formData.append("idempotency_key", idempotencyKey);

      setSubmitting(true);
      setRefundSubmitError(null);

      try {
        const response = await api.post<HospitalWalletRefundCreateResult>("/hospital-wallets/refunds", formData);
        if (!isApiSuccess(response)) {
          setRefundSubmitError(response.error.message || "충전금 환불 처리에 실패했습니다.");
          return;
        }

        const wallet = response.data.wallet;
        setRows((currentRows) =>
          currentRows.map((row) =>
            row.hospitalId === hospital.hospitalId
              ? {
                  ...row,
                  totalBalance: Number(wallet.total_balance),
                  paidBalance: Number(wallet.paid_balance),
                  ownedPaidBalance: Number(wallet.owned_paid_balance),
                  reservedPaidBalance: Number(wallet.reserved_paid_balance),
                  serviceBalance: Number(wallet.service_balance),
                }
              : row,
          ),
        );
        setRecentChanges(new Map([[hospital.hospitalId, { mode: "refund", amount: payload.points }]]));
        refundIdempotencyAttemptRef.current = null;
        setRefundModalOpen(false);
        clearSelection();
        showAlert({
          variant: "success",
          title: response.data.direct_processed ? "충전금 환불 완료" : "충전금 환불 신청 완료",
          message: response.data.direct_processed
            ? `${hospital.hospitalName}의 충전금 ${payload.points.toLocaleString("ko-KR")} P를 환불 처리했습니다.`
            : `${hospital.hospitalName}의 충전금 환불을 신청했습니다.`,
        });
        void fetchHospitalWallets(true);
      } catch {
        setRefundSubmitError("충전금 환불 처리 중 오류가 발생했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [clearSelection, fetchHospitalWallets, selectedRows, setRows, showAlert],
  );

  return (
    <>
      <div className="space-y-4">
        <HospitalWalletsFilterPanel
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />

        <HospitalWalletsDataTable
          rows={rows}
          meta={meta}
          loading={loading}
          refreshing={refreshing}
          error={error}
          sortState={sortState}
          selectedHospitalIds={selectedHospitalIds}
          recentChanges={recentChanges}
          submitting={submitting}
          onToggleSort={(field: SortField) => {
            clearSelection();
            setRecentChanges(new Map());
            setPage(1);
            setSortState((current) => nextSortState(current, field));
          }}
          onToggleRow={toggleRow}
          onToggleAllRows={toggleAllRows}
          onOpenServicePointModal={openServicePointModal}
          onOpenNoticeModal={openNoticeModal}
          onOpenRefundModal={openRefundModal}
          directRefund={canDirectRefund}
          onGoPage={(nextPage) => {
            clearSelection();
            setRecentChanges(new Map());
            setPage(nextPage);
          }}
        />
      </div>

      <HospitalWalletServicePointModal
        isOpen={servicePointMode !== null}
        mode={servicePointMode ?? "grant"}
        selectedRows={selectedRows}
        insufficientHospitals={insufficientHospitals}
        submitting={submitting}
        submitError={submitError}
        onClose={closeServicePointModal}
        onSubmit={(amount, reason) => void submitServicePoint(amount, reason)}
      />

      <HospitalWalletNoticeModal
        isOpen={noticeModalOpen}
        selectedRows={selectedRows}
        submitting={submitting}
        submitError={noticeSubmitError}
        onClose={closeNoticeModal}
        onSubmit={(payload) => void submitNotice(payload)}
      />

      <HospitalWalletRefundModal
        isOpen={refundModalOpen}
        hospital={selectedRows[0] ?? null}
        directProcess={canDirectRefund}
        submitting={submitting}
        submitError={refundSubmitError}
        onClose={closeRefundModal}
        onSubmit={(payload) => void submitRefund(payload)}
      />
    </>
  );
}
