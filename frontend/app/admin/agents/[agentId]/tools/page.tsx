"use client";

import { useParams } from "next/navigation";
import { Wrench, Settings2 } from "lucide-react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentToolsPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent } = useAgentDetail({ agentId });

  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* 工具类别 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" />
            允许的工具类别
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agent.tool_categories && agent.tool_categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {agent.tool_categories.map((category) => (
                <Badge key={category} variant="secondary" className="px-3 py-1">
                  {category}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">未配置工具类别，将使用默认工具集</p>
          )}
        </CardContent>
      </Card>

      {/* 工具策略 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            工具策略配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agent.tool_policy ? (
            <div className="space-y-4">
              <pre className="rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                {JSON.stringify(agent.tool_policy, null, 2)}
              </pre>
              <div className="grid gap-4 md:grid-cols-3">
                {"min_tool_calls" in agent.tool_policy && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-zinc-500">最小工具调用</p>
                    <p className="text-lg font-bold">{String(agent.tool_policy.min_tool_calls)}</p>
                  </div>
                )}
                {"allow_direct_answer" in agent.tool_policy && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-zinc-500">允许直接回答</p>
                    <p className="text-lg font-bold">
                      {agent.tool_policy.allow_direct_answer ? "是" : "否"}
                    </p>
                  </div>
                )}
                {typeof agent.tool_policy.fallback_tool === "string" && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-zinc-500">兜底工具</p>
                    <p className="text-lg font-bold">{agent.tool_policy.fallback_tool}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">使用默认工具策略</p>
          )}
        </CardContent>
      </Card>

      {/* 工具调用统计（占位） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">工具调用统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900">
            <p className="text-sm text-zinc-400">统计数据开发中...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
