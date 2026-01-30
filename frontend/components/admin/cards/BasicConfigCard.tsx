"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin";
import type { Agent } from "@/lib/api/agents";

export interface BasicConfigCardProps {
  agent: Agent;
  showResponseFormat?: boolean;
}

export function BasicConfigCard({ agent, showResponseFormat = true }: BasicConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">基础配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-zinc-500">Agent ID</span>
          <code className="text-xs">{agent.id}</code>
        </div>
        {showResponseFormat && (
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">响应格式</span>
            <span className="text-sm">{agent.response_format || "默认"}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-zinc-500">状态</span>
          <StatusBadge enabled={agent.status === "enabled"} />
        </div>
      </CardContent>
    </Card>
  );
}
