"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Bot, RefreshCw, Network } from "lucide-react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { useModeStore } from "@/stores";
import { LoadingState, ErrorAlert, StatusBadge } from "@/components/admin";
import { getModeLabel } from "@/lib/config/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const typeLabels: Record<string, string> = {
  product: "商品推荐",
  faq: "FAQ 问答",
  kb: "知识库",
  custom: "自定义",
};

// 多 Agent 模式下子 Agent 的 Tab 配置
const baseTabs = [
  { id: "overview", label: "基础设置", href: "" },
  { id: "routing", label: "路由配置", href: "/routing" },
  { id: "tools", label: "工具配置", href: "/tools" },
  { id: "greeting", label: "开场白", href: "/greeting" },
  { id: "middleware", label: "中间件", href: "/middleware" },
];

const getTypeTabs = (agentType: string) => {
  const tabs: { id: string; label: string; href: string }[] = [];
  
  if (agentType === "faq") {
    tabs.push({ id: "faq", label: "FAQ 管理", href: "/faq" });
  }
  
  if (agentType === "kb" || agentType === "faq") {
    tabs.push({ id: "knowledge", label: "知识库", href: "/knowledge" });
  }
  
  return tabs;
};

export default function MultiAgentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const agentId = params.agentId as string;
  const { mode } = useModeStore();

  const { agent, isLoading, error, refresh } = useAgentDetail({ agentId });
  const isPreviewMode = mode === "single";

  const agentTabs = agent
    ? [...baseTabs, ...getTypeTabs(agent.type)]
    : baseTabs;

  const currentTab = agentTabs.find((tab) => {
    const tabPath = `/admin/multi/agents/${agentId}${tab.href}`;
    return pathname === tabPath;
  })?.id || "overview";

  if (isLoading) {
    return <LoadingState text="加载子 Agent 详情..." />;
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/multi/agents"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          返回列表
        </Link>
        <ErrorAlert error={error || "Agent 不存在"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑和返回 */}
      <Link
        href="/admin/multi/agents"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        返回子 Agent 列表
      </Link>

      {/* 预设模式提示 */}
      {isPreviewMode && (
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {agent.name}
              </h1>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                <Network className="mr-1 h-3 w-3" />
                子 Agent
              </Badge>
              <StatusBadge enabled={agent.status === "enabled"} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
              <Badge variant="outline">{typeLabels[agent.type] || agent.type}</Badge>
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
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* Tab 导航 */}
      <Tabs value={currentTab}>
        <TabsList>
          {agentTabs.map((tab) => (
            <Link key={tab.id} href={`/admin/multi/agents/${agentId}${tab.href}`}>
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
