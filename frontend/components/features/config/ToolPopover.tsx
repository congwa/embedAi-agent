"use client";

import { InfoPopover } from "@/components/ui/info-popover";
import { Badge } from "@/components/ui/badge";
import type { ToolInfo, FilteredToolInfo } from "@/types/effective-config";
import { getToolNameLabel, getToolCategoryLabel } from "@/lib/config/labels";

interface ToolPopoverProps {
  tool: ToolInfo | FilteredToolInfo;
  children: React.ReactNode;
  filtered?: boolean;
}

function isFilteredTool(tool: ToolInfo | FilteredToolInfo): tool is FilteredToolInfo {
  return "reason" in tool;
}

export function ToolPopover({
  tool,
  children,
  filtered = false,
}: ToolPopoverProps) {
  const info = getToolNameLabel(tool.name);
  const isFiltered = filtered || isFilteredTool(tool);
  const categories = !isFilteredTool(tool) ? tool.categories : [];

  const details = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">技术名称:</span>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {tool.name}
        </code>
      </div>

      {categories.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-foreground">所属分类</div>
          <div className="flex flex-wrap gap-1">
            {categories.map((cat: string, i: number) => {
              const catInfo = getToolCategoryLabel(cat);
              return (
                <Badge key={i} variant="secondary" className="text-xs">
                  {catInfo.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {!isFilteredTool(tool) && tool.description && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-foreground">功能说明</div>
          <p className="text-xs text-muted-foreground">{tool.description}</p>
        </div>
      )}

      {isFilteredTool(tool) && tool.reason && (
        <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-900 dark:bg-red-950">
          <span className="text-red-600 dark:text-red-400">ℹ️</span>
          <span className="text-red-700 dark:text-red-300">过滤原因: {tool.reason}</span>
        </div>
      )}
    </div>
  );

  return (
    <InfoPopover
      trigger={children}
      title={info.label}
      description={info.desc || "Agent 可调用的工具"}
      status={isFiltered ? "disabled" : "enabled"}
      statusLabel={isFiltered ? "已过滤" : "已启用"}
      details={details}
      side="top"
      align="start"
    />
  );
}
