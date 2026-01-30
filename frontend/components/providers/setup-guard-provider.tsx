"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSetupState, type QuickSetupState } from "@/lib/api/quick-setup";

interface SetupGuardContextValue {
  setupState: QuickSetupState | null;
  isLoading: boolean;
  isSetupCompleted: boolean;
  isEssentialCompleted: boolean;
  setupLevel: "none" | "essential" | "full";
  isOnSetupPage: boolean;
  refreshSetupState: () => Promise<QuickSetupState | null>;
}

const SetupGuardContext = createContext<SetupGuardContextValue | null>(null);

export function useSetupGuard() {
  const context = useContext(SetupGuardContext);
  if (!context) {
    throw new Error("useSetupGuard must be used within SetupGuardProvider");
  }
  return context;
}

interface SetupGuardProviderProps {
  children: React.ReactNode;
}

const SETUP_PATH = "/admin/quick-setup";

export function SetupGuardProvider({ children }: SetupGuardProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [setupState, setSetupState] = useState<QuickSetupState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const isOnSetupPage = pathname?.startsWith(SETUP_PATH) ?? false;

  const refreshSetupState = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await getSetupState();
      setSetupState(state);
      return state;
    } catch (error) {
      console.error("Failed to load setup state:", error);
      return null;
    } finally {
      setIsLoading(false);
      setHasChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshSetupState();
  }, [refreshSetupState]);

  useEffect(() => {
    if (!hasChecked || isLoading || isOnSetupPage) return;

    if (setupState && !setupState.completed) {
      router.replace(SETUP_PATH);
    }
  }, [setupState, hasChecked, isLoading, isOnSetupPage, router]);

  const isSetupCompleted = setupState?.completed ?? false;
  const isEssentialCompleted = setupState?.essential_completed ?? false;
  const setupLevel = setupState?.setup_level ?? "none";

  if (isLoading && !hasChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mx-auto" />
          <p className="text-sm text-zinc-500">正在检查配置状态...</p>
        </div>
      </div>
    );
  }

  if (!isOnSetupPage && setupState && !setupState.completed) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mx-auto" />
          <p className="text-sm text-zinc-500">正在跳转到快速设置...</p>
        </div>
      </div>
    );
  }

  return (
    <SetupGuardContext.Provider
      value={{
        setupState,
        isLoading,
        isSetupCompleted,
        isEssentialCompleted,
        setupLevel,
        isOnSetupPage,
        refreshSetupState,
      }}
    >
      {children}
    </SetupGuardContext.Provider>
  );
}
