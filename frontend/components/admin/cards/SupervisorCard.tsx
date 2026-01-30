"use client";

import Link from "next/link";
import { Network, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/lib/api/agents";

export interface SupervisorCardProps {
  agent: Agent;
  basePath: string;
}

export function SupervisorCard({ agent, basePath }: SupervisorCardProps) {
  return (
    <Card className={agent.is_supervisor ? "border-orange-200 bg-orange-50/30 dark:border-orange-900 dark:bg-orange-950/20" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className={`h-4 w-4 ${agent.is_supervisor ? "text-orange-500" : "text-zinc-400"}`} />
            <CardTitle className="text-base">多 Agent 编排</CardTitle>
          </div>
          <Link href={`${basePath}/${agent.id}/supervisor`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              配置
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription>
          {agent.is_supervisor ? "已启用 Supervisor 模式" : "未启用"}
        </CardDescription>
      </CardHeader>
      {agent.is_supervisor && (
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">子 Agent 数量</span>
            <Badge variant="secondary">{agent.sub_agents?.length || 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">路由策略</span>
            <Badge variant="outline">{agent.routing_policy?.type || "未配置"}</Badge>
          </div>
          {agent.sub_agents && agent.sub_agents.length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs text-zinc-500 block mb-2">子 Agent 列表</span>
              <div className="flex flex-wrap gap-1">
                {agent.sub_agents.map((sa) => (
                  <Badge key={sa.agent_id} variant="secondary" className="text-xs">
                    {sa.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
