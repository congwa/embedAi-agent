"use client";

import { useModeStore } from "@/stores";
import { SingleAgentSidebar } from "./single-sidebar";
import { MultiAgentSidebar } from "./multi-sidebar";

/**
 * 管理后台侧边栏
 * 根据当前系统模式自动选择对应的侧边栏组件
 */
export function AdminSidebar() {
  const { mode } = useModeStore();

  return mode === "supervisor" 
    ? <MultiAgentSidebar />
    : <SingleAgentSidebar />;
}

export { SingleAgentSidebar } from "./single-sidebar";
export { MultiAgentSidebar } from "./multi-sidebar";
