"use client";

import type { LucideIcon } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { Badge } from "@/components/ui/badge";
import type { MiddlewareInfo } from "@/types/effective-config";
import { getMiddlewarePipelineLabel } from "@/lib/config/labels";
import type { MiddlewarePipelineInfoExtended } from "@/lib/config/labels";

interface MiddlewarePopoverProps {
  middleware: MiddlewareInfo;
  children: React.ReactNode;
  disabled?: boolean;
}

export function MiddlewarePopover({
  middleware,
  children,
  disabled = false,
}: MiddlewarePopoverProps) {
  const info = getMiddlewarePipelineLabel(middleware.name) as MiddlewarePipelineInfoExtended;
  const hasParams = Object.keys(middleware.params).length > 0;

  const details = (
    <div className="space-y-3">
      {info.details && info.details.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-foreground">工作原理</div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {info.details.map((detail: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground/60">{i + 1}.</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {info.triggerCondition && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">触发条件:</span>
          <Badge variant="outline" className="text-xs">
            {info.triggerCondition}
          </Badge>
        </div>
      )}

      {hasParams && !disabled && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-foreground">当前配置</div>
          <div className="space-y-1 font-mono text-xs">
            {Object.entries(middleware.params).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}:</span>
                <span>{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {info.note && (
        <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-950">
          <span className="text-amber-600 dark:text-amber-400">⚠️</span>
          <span className="text-amber-700 dark:text-amber-300">{info.note}</span>
        </div>
      )}

      {disabled && middleware.reason && (
        <div className="flex gap-2 rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-900 dark:bg-red-950">
          <span className="text-red-600 dark:text-red-400">ℹ️</span>
          <span className="text-red-700 dark:text-red-300">禁用原因: {middleware.reason}</span>
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>执行顺序: #{middleware.order}</span>
      {info.relatedDocs && (
        <a
          href={info.relatedDocs}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          查看文档
        </a>
      )}
    </div>
  );

  return (
    <InfoPopover
      trigger={children}
      title={info.label}
      description={info.desc}
      icon={info.icon}
      status={disabled ? "disabled" : "enabled"}
      details={details}
      footer={footer}
      side="top"
      align="start"
    />
  );
}
