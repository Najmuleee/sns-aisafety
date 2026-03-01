import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

// Demo mode - bypass OAuth for testing
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_USER = {
  id: 1,
  openId: "demo-user-001",
  name: "Demo User",
  email: "demo@pfip.local",
  loginMethod: "demo",
  role: "user" as const,
  accountType: "individual" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Export demo mode for testing
  if (typeof window !== 'undefined' && !(window as any).__PFIP_DEMO_MODE) {
    (window as any).__PFIP_DEMO_MODE = DEMO_MODE;
  }
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // In demo mode, return mock user immediately
  const meQuery = DEMO_MODE
    ? ({
        data: DEMO_USER,
        isLoading: false,
        error: null,
        refetch: async () => ({ data: DEMO_USER }),
      } as any)
    : trpc.auth.me.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
      });

  const logoutMutation = DEMO_MODE
    ? ({
        mutateAsync: async () => ({}),
        isPending: false,
        error: null,
      } as any)
    : trpc.auth.logout.useMutation({
        onSuccess: () => {
          utils.auth.me.setData(undefined, null);
        },
      });

  const logout = useCallback(async () => {
    if (DEMO_MODE) {
      console.log("Demo mode: logout skipped");
      return;
    }
    try {
      await (logoutMutation as any).mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (DEMO_MODE) return; // Skip redirect in demo mode
    if (!redirectOnUnauthenticated) return;
    if ((meQuery as any).isLoading || (logoutMutation as any).isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => (meQuery as any).refetch?.() || Promise.resolve({ data: DEMO_USER }),
    logout,
  };
}

export { DEMO_MODE, DEMO_USER };
