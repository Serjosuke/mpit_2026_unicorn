"use client";

import { ClientShell } from "@/components/providers/client-shell";
import { RouteGuard } from "@/components/layout/route-guard";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientShell>
      <RouteGuard>{children}</RouteGuard>
    </ClientShell>
  );
}
