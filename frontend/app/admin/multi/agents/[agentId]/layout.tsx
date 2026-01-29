"use client";

import { useParams } from "next/navigation";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { useModeStore } from "@/stores";
import { AgentDetailLayout } from "@/components/admin";

export default function MultiAgentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const agentId = params.agentId as string;
  const { mode } = useModeStore();

  const { agent, isLoading, error, refresh } = useAgentDetail({ agentId });
  const isPreviewMode = mode === "single";

  return (
    <AgentDetailLayout
      agent={agent}
      isLoading={isLoading}
      error={error}
      context="multi"
      basePath={`/admin/multi/agents/${agentId}`}
      backPath="/admin/multi/agents"
      backLabel="返回子 Agent 列表"
      isPreviewMode={isPreviewMode}
      onRefresh={refresh}
    >
      {children}
    </AgentDetailLayout>
  );
}
