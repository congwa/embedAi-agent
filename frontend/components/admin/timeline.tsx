"use client";

import { CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type TimelineStatus = "success" | "error" | "pending" | "default";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  status?: TimelineStatus;
  link?: string;
  user?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusIcons: Record<TimelineStatus, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  default: <div className="h-2 w-2 rounded-full bg-zinc-400" />,
};

const statusColors: Record<TimelineStatus, string> = {
  success: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  pending: "border-amber-200 bg-amber-50",
  default: "border-zinc-200 bg-zinc-50",
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => {
        const status = item.status || "default";
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* 连接线 */}
            {!isLast && (
              <div className="absolute left-[11px] top-8 h-[calc(100%-8px)] w-px bg-zinc-200 dark:bg-zinc-700" />
            )}

            {/* 状态图标 */}
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border bg-white dark:bg-zinc-900">
              {statusIcons[status]}
            </div>

            {/* 内容 */}
            <div
              className={cn(
                "flex-1 rounded-lg border p-3 dark:border-zinc-800 dark:bg-zinc-900",
                statusColors[status]
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {item.user && <span>{item.user}</span>}
                  <span>{item.time}</span>
                  {item.link && (
                    <Link
                      href={item.link}
                      className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                      详情
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
