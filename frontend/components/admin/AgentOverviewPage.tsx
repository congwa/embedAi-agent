"use client";

import { useParams } from "next/navigation";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import {
  SystemPromptCard,
  BasicConfigCard,
  MiddlewareFlagsCard,
  ToolPolicyCard,
  ToolCategoriesCard,
  SupervisorCard,
  RoutingConfigCard,
} from "@/components/admin/cards";
import type { AgentDetailContext } from "@/lib/config/agent-tabs";

export interface AgentOverviewPageProps {
  context: AgentDetailContext;
}

const BASE_PATHS: Record<AgentDetailContext, string> = {
  center: "/admin/agents",
  single: "/admin/single/agents",
  multi: "/admin/multi/agents",
};

export function AgentOverviewPage({ context }: AgentOverviewPageProps) {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent } = useAgentDetail({ agentId });

  if (!agent) return null;

  const basePath = BASE_PATHS[context];
  const isCenter = context === "center";
  const isMulti = context === "multi";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 系统提示词 */}
      <SystemPromptCard
        agent={agent}
        editHref={`${basePath}/${agentId}/system-prompt`}
      />

      {/* 路由配置入口 - 仅 multi 上下文显示 */}
      {isMulti && (
        <RoutingConfigCard agent={agent} basePath={basePath} />
      )}

      {/* 基础配置 */}
      <BasicConfigCard
        agent={agent}
        showResponseFormat={!isMulti}
      />

      {/* 中间件配置 */}
      <MiddlewareFlagsCard
        agent={agent}
        showInfoPopover={isCenter}
      />

      {/* 工具策略 */}
      <ToolPolicyCard
        agent={agent}
        showDescription={!isMulti}
        showFullDetails={!isMulti}
      />

      {/* 工具类别 */}
      <ToolCategoriesCard
        agent={agent}
        showDescription={!isMulti}
        showInfoPopover={isCenter}
        showToolDesc={!isMulti}
      />

      {/* Supervisor 配置 - 仅 center 上下文显示 */}
      {isCenter && (
        <SupervisorCard agent={agent} basePath={basePath} />
      )}
    </div>
  );
}
