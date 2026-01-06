"use client";

import { AgentCard } from "./agent-card";
import type { Agent } from "@/lib/api/agents";
import { cn } from "@/lib/utils";

interface AgentListProps {
  agents: Agent[];
  className?: string;
}

export function AgentList({ agents, className }: AgentListProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
