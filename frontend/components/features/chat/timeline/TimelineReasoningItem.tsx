"use client";

import { Markdown } from "@/components/prompt-kit/markdown";
import { cn } from "@/lib/utils";
import type { ReasoningItem } from "@/hooks/use-timeline-reducer";

interface TimelineReasoningItemProps {
  item: ReasoningItem;
  isStreaming?: boolean;
}

export function TimelineReasoningItem({
  item,
}: TimelineReasoningItemProps) {
  // 直接展示推理内容，不再套折叠（外层 AI 思考过程已经是折叠块了）
  if (!item.text) return null;

  return (
    <div className={cn(
      "prose dark:prose-invert prose-sm max-w-none",
      "text-zinc-600 dark:text-zinc-400"
    )}>
      <Markdown>{item.text}</Markdown>
    </div>
  );
}
