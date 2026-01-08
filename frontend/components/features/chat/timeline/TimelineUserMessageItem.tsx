"use client";

import { MessageContent } from "@/components/prompt-kit/message";
import { cn } from "@/lib/utils";
import type { UserMessageItem } from "@/hooks/use-timeline-reducer";
import { useChatThemeOptional } from "../themes";

interface TimelineUserMessageItemProps {
  item: UserMessageItem;
}

export function TimelineUserMessageItem({ item }: TimelineUserMessageItemProps) {
  const theme = useChatThemeOptional();
  const themeId = theme?.themeId || "default";
  
  return (
    <MessageContent 
      className={cn(
        "max-w-[85%] sm:max-w-[75%]",
        themeId === "default" && "rounded-3xl bg-zinc-100 px-5 py-2.5 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        themeId === "ethereal" && "chat-ethereal-user-msg",
        themeId === "industrial" && "chat-industrial-user-msg"
      )}
    >
      {item.content}
    </MessageContent>
  );
}
