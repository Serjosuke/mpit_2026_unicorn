"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/storage";
import type { User } from "@/lib/types";

interface AppContextValue {
  user: User | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.me();
      setUser(me);
    } catch (error) {
      clearToken();
      setUser(null);
      if (error instanceof ApiError) {
        toast.error(error.detail);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const signIn = useCallback(
    async (token: string) => {
      setToken(token);
      await refreshMe();
      router.push("/dashboard");
    },
    [refreshMe, router]
  );

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    toast.success("Вы вышли из системы");
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshMe,
      signIn,
      signOut
    }),
    [loading, refreshMe, signIn, signOut, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
