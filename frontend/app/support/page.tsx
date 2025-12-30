"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Headphones,
  MessageSquare,
  RefreshCw,
  Circle,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getSupportConversations,
  type SupportConversation,
} from "@/lib/api/support";

export default function SupportListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSupportConversations(filter || undefined);
      setConversations(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 定时刷新
  useEffect(() => {
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const getStateLabel = (state: string) => {
    switch (state) {
      case "human":
        return { label: "人工服务中", color: "bg-green-500" };
      case "pending":
        return { label: "等待接入", color: "bg-yellow-500" };
      default:
        return { label: "AI 模式", color: "bg-zinc-400" };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              客服工作台
            </h1>
            <p className="text-xs text-zinc-500">
              {conversations.length} 个会话
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 筛选按钮 */}
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                filter === null
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("human")}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                filter === "human"
                  ? "bg-green-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              人工
            </button>
            <button
              onClick={() => setFilter("ai")}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                filter === "ai"
                  ? "bg-orange-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              AI
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={loadConversations}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="p-6">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent mx-auto" />
              <p className="text-sm text-zinc-500">加载中...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="h-12 w-12 text-zinc-300 mb-4" />
            <p className="text-zinc-500">暂无会话</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conv) => {
              const state = getStateLabel(conv.handoff_state);
              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/support/${conv.id}`)}
                  className={cn(
                    "cursor-pointer rounded-xl border bg-white p-4 transition-all",
                    "hover:shadow-md hover:border-green-500",
                    "dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-green-500"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                        <User className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {conv.title || "新会话"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {conv.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white",
                        state.color
                      )}
                    >
                      <Circle className="h-2 w-2 fill-current" />
                      {state.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      {conv.handoff_state === "human" ? (
                        <Headphones className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                      {conv.handoff_operator || "AI"}
                    </div>
                    <div>
                      {new Date(conv.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
