"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin";
import { InfoPopover } from "@/components/ui/info-popover";
import { getMiddlewareLabel } from "@/lib/config/labels";
import type { Agent } from "@/lib/api/agents";

export interface MiddlewareFlagsCardProps {
  agent: Agent;
  showInfoPopover?: boolean;
}

export function MiddlewareFlagsCard({ agent, showInfoPopover = false }: MiddlewareFlagsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">中间件开关</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agent.middleware_flags ? (
          Object.entries(agent.middleware_flags).map(([key, value]) => {
            const info = getMiddlewareLabel(key);
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
          })
        ) : (
          <p className="text-sm text-zinc-400">使用全局默认配置</p>
        )}
      </CardContent>
    </Card>
  );
}
