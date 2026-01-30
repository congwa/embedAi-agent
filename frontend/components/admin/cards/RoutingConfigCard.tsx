"use client";

import Link from "next/link";
import { Route, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/lib/api/agents";

export interface RoutingConfigCardProps {
  agent: Agent;
  basePath: string;
}

export function RoutingConfigCard({ agent, basePath }: RoutingConfigCardProps) {
  return (
    <Card className="border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-base">路由配置</CardTitle>
          </div>
          <Link href={`${basePath}/${agent.id}/routing`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-violet-600">
              配置
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription>
          配置 Supervisor 如何将请求路由到此 Agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-zinc-500">路由关键词</span>
          <span className="text-sm text-zinc-400">点击配置查看</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-zinc-500">优先级</span>
          <Badge variant="outline">默认</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
