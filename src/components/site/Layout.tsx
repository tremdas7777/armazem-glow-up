import type { ReactNode } from "react";
import { StoreShell } from "@/components/store/Shell";

export function SiteLayout({ children }: { children: ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
