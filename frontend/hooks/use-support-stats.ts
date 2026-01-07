"use client";

/**
 * 客服统计 Hook
 * 
 * 提供客服统计数据（红点提醒用），支持自动轮询刷新。
 */

import { useCallback, useEffect, useState } from "react";
import { getSupportStats, type SupportStats } from "@/lib/api/support";

const DEFAULT_STATS: SupportStats = {
  pending_count: 0,
  human_count: 0,
  total_unread: 0,
  high_heat_count: 0,
};

interface UseSupportStatsOptions {
  /** 自动刷新间隔（毫秒），设为 0 禁用 */
  refreshInterval?: number;
  /** 是否启用 */
  enabled?: boolean;
}

export function useSupportStats(options: UseSupportStatsOptions = {}) {
  const { refreshInterval = 30000, enabled = true } = options;
  
  const [stats, setStats] = useState<SupportStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setError(null);
      const data = await getSupportStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取统计失败");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // 初始加载
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 自动刷新
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;
    
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, refresh]);

  // 计算是否需要显示红点
  const hasNotification = stats.pending_count > 0 || stats.total_unread > 0;
  const notificationCount = stats.pending_count + stats.high_heat_count;

  return {
    stats,
    isLoading,
    error,
    refresh,
    hasNotification,
    notificationCount,
  };
}
