"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Network, ChevronDown, Check, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useModeStore } from "@/stores";
import { cn } from "@/lib/utils";

interface ModeIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * 模式指示器组件
 * 
 * 设计原则：配置与应用分离
 * - 下拉菜单只显示当前状态和配置入口
 * - 点击模式选项跳转到对应配置页面，不直接切换
 * - 只有在模式设置页面才能真正切换模式（带确认弹窗）
 */
export function ModeIndicator({ className, showLabel = true }: ModeIndicatorProps) {
  const router = useRouter();
  const { mode, isLoading, fetchModeState } = useModeStore();

  useEffect(() => {
    fetchModeState();
  }, [fetchModeState]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",
            className
          )}
          disabled={isLoading}
        >
          {mode === "supervisor" ? (
            <>
              <Network className="h-4 w-4 text-violet-500" />
              {showLabel && <span>Supervisor</span>}
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 text-emerald-500" />
              {showLabel && <span>单 Agent</span>}
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* 当前状态 */}
        <DropdownMenuLabel className="text-xs text-zinc-500">
          当前运行模式
        </DropdownMenuLabel>
        
        {/* 单 Agent 模式 */}
        <DropdownMenuItem
          onClick={() => router.push("/admin/workspace")}
          className={cn(
            "cursor-pointer",
            mode === "single" && "bg-emerald-50 dark:bg-emerald-900/20"
          )}
        >
          <Bot className={cn("mr-2 h-4 w-4", mode === "single" ? "text-emerald-600" : "text-zinc-400")} />
          <div className="flex flex-1 flex-col">
            <span className={mode === "single" ? "font-medium" : ""}>单 Agent 模式</span>
            <span className="text-xs text-zinc-500">一个 Agent 处理所有请求</span>
          </div>
          {mode === "single" && <Check className="ml-2 h-4 w-4 text-emerald-600" />}
        </DropdownMenuItem>

        {/* Supervisor 模式 */}
        <DropdownMenuItem
          onClick={() => router.push("/admin/settings/supervisor")}
          className={cn(
            "cursor-pointer",
            mode === "supervisor" && "bg-violet-50 dark:bg-violet-900/20"
          )}
        >
          <Network className={cn("mr-2 h-4 w-4", mode === "supervisor" ? "text-violet-600" : "text-zinc-400")} />
          <div className="flex flex-1 flex-col">
            <span className={mode === "supervisor" ? "font-medium" : ""}>Supervisor 模式</span>
            <span className="text-xs text-zinc-500">多 Agent 协作智能路由</span>
          </div>
          {mode === "supervisor" ? (
            <Check className="ml-2 h-4 w-4 text-violet-600" />
          ) : (
            <ArrowRight className="ml-2 h-4 w-4 text-zinc-400" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 模式设置入口 */}
        <DropdownMenuItem
          onClick={() => router.push("/admin/settings/mode")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <div className="flex flex-1 flex-col">
            <span>切换运行模式</span>
            <span className="text-xs text-zinc-500">在此处应用模式变更</span>
          </div>
          <ArrowRight className="ml-2 h-4 w-4 text-zinc-400" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
