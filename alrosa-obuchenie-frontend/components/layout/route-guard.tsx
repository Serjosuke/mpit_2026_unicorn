"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useApp } from "@/components/providers/app-provider";

const publicRoutes = ["/login", "/register"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isPublic = publicRoutes.includes(pathname);
    if (!user && !isPublic) {
      router.replace("/login");
    }
    if (user && isPublic) {
      router.replace("/dashboard");
    }
  }, [loading, pathname, router, user]);

  return <>{children}</>;
}
