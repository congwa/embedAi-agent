"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LLMCallClusterItem,
  LLMCallSubItem,
} from "@/hooks/use-timeline-reducer";
import { TimelineReasoningItem } from "./TimelineReasoningItem";
import { TimelineContentItem } from "./TimelineContentItem";
import { TimelineProductsItem } from "./TimelineProductsItem";
import { TimelineTodosItem } from "./TimelineTodosItem";
import { TimelineContextSummarizedItem } from "./TimelineContextSummarizedItem";
import { useChatThemeOptional } from "../themes";

interface LLMCallClusterProps {
  item: LLMCallClusterItem;
  isStreaming?: boolean;
}

function renderNonProductSubItem(subItem: LLMCallSubItem, isStreaming: boolean) {
  switch (subItem.type) {
    case "reasoning":
      return (
        <TimelineReasoningItem
          key={subItem.id}
          item={{
            type: "assistant.reasoning",
            id: subItem.id,
            turnId: "",
            text: subItem.text,
            isOpen: subItem.isOpen,
            ts: subItem.ts,
          }}
          isStreaming={isStreaming}
        />
      );
    case "content":
      return (
        <TimelineContentItem
          key={subItem.id}
          item={{
            type: "assistant.content",
            id: subItem.id,
            turnId: "",
            text: subItem.text,
            ts: subItem.ts,
          }}
        />
      );
    case "todos":
      return (
        <TimelineTodosItem
          key={subItem.id}
          item={{
            type: "assistant.todos",
            id: subItem.id,
            turnId: "",
            todos: subItem.todos,
            ts: subItem.ts,
          }}
        />
      );
    case "context_summarized":
      return (
        <TimelineContextSummarizedItem
          key={subItem.id}
          item={{
            type: "context.summarized",
            id: subItem.id,
            turnId: "",
            messagesBefore: subItem.messagesBefore,
            messagesAfter: subItem.messagesAfter,
            tokensBefore: subItem.tokensBefore,
            tokensAfter: subItem.tokensAfter,
            ts: subItem.ts,
          }}
        />
      );
    default:
      return null;
  }
}

export function LLMCallCluster({ item, isStreaming = false }: LLMCallClusterProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  
  const theme = useChatThemeOptional();
  const themeId = theme?.themeId || "default";

  // 分离子项：内容、商品、推理、其他
  const contentItems = item.children.filter((c) => c.type === "content");
  const productItems = item.children.filter((c) => c.type === "products");
  const reasoningItems = item.children.filter((c) => c.type === "reasoning");
  const otherItems = item.children.filter(
    (c) => c.type !== "content" && c.type !== "products" && c.type !== "reasoning"
  );

  const hasReasoning = reasoningItems.length > 0;
  const isRunning = item.status === "running";

  return (
    <div className="flex flex-col gap-3">
      {/* 1. 推理过程 - 在回复上方展示（先思考后回复） */}
      {hasReasoning && (
        <div className={cn(
          "rounded-lg overflow-hidden",
          themeId === "default" && "border border-zinc-200 dark:border-zinc-700",
          themeId === "ethereal" && "border border-[var(--chat-border-color)]",
          themeId === "industrial" && "border border-[var(--chat-border-color)]"
        )}>
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
              themeId === "default" && "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
              themeId === "ethereal" && "bg-[var(--chat-surface-secondary)] hover:opacity-80 text-[var(--chat-text-secondary)]",
              themeId === "industrial" && "bg-[var(--chat-surface-secondary)] hover:opacity-80 text-[var(--chat-text-secondary)]"
            )}
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
          >
            <Brain className="h-4 w-4 opacity-60" />
            {isRunning && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>AI 思考过程</span>
            {item.elapsedMs !== undefined && item.status !== "running" && (
              <span className="text-xs opacity-50">· {item.elapsedMs}ms</span>
            )}
            <div className="ml-auto">
              {isReasoningExpanded ? (
                <ChevronDown className="h-4 w-4 opacity-50" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-50" />
              )}
            </div>
          </button>
          
          {isReasoningExpanded && (
            <div className={cn(
              "p-3 space-y-3",
              themeId === "default" && "bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700",
              themeId === "ethereal" && "bg-[var(--chat-surface-primary)] border-t border-[var(--chat-border-color)]",
              themeId === "industrial" && "bg-[var(--chat-surface-primary)] border-t border-[var(--chat-border-color)]"
            )}>
              {reasoningItems.map((child) => renderNonProductSubItem(child, isStreaming))}
            </div>
          )}
        </div>
      )}

      {/* 2. AI 回复内容 - 直接展示 */}
      {contentItems.map((child) => renderNonProductSubItem(child, isStreaming))}

      {/* 3. 商品推荐 - 直接展示，突出显示 */}
      {productItems.length > 0 && (
        <div className={cn(
          "rounded-xl p-4",
          themeId === "default" && "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-100 dark:border-orange-800/30",
          themeId === "ethereal" && "bg-[var(--chat-surface-secondary)] border border-[var(--chat-border-color)]",
          themeId === "industrial" && "bg-[var(--chat-surface-secondary)] border border-[var(--chat-border-color)]"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🛒</span>
            <span className={cn(
              "text-sm font-medium",
              themeId === "default" && "text-orange-700 dark:text-orange-300",
              themeId === "ethereal" && "text-[var(--chat-text-primary)]",
              themeId === "industrial" && "text-[var(--chat-text-primary)] uppercase tracking-wider text-xs"
            )}>
              推荐商品
            </span>
          </div>
          {productItems.map((child) => (
            <TimelineProductsItem
              key={child.id}
              item={{
                type: "assistant.products",
                id: child.id,
                turnId: "",
                products: child.type === "products" ? child.products : [],
                ts: child.ts,
              }}
            />
          ))}
        </div>
      )}

      {/* 4. 其他项（todos、context_summarized 等） */}
      {otherItems.map((child) => renderNonProductSubItem(child, isStreaming))}
    </div>
  );
}
