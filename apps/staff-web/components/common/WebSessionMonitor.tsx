"use client";

import { useEffect } from "react";
import { monitorWebSession } from "@beaulab/api-client";
import { useGlobalAlert } from "@beaulab/ui-admin";
import { api } from "@/lib/common/api";
import { clearLocalSession } from "@/lib/common/auth/session";

export function WebSessionMonitor() {
  const { showAlert, dismissAlert } = useGlobalAlert();
  useEffect(
    () =>
      monitorWebSession(api, "staff", {
        onExpired: () => {
          clearLocalSession();
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`/login?next=${next}`);
        },
        onChanged: () => {
          clearLocalSession();
          window.location.reload();
        },
        onWarning: (seconds) => {
          if (!seconds) {
            dismissAlert("session-expiry");
            return;
          }
          showAlert({
            id: "session-expiry",
            variant: "warning",
            title: "로그인 만료 예정",
            message: `${seconds}초 후 로그인이 만료됩니다. 작성 중인 내용을 저장해 주세요.`,
            durationMs: 0,
          });
        },
      }),
    [showAlert, dismissAlert],
  );
  return null;
}
