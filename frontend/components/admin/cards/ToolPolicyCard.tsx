"use client";

import { CheckCircle, XCircle, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/api/agents";

export interface ToolPolicyCardProps {
  agent: Agent;
  showDescription?: boolean;
  showFullDetails?: boolean;
}

export function ToolPolicyCard({ agent, showDescription = true, showFullDetails = true }: ToolPolicyCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">工具调用策略</CardTitle>
        </div>
        {showDescription && (
          <CardDescription>
            控制 Agent 如何使用工具回答问题
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {agent.tool_policy ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {agent.tool_policy.allow_direct_answer ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-300" />
                )}
                <span className="text-sm">允许直接回答</span>
              </div>
              <Badge variant={agent.tool_policy.allow_direct_answer ? "default" : "secondary"}
                     className={agent.tool_policy.allow_direct_answer ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}>
                {agent.tool_policy.allow_direct_answer ? "是" : "否"}
              </Badge>
            </div>
            {showFullDetails && (
              <>
                <p className="text-xs text-zinc-400 ml-6">
                  {agent.tool_policy.allow_direct_answer
                    ? "Agent 可以不调用工具直接回答简单问题"
                    : "Agent 必须调用工具后才能回答"}
                </p>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm">最少工具调用次数</span>
                  <Badge variant="outline">
                    {agent.tool_policy.min_tool_calls === 0
                      ? "不限制"
                      : `至少 ${agent.tool_policy.min_tool_calls} 次`}
                  </Badge>
                </div>
                {agent.tool_policy.fallback_tool && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">备选工具</span>
                    <Badge variant="secondary">{String(agent.tool_policy.fallback_tool)}</Badge>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-400">使用默认策略</p>
        )}
      </CardContent>
    </Card>
  );
}
