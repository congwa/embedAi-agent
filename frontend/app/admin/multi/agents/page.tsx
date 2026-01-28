"use client";

import { useState, useMemo } from "react";
import { Plus, Bot, RefreshCw, Network } from "lucide-react";
import { useAgents } from "@/lib/hooks/use-agents";
import {
  PageHeader,
  LoadingState,
  ErrorAlert,
  EmptyState,
} from "@/components/admin";
import { AgentList, AgentFilterBar, CreateAgentDialog } from "@/components/admin/agents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useModeStore } from "@/stores";

interface AgentFilters {
  status?: string;
  type?: string;
  searchQuery?: string;
}

export default function MultiModeAgentsPage() {
  const { agents, isLoading, error, loadAgents } = useAgents();
  const { mode } = useModeStore();
  const [filters, setFilters] = useState<AgentFilters>({});

  const isPreviewMode = mode === "single";

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesStatus =
        !filters.status || agent.status === filters.status;
      const matchesType = !filters.type || agent.type === filters.type;
      const matchesSearch =
        !filters.searchQuery ||
        agent.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(filters.searchQuery.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [agents, filters]);

  const stats = useMemo(() => {
    const enabled = agents.filter((a) => a.status === "enabled").length;
    return {
      total: agents.length,
      enabled,
      disabled: agents.length - enabled,
    };
  }, [agents]);

  if (isLoading) {
    return <LoadingState text="加载子 Agent 列表..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="子 Agent 管理"
          description="管理参与多 Agent 编排的子 Agent"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAgents}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <CreateAgentDialog onCreated={loadAgents} />
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* 预设模式提示 */}
      {isPreviewMode && (
        <Alert className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30">
          <Network className="h-4 w-4 text-violet-600" />
          <AlertDescription>
            当前为<strong className="mx-1">预设配置模式</strong>。在此配置的子 Agent 将在切换到 Supervisor 模式后生效。
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">子 Agent 总数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bot className="h-8 w-8 text-zinc-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">可参与编排</p>
                <p className="text-2xl font-bold text-violet-600">{stats.enabled}</p>
              </div>
              <Network className="h-8 w-8 text-violet-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">已禁用</p>
                <p className="text-2xl font-bold text-zinc-400">{stats.disabled}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-zinc-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      <AgentFilterBar filters={filters} onFilterChange={setFilters} />

      {filteredAgents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="暂无子 Agent"
          description={
            agents.length > 0
              ? "没有匹配筛选条件的 Agent"
              : "创建子 Agent 参与多 Agent 编排"
          }
          action={
            agents.length === 0 && (
              <CreateAgentDialog onCreated={loadAgents} />
            )
          }
        />
      ) : (
        <AgentList agents={filteredAgents} basePath="/admin/multi/agents" />
      )}
    </div>
  );
}
