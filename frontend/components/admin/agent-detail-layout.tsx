"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Bot, RefreshCw, Zap, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingState, ErrorAlert, StatusBadge } from "@/components/admin";
import { getModeLabel } from "@/lib/config/labels";
import {
  type AgentDetailContext,
  getAgentTabs,
  getCurrentTabId,
  AGENT_TYPE_LABELS,
} from "@/lib/config/agent-tabs";
import { cn } from "@/lib/utils";

export interface AgentDetailLayoutProps {
  agent: {
    id: string;
    name: string;
    type: string;
    status: string;
    mode_default: string;
    is_default?: boolean;
    is_supervisor?: boolean;
    knowledge_config?: { name: string } | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  context: AgentDetailContext;
  basePath: string;
  backPath: string;
  backLabel: string;
  activeAgentId?: string | null;
  isPreviewMode?: boolean;
  onRefresh: () => void;
  onActivate?: () => Promise<void>;
  children: React.ReactNode;
}

/**
 * Agent 详情页共享 Layout 组件
 * 统一管理三个入口（agents/single/multi）的布局和 Tab 导航
 */
export function AgentDetailLayout({
  agent,
  isLoading,
  error,
  context,
  basePath,
  backPath,
  backLabel,
  activeAgentId,
  isPreviewMode = false,
  onRefresh,
  onActivate,
  children,
}: AgentDetailLayoutProps) {
  const pathname = usePathname();
  const [isActivating, setIsActivating] = useState(false);

  // 根据上下文选择主题色
  const themeColors = {
    center: {
      icon: "bg-zinc-100 dark:bg-zinc-800",
      iconText: "text-zinc-600 dark:text-zinc-400",
      badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    single: {
      icon: "bg-emerald-100 dark:bg-emerald-900/30",
      iconText: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    multi: {
      icon: "bg-violet-100 dark:bg-violet-900/30",
      iconText: "text-violet-600 dark:text-violet-400",
      badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
      button: "bg-violet-600 hover:bg-violet-700",
    },
  };

  const theme = themeColors[context];

  // 生成 Tab 配置
  const tabs = agent
    ? getAgentTabs({
        agentType: agent.type,
        context,
        isSupervisor: agent.is_supervisor,
      })
    : [];

  const currentTab = getCurrentTabId(pathname, basePath, tabs);
  const isCurrentAgentActive = activeAgentId === agent?.id;

  const handleActivate = async () => {
    if (!onActivate) return;
    setIsActivating(true);
    await onActivate();
    setIsActivating(false);
    onRefresh();
  };

  if (isLoading) {
    return <LoadingState text="加载 Agent 详情..." />;
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <Link
          href={backPath}
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {backLabel}
        </Link>
        <ErrorAlert error={error || "Agent 不存在"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑和返回 */}
      <Link
        href={backPath}
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {backLabel}
      </Link>

      {/* 预设模式提示 (仅 multi 入口显示) */}
      {isPreviewMode && context === "multi" && (
        <Alert className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30">
          <Network className="h-4 w-4 text-violet-600" />
          <AlertDescription>
            当前为<strong className="mx-1">预设配置模式</strong>。配置将在切换到 Supervisor 模式后生效。
          </AlertDescription>
        </Alert>
      )}

      {/* Agent 头部信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", theme.icon)}>
            {context === "multi" ? (
              <Bot className={cn("h-6 w-6", theme.iconText)} />
            ) : (
              <Bot className={cn("h-6 w-6", theme.iconText)} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {agent.name}
              </h1>
              {context === "multi" && (
                <Badge className={theme.badge}>
                  <Network className="mr-1 h-3 w-3" />
                  子 Agent
                </Badge>
              )}
              {isCurrentAgentActive && context !== "multi" && (
                <Badge className={theme.badge}>
                  <Zap className="mr-1 h-3 w-3" />
                  当前激活
                </Badge>
              )}
              {agent.is_default && !isCurrentAgentActive && (
                <Badge variant="secondary">默认</Badge>
              )}
              <StatusBadge enabled={agent.status === "enabled"} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
              <Badge variant="outline">{AGENT_TYPE_LABELS[agent.type] || agent.type}</Badge>
              <span>·</span>
              <span>模式: {getModeLabel(agent.mode_default)}</span>
              {agent.knowledge_config?.name && (
                <>
                  <span>·</span>
                  <span>知识库: {agent.knowledge_config.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 激活按钮 - 仅 single 和 center 入口显示 */}
          {onActivate && !isCurrentAgentActive && agent.status === "enabled" && context !== "multi" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm" className={theme.button}>
                  <Zap className="mr-2 h-4 w-4" />
                  设为激活
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>激活此 Agent</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>确定要将 <strong>{agent.name}</strong> 设为激活状态吗？</p>
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ 激活后，所有用户对话将由该 Agent 处理。
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleActivate}
                    disabled={isActivating}
                    className={theme.button}
                  >
                    {isActivating ? "激活中..." : "确认激活"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {context === "center" ? "刷新缓存" : "刷新"}
          </Button>
        </div>
      </div>

      {/* Tab 导航 */}
      <Tabs value={currentTab}>
        <TabsList>
          {tabs.map((tab) => (
            <Link key={tab.id} href={`${basePath}${tab.href}`}>
              <TabsTrigger value={tab.id}>
                {tab.label}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>

      {/* 页面内容 */}
      {children}
    </div>
  );
}
