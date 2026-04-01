"use client";

import { AppProvider } from "@/components/providers/app-provider";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
