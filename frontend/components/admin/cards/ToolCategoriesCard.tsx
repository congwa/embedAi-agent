"use client";

import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { getToolCategoryLabel } from "@/lib/config/labels";
import type { Agent } from "@/lib/api/agents";

export interface ToolCategoriesCardProps {
  agent: Agent;
  showDescription?: boolean;
  showInfoPopover?: boolean;
  showToolDesc?: boolean;
}

export function ToolCategoriesCard({ 
  agent, 
  showDescription = true, 
  showInfoPopover = false,
  showToolDesc = true 
}: ToolCategoriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">可用工具类别</CardTitle>
        </div>
        {showDescription && (
          <CardDescription>
            Agent 可以使用的工具功能范围
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {agent.tool_categories && agent.tool_categories.length > 0 ? (
          <div className="space-y-2">
            {agent.tool_categories.map((cat) => {
              const info = getToolCategoryLabel(cat);
              const IconComponent = info.icon;
              
              const content = (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{info.label}</span>
                    {showToolDesc && info.desc && <p className="text-xs text-zinc-400">{info.desc}</p>}
                  </div>
                </div>
              );

              if (showInfoPopover) {
                return (
                  <InfoPopover
                    key={cat}
                    trigger={content}
                    title={info.label}
                    description={info.desc}
                    icon={IconComponent}
                    details={
                      info.tools && info.tools.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-foreground mb-1">包含工具</div>
                          {info.tools.map((tool: { name: string; desc: string }) => (
                            <div key={tool.name} className="flex items-center gap-2 text-xs">
                              <code className="bg-muted px-1 py-0.5 rounded text-xs">{tool.name}</code>
                              <span className="text-muted-foreground">{tool.desc}</span>
                            </div>
                          ))}
                        </div>
                      ) : undefined
                    }
                  />
                );
              }

              return <div key={cat}>{content}</div>;
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">未限制工具类别，可使用所有工具</p>
        )}
      </CardContent>
    </Card>
  );
}
