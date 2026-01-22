"use client";

import { Headphones, MessageCircle, UserCheck, UserMinus } from "lucide-react";
import { MessageContent } from "@/components/prompt-kit/message";
import type { SupportEventItem } from "@/hooks/use-timeline-reducer";
import { cn } from "@/lib/utils";

interface TimelineSupportEventItemProps {
  item: SupportEventItem;
}

export function TimelineSupportEventItem({ item }: TimelineSupportEventItemProps) {
  // 客服消息 - 显示为聊天气泡
  if (item.eventType === "human_message" && item.content) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          <Headphones className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              人工客服
            </span>
            {item.operator && (
              <span className="text-xs text-zinc-400">
                {item.operator}
              </span>
            )}
          </div>
          <MessageContent
            markdown
            className="max-w-[85%] rounded-2xl rounded-tl-sm bg-blue-50 px-4 py-2.5 text-zinc-900 dark:bg-blue-900/30 dark:text-zinc-100 sm:max-w-[75%]"
          >
            {item.content}
          </MessageContent>
        </div>
      </div>
    );
  }

  // 人工模式提示
  if (item.eventType === "human_mode") {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <MessageCircle className="h-4 w-4" />
          <span>{item.message || "您的消息已发送给客服，请等待回复"}</span>
        </div>
      </div>
    );
  }

  // 客服介入开始
  if (item.eventType === "handoff_started") {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <UserCheck className="h-4 w-4" />
          <span>{item.message || "人工客服已接入"}</span>
        </div>
      </div>
    );
  }

  // 客服介入结束
  if (item.eventType === "handoff_ended") {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <UserMinus className="h-4 w-4" />
          <span>{item.message || "人工客服已结束服务"}</span>
        </div>
      </div>
    );
  }

  // 连接事件不渲染
  if (item.eventType === "connected") {
    return null;
  }

  return null;
}
