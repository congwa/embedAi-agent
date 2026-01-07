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
  Flame,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getSupportConversations,
  getSupportStats,
  type SupportConversation,
  type SupportStats,
} from "@/lib/api/support";

// 热度颜色配置
function getHeatColor(score: number) {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-green-500";
}

// 热度条组件
function HeatBar({ score }: { score: number }) {
  const width = Math.min(100, score);
  const color = getHeatColor(score);
  
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">{score}</span>
    </div>
  );
}

// 未读红点组件
function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function SupportListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"heat" | "time">("heat");

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [convData, statsData] = await Promise.all([
        getSupportConversations(filter || undefined, sortBy),
        getSupportStats(),
      ]);
      setConversations(convData.items);
      setStats(statsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [filter, sortBy]);

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
        return { label: "等待接入", color: "bg-yellow-500", pulse: true };
      default:
        return { label: "AI 模式", color: "bg-zinc-400" };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <Headphones className="h-5 w-5 text-white" />
            {/* 红点提醒 */}
            {stats && stats.pending_count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {stats.pending_count > 99 ? "99+" : stats.pending_count}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              客服工作台
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>{conversations.length} 个会话</span>
              {stats && stats.total_unread > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                  {stats.total_unread} 未读
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 排序切换 */}
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-1">
            <button
              onClick={() => setSortBy("heat")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors",
                sortBy === "heat"
                  ? "bg-orange-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <Flame className="h-3 w-3" />
              热度
            </button>
            <button
              onClick={() => setSortBy("time")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors",
                sortBy === "time"
                  ? "bg-blue-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <Clock className="h-3 w-3" />
              时间
            </button>
          </div>

          {/* 状态筛选 */}
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
              onClick={() => setFilter("pending")}
              className={cn(
                "relative px-3 py-1 text-xs rounded-md transition-colors",
                filter === "pending"
                  ? "bg-yellow-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              等待
              {stats && stats.pending_count > 0 && filter !== "pending" && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
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
                  ? "bg-zinc-500 text-white"
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
              const isHighHeat = conv.heat_score >= 60;
              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/support/${conv.id}`)}
                  className={cn(
                    "relative cursor-pointer rounded-xl border bg-white p-4 transition-all",
                    "hover:shadow-md hover:border-green-500",
                    "dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-green-500",
                    isHighHeat && "border-orange-300 dark:border-orange-700",
                    conv.handoff_state === "pending" && "border-yellow-300 dark:border-yellow-700"
                  )}
                >
                  {/* 未读红点 */}
                  {conv.unread_count > 0 && (
                    <div className="absolute -right-2 -top-2">
                      <UnreadBadge count={conv.unread_count} />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                        <User className="h-5 w-5 text-zinc-500" />
                        {/* 用户在线状态 */}
                        {conv.user_online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-800" />
                        )}
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
                        state.color,
                        state.pulse && "animate-pulse"
                      )}
                    >
                      <Circle className="h-2 w-2 fill-current" />
                      {state.label}
                    </div>
                  </div>

                  {/* 热度条 */}
                  <div className="mb-3">
                    <HeatBar score={conv.heat_score} />
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
