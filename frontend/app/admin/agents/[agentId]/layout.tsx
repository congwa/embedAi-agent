"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Bot, RefreshCw } from "lucide-react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { LoadingState, ErrorAlert, StatusBadge } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  product: "商品推荐",
  faq: "FAQ 问答",
  kb: "知识库",
  custom: "自定义",
};

const agentTabs = [
  { id: "overview", label: "基础设置", href: "" },
  { id: "knowledge", label: "知识库 & FAQ", href: "/knowledge" },
  { id: "tools", label: "工具配置", href: "/tools" },
  { id: "conversations", label: "会话洞察", href: "/conversations" },
];

export default function AgentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const agentId = params.agentId as string;

  const { agent, isLoading, error, refresh } = useAgentDetail({ agentId });

  const currentTab = agentTabs.find((tab) => {
    const tabPath = `/admin/agents/${agentId}${tab.href}`;
    return pathname === tabPath;
  })?.id || "overview";

  if (isLoading) {
    return <LoadingState text="加载 Agent 详情..." />;
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/agents"
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
        href="/admin/agents"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        返回 Agent 列表
      </Link>

      {/* Agent 头部信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Bot className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {agent.name}
              </h1>
              {agent.is_default && (
                <Badge variant="secondary">默认</Badge>
              )}
              <StatusBadge enabled={agent.status === "enabled"} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
              <Badge variant="outline">{typeLabels[agent.type] || agent.type}</Badge>
              <span>·</span>
              <span>模式: {agent.mode_default}</span>
              {agent.knowledge_config?.name && (
                <>
                  <span>·</span>
                  <span>知识库: {agent.knowledge_config.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新缓存
        </Button>
      </div>

      {/* Tab 导航 */}
      <Tabs value={currentTab}>
        <TabsList>
          {agentTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} asChild>
              <Link href={`/admin/agents/${agentId}${tab.href}`}>
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 页面内容 */}
      {children}
    </div>
  );
}
