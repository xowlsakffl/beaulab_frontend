import type { ReactNode } from "react";
import { HospitalSessionProvider } from "@/components/common/HospitalSessionProvider";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <HospitalSessionProvider>{children}</HospitalSessionProvider>;
}
