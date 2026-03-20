"use client";

import type { ReactNode } from "react";
import React from "react";
import Alert from "../components/ui/alert/Alert";

export type GlobalAlertVariant = "success" | "error" | "warning" | "info";

export type GlobalAlertInput = {
  id?: string;
  variant: GlobalAlertVariant;
  title: string;
  message: string;
  durationMs?: number;
};

type GlobalAlertItem = GlobalAlertInput & {
  id: string;
};

type GlobalAlertContextValue = {
  showAlert: (input: GlobalAlertInput) => string;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
};

const GlobalAlertContext = React.createContext<GlobalAlertContextValue | undefined>(undefined);
const DEFAULT_ALERT_DURATION_MS = 5000;

function createAlertId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useGlobalAlert() {
  const context = React.useContext(GlobalAlertContext);

  if (!context) {
    throw new Error("useGlobalAlert must be used within a GlobalAlertProvider");
  }

  return context;
}

export function GlobalAlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = React.useState<GlobalAlertItem[]>([]);
  const dismissTimerIdsRef = React.useRef(new Map<string, number>());

  const clearDismissTimer = React.useCallback((id: string) => {
    const timerId = dismissTimerIdsRef.current.get(id);

    if (timerId === undefined) return;

    window.clearTimeout(timerId);
    dismissTimerIdsRef.current.delete(id);
  }, []);

  const dismissAlert = React.useCallback((id: string) => {
    clearDismissTimer(id);
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, [clearDismissTimer]);

  const clearAlerts = React.useCallback(() => {
    dismissTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
    dismissTimerIdsRef.current.clear();
    setAlerts([]);
  }, []);

  const showAlert = React.useCallback((input: GlobalAlertInput) => {
    const nextId = input.id ?? createAlertId();
    const durationMs = input.durationMs ?? DEFAULT_ALERT_DURATION_MS;

    setAlerts((prev) => {
      const nextAlert: GlobalAlertItem = {
        ...input,
        id: nextId,
      };

      return [...prev.filter((alert) => alert.id !== nextId), nextAlert];
    });

    clearDismissTimer(nextId);

    if (durationMs > 0) {
      const timerId = window.setTimeout(() => {
        dismissAlert(nextId);
      }, durationMs);

      dismissTimerIdsRef.current.set(nextId, timerId);
    }

    return nextId;
  }, [clearDismissTimer, dismissAlert]);

  React.useEffect(() => {
    return () => {
      dismissTimerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
      dismissTimerIdsRef.current.clear();
    };
  }, []);

  const value = React.useMemo<GlobalAlertContextValue>(
    () => ({
      showAlert,
      dismissAlert,
      clearAlerts,
    }),
    [clearAlerts, dismissAlert, showAlert],
  );

  return (
    <GlobalAlertContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[140] flex flex-col items-center gap-3 px-4"
      >
        {alerts.map((alert) => (
          <div key={alert.id} className="pointer-events-auto w-full max-w-3xl">
            <Alert
              variant={alert.variant}
              title={alert.title}
              message={alert.message}
              onDismiss={() => dismissAlert(alert.id)}
              className="border shadow-lg shadow-black/10 backdrop-blur-sm dark:shadow-black/30"
            />
          </div>
        ))}
      </div>
    </GlobalAlertContext.Provider>
  );
}
