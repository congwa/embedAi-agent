"use client";

import { cn } from "@/lib/utils";
import type { UserMessageItem } from "@/hooks/use-timeline-reducer";
import { useChatThemeOptional } from "@/components/features/chat/themes";
import { ImageGallery } from "@/components/features/chat/timeline/ImageGallery";
import { Markdown } from "@/components/prompt-kit/markdown";

interface TimelineUserMessageItemProps {
  item: UserMessageItem;
}

export function TimelineUserMessageItem({ item }: TimelineUserMessageItemProps) {
  const theme = useChatThemeOptional();
  const themeId = theme?.themeId || "default";
  
  const hasImages = item.images && item.images.length > 0;
  const hasContent = item.content && item.content.trim().length > 0;
  const isWithdrawn = item.isWithdrawn;
  const isEdited = item.isEdited;

  // 已撤回消息的显示
  if (isWithdrawn) {
    return (
      <div 
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-lg p-2 break-words whitespace-normal",
          "rounded-3xl bg-zinc-200 dark:bg-zinc-700 px-5 py-2.5 text-zinc-500 dark:text-zinc-400 italic"
        )}
      >
        <span>[此消息已被客服撤回]</span>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "max-w-[85%] sm:max-w-[75%] rounded-lg p-2 text-foreground prose prose-sm break-words whitespace-normal",
        themeId === "default" && "rounded-3xl bg-zinc-100 px-5 py-2.5 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        themeId === "ethereal" && "chat-ethereal-user-msg",
        themeId === "industrial" && "chat-industrial-user-msg"
      )}
    >
      {hasImages && <ImageGallery images={item.images!} className="mb-2" />}
      {hasContent && (
        <div className="user-message-content">
          <Markdown>{item.content}</Markdown>
          {isEdited && (
            <span className="ml-1 text-xs opacity-60">(已编辑)</span>
          )}
        </div>
      )}
    </div>
  );
}
