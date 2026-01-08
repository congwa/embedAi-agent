"use client";

import { MessageContent } from "@/components/prompt-kit/message";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/hooks/use-timeline-reducer";
import { useChatThemeOptional } from "../themes";

interface TimelineContentItemProps {
  item: ContentItem;
}

export function TimelineContentItem({ item }: TimelineContentItemProps) {
  const theme = useChatThemeOptional();
  const themeId = theme?.themeId || "default";
  
  if (!item.text) return null;

  return (
    <MessageContent
      className={cn(
        "prose flex-1 rounded-lg bg-transparent p-0",
        themeId === "default" && "text-zinc-900 dark:text-zinc-100",
        themeId === "ethereal" && "chat-ethereal-ai-msg text-[var(--chat-text-ai)]",
        themeId === "industrial" && "chat-industrial-ai-msg text-[var(--chat-text-ai)] font-mono"
      )}
      markdown
    >
      {item.text}
    </MessageContent>
  );
}
