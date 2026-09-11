"use client";

import { createContext, useContext } from "react";
import type { HospitalSession } from "@beaulab/types";

export type HospitalSessionState = {
  session: HospitalSession;
  warning: number;
  error: string;
  isLoggingOut: boolean;
  logout: () => Promise<void>;
};

export const HospitalSessionContext = createContext<HospitalSessionState | null>(null);

export function useHospitalSession() {
  const state = useContext(HospitalSessionContext);
  if (!state) throw new Error("useHospitalSession requires HospitalSessionProvider");
  return state;
}
