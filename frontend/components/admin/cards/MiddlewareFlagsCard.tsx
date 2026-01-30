"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin";
import { InfoPopover } from "@/components/ui/info-popover";
import { getMiddlewareLabel, MIDDLEWARE_FLAG_KEYS, type MiddlewareFlagKey } from "@/lib/config/labels";
import type { Agent } from "@/lib/api/agents";

export interface MiddlewareFlagsCardProps {
  agent: Agent;
  showInfoPopover?: boolean;
}

export function MiddlewareFlagsCard({ agent, showInfoPopover = false }: MiddlewareFlagsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">中间件开关</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/agents/${agent.id}/middleware`}>
            <Settings2 className="mr-1 h-4 w-4" />
            配置
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {MIDDLEWARE_FLAG_KEYS.map((key) => {
          const info = getMiddlewareLabel(key);
          const value = agent.middleware_flags?.[key as MiddlewareFlagKey];
          // 只显示布尔值开关，跳过其他配置字段
          if (typeof value !== "boolean" && value !== undefined && value !== null) {
            return null;
          }
          return (
            <div key={key} className="flex justify-between">
              {showInfoPopover ? (
                <InfoPopover
                  trigger={
                    <span className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                      {info.label}
                    </span>
                  }
                  title={info.label}
                  description={info.desc}
                  icon={info.icon}
                  status={value ? "enabled" : "disabled"}
                />
              ) : (
                <span className="text-sm text-zinc-500">{info.label}</span>
              )}
              <StatusBadge enabled={!!value} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
