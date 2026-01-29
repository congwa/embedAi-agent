"use client";

import { useParams } from "next/navigation";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { useAgentStore } from "@/stores";
import { AgentDetailLayout } from "@/components/admin";

export default function AgentCenterDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const agentId = params.agentId as string;

  const { agent, isLoading, error, refresh } = useAgentDetail({ agentId });
  const activateAgent = useAgentStore((s) => s.activateAgent);
  const activeAgent = useAgentStore((s) => s.activeAgent());

  const handleActivate = async () => {
    await activateAgent(agentId);
  };

  return (
    <AgentDetailLayout
      agent={agent}
      isLoading={isLoading}
      error={error}
      context="center"
      basePath={`/admin/agents/${agentId}`}
      backPath="/admin/agents"
      backLabel="返回 Agent 列表"
      activeAgentId={activeAgent?.id}
      onRefresh={refresh}
      onActivate={handleActivate}
    >
      {children}
    </AgentDetailLayout>
  );
}
