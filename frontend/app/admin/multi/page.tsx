"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Network, Plus, ArrowRight, FileText, Route, PlayCircle, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgentStore, useModeStore } from "@/stores";
import { PageHeader } from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MultiAgentWorkspacePage() {
  const router = useRouter();
  const { agents, fetchAgents } = useAgentStore();
  const { mode } = useModeStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const enabledAgents = agents.filter(a => a.status === "enabled");
  const isPreviewMode = mode === "single"; // 当前是单 Agent 模式，多 Agent 为预设模式

  return (
    <div className="space-y-6">
      <PageHeader
        title="编排配置"
        description="管理多个 Agent 的协作与智能路由"
      />

      {/* 预设模式提示 */}
      {isPreviewMode && (
        <Alert className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30">
          <Network className="h-4 w-4 text-violet-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              当前系统运行在<strong className="mx-1">单 Agent 模式</strong>，此页面用于预配置多 Agent 编排。
              切换到 Supervisor 模式后，配置将生效。
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 border-violet-300 text-violet-700 hover:bg-violet-100"
              onClick={() => router.push("/admin/settings/mode")}
            >
              切换模式
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 编排可视化 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-violet-500" />
            编排架构
            {isPreviewMode && (
              <Badge variant="outline" className="ml-2 text-violet-600 border-violet-300">
                预设
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Supervisor 负责接收用户请求，根据路由策略分发给合适的子 Agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 py-8">
            {/* Supervisor 节点 */}
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <Network className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="mt-2 font-medium">Supervisor</span>
              <span className="text-xs text-zinc-500">智能路由</span>
            </div>

            {/* 连接线 */}
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* 子 Agent 节点 */}
            <div className="flex flex-wrap justify-center gap-4">
              {enabledAgents.map((agent) => (
                <Link key={agent.id} href={`/admin/multi/agents/${agent.id}`}>
                  <Card className="w-40 cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col items-center p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="mt-2 text-sm font-medium truncate w-full text-center">
                        {agent.name}
                      </span>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {agent.type}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* 添加子 Agent */}
              <Link href="/admin/multi/agents">
                <Card className="w-40 cursor-pointer border-dashed transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-center justify-center p-4 h-full min-h-[120px]">
                    <Plus className="h-8 w-8 text-zinc-400" />
                    <span className="mt-2 text-sm text-zinc-500">添加子 Agent</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置入口 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/admin/multi/routing">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Route className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">路由策略</div>
                <div className="text-sm text-zinc-500">配置请求分发规则</div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/prompts">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">提示词管理</div>
                <div className="text-sm text-zinc-500">定义 Supervisor 调度行为</div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/">
          <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">测试对话</div>
                <div className="text-sm text-zinc-500">验证路由效果</div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 子 Agent 列表 */}
      <Card>
        <CardHeader>
          <CardTitle>子 Agent 列表</CardTitle>
          <CardDescription>点击编辑子 Agent 的详细配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enabledAgents.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p>暂无启用的子 Agent</p>
                <Button className="mt-4" onClick={() => router.push("/admin/multi/agents")}>
                  添加 Agent
                </Button>
              </div>
            ) : (
              enabledAgents.map((agent) => (
                <Link key={agent.id} href={`/admin/multi/agents/${agent.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-zinc-500">
                          {agent.description || `${agent.type} 类型 Agent`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{agent.type}</Badge>
                      {agent.is_default && (
                        <Badge variant="outline" className="text-violet-600 border-violet-300">
                          默认
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
