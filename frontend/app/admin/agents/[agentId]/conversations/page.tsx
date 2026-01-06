"use client";

import { useParams } from "next/navigation";
import { MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentConversationsPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  return (
    <div className="space-y-6">
      {/* 会话统计 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">总会话数</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <MessageSquare className="h-8 w-8 text-zinc-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">今日会话</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Token 用量</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近会话（占位） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            最近会话
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900">
            <p className="text-sm text-zinc-400">
              会话洞察功能开发中...
              <br />
              <span className="text-xs">将展示该 Agent 的最近会话记录和消息统计</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
