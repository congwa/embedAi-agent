"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModeStore } from "@/stores";

/**
 * 工作空间重定向页面
 * 根据当前模式自动重定向到对应的工作空间
 */
export default function WorkspacePage() {
  const router = useRouter();
  const { mode, fetchModeState } = useModeStore();

  useEffect(() => {
    fetchModeState();
  }, [fetchModeState]);

  useEffect(() => {
    // 根据模式重定向到对应的工作空间
    if (mode === "supervisor") {
      router.replace("/admin/supervisor");
    } else {
      router.replace("/admin/single");
    }
  }, [mode, router]);

  // 显示加载状态
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
    </div>
  );
}
