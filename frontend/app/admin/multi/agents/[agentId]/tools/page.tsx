"use client";

import { useParams } from "next/navigation";
import { Wrench, Settings2, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getToolCategoryLabel } from "@/lib/config/labels";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function MultiAgentToolsPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent } = useAgentDetail({ agentId });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  if (!agent) return null;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* 工具类别 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-zinc-500" />
            <CardTitle className="text-base">可用功能</CardTitle>
          </div>
          <CardDescription>
            子 Agent 可以使用的工具能力
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agent.tool_categories && agent.tool_categories.length > 0 ? (
            <div className="space-y-2">
              {agent.tool_categories.map((category) => {
                const info = getToolCategoryLabel(category);
                const IconComponent = info.icon;
                const isExpanded = expandedCategories.has(category);
                return (
                  <div
                    key={category}
                    className="rounded-lg border bg-zinc-50/50 dark:bg-zinc-800/30"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium">{info.label}</span>
                          <p className="text-xs text-zinc-500">{info.desc}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-zinc-400 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && info.tools && info.tools.length > 0 && (
                      <div className="border-t px-3 py-2 space-y-1">
                        {info.tools.map((tool) => (
                          <div
                            key={tool.name}
                            className="flex items-center gap-2 py-1 pl-11 text-sm"
                          >
                            <span className="text-zinc-400">•</span>
                            <code className="text-xs bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                              {tool.name}
                            </code>
                            <span className="text-zinc-500">{tool.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">未限制工具类别，可使用所有工具</p>
          )}
        </CardContent>
      </Card>

      {/* 工具策略 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-zinc-500" />
            <CardTitle className="text-base">调用策略</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {agent.tool_policy ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {agent.tool_policy.allow_direct_answer ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-zinc-300" />
                  )}
                  <div>
                    <p className="font-medium">允许直接回答</p>
                    <p className="text-xs text-zinc-500">
                      {agent.tool_policy.allow_direct_answer
                        ? "可以不调用工具直接回复"
                        : "必须调用工具后才能回答"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={agent.tool_policy.allow_direct_answer ? "default" : "secondary"}
                  className={
                    agent.tool_policy.allow_direct_answer
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : ""
                  }
                >
                  {agent.tool_policy.allow_direct_answer ? "开启" : "关闭"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">最少调用次数</p>
                  <p className="text-xs text-zinc-500">
                    {agent.tool_policy.min_tool_calls === 0
                      ? "不限制"
                      : `至少 ${agent.tool_policy.min_tool_calls} 次`}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3">
                  {agent.tool_policy.min_tool_calls === 0
                    ? "不限"
                    : String(agent.tool_policy.min_tool_calls)}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">使用默认工具策略</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
