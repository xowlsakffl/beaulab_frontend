"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SpinnerBlock } from "@beaulab/ui-admin";
import { monitorWebSession } from "@beaulab/api-client/web";
import type { HospitalSession } from "@beaulab/types";
import { HospitalSessionContext } from "@/hooks/common/useHospitalSession";
import { hospitalSession } from "@/lib/common/session";
import { hospitalApi } from "@/lib/common/api";

export function HospitalSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<HospitalSession | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    void hospitalSession
      .ensure()
      .then((value) => {
        if (!active) return;
        if (!value) router.replace("/login");
        else setSession(value);
      })
      .catch(() => {
        if (active) setError("로그인 정보를 확인하지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!session) return;
    return monitorWebSession(hospitalApi, "hospital", {
      onExpired: () => {
        setSession(null);
        window.location.replace("/login");
      },
      onChanged: () => window.location.reload(),
      onWarning: setWarning,
    });
  }, [session]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    setError("");
    try {
      await hospitalSession.logout();
      setSession(null);
      router.replace("/login");
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  const value = useMemo(
    () => (session ? { session, warning, error, isLoggingOut, logout } : null),
    [session, warning, error, isLoggingOut, logout],
  );

  if (!value)
    return error ? (
      <p role="alert" className="p-8 text-sm text-error-500">
        {error}
      </p>
    ) : (
      <SpinnerBlock className="min-h-dvh" label="로그인 확인 중" />
    );

  return <HospitalSessionContext.Provider value={value}>{children}</HospitalSessionContext.Provider>;
}
