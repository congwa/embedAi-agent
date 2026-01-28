"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Settings,
  Power,
  PowerOff,
  RefreshCw,
  Clock,
  Database,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { PageHeader, ErrorState } from "@/components/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/api/client";

interface CrawlerConfig {
  enabled: boolean;
  model: string | null;
  provider: string | null;
  max_depth: number;
  max_pages: number;
  default_delay: number;
  headless: boolean;
  run_on_start: boolean;
}

interface CrawlStats {
  total_sites: number;
  active_sites: number;
  total_tasks: number;
  running_tasks: number;
  total_pages: number;
  total_products: number;
}

export default function CrawlerSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CrawlerConfig | null>(null);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 获取爬虫配置
      const configData = await apiRequest<CrawlerConfig>("/api/v1/crawler/config");
      setConfig(configData);
      
      // 如果已启用，获取统计信息
      if (configData.enabled) {
        try {
          const statsData = await apiRequest<CrawlStats>("/api/v1/crawler/stats");
          setStats(statsData);
        } catch {
          // 统计获取失败不影响页面
          setStats(null);
        }
      } else {
        setStats(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = (enabled: boolean) => {
    setPendingAction(enabled ? "enable" : "disable");
    setShowConfirmDialog(true);
  };

  const confirmToggle = async () => {
    if (!pendingAction) return;
    
    try {
      setIsToggling(true);
      const endpoint = pendingAction === "enable" 
        ? "/api/v1/crawler/config/enable" 
        : "/api/v1/crawler/config/disable";
      
      const newConfig = await apiRequest<CrawlerConfig>(endpoint, {
        method: "PUT",
      });
      setConfig(newConfig);
      
      // 如果启用了，重新获取统计
      if (newConfig.enabled) {
        try {
          const statsData = await apiRequest<CrawlStats>("/api/v1/crawler/stats");
          setStats(statsData);
        } catch {
          setStats(null);
        }
      } else {
        setStats(null);
      }
    } catch (e) {
      setError(e);
    } finally {
      setIsToggling(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="爬虫设置"
        description="管理爬虫模块的启用状态和配置"
        actions={
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* 启用状态卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                config?.enabled 
                  ? "bg-emerald-100 dark:bg-emerald-900/30" 
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}>
                {config?.enabled ? (
                  <Power className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <PowerOff className="h-5 w-5 text-zinc-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">爬虫模块</CardTitle>
                <CardDescription>
                  {config?.enabled 
                    ? "爬虫模块已启用，可以配置站点并执行爬取任务" 
                    : "爬虫模块已禁用，启用后可以爬取网站数据"
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={config?.enabled ? "default" : "secondary"}>
                {config?.enabled ? "已启用" : "已禁用"}
              </Badge>
              <Switch
                checked={config?.enabled ?? false}
                onCheckedChange={handleToggle}
                disabled={isToggling}
              />
            </div>
          </div>
        </CardHeader>
        
        {config?.enabled && stats && (
          <CardContent>
            <Separator className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium">{stats.total_sites} 个站点</div>
                  <div className="text-xs text-zinc-500">{stats.active_sites} 个活跃</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium">{stats.total_tasks} 个任务</div>
                  <div className="text-xs text-zinc-500">{stats.running_tasks} 个运行中</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bug className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium">{stats.total_pages} 个页面</div>
                  <div className="text-xs text-zinc-500">已爬取</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 配置信息卡片 */}
      {config && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-lg">配置信息</CardTitle>
                <CardDescription>当前爬虫模块的配置参数</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-zinc-500">AI 模型</div>
                <div className="font-medium">{config.model || "默认模型"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-500">提供商</div>
                <div className="font-medium">{config.provider || "默认提供商"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-500">默认最大深度</div>
                <div className="font-medium">{config.max_depth} 层</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-500">默认最大页面数</div>
                <div className="font-medium">{config.max_pages} 页</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-500">请求间隔</div>
                <div className="font-medium">{config.default_delay} 秒</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-500">无头模式</div>
                <div className="font-medium">{config.headless ? "是" : "否"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快捷操作 */}
      {config?.enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Clock className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-lg">快捷操作</CardTitle>
                <CardDescription>常用的爬虫管理功能</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push("/admin/crawler/sites")}>
                站点配置
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/crawler/tasks")}>
                任务列表
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/crawler/pages")}>
                页面数据
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingAction === "enable" ? (
                <>
                  <Power className="h-5 w-5 text-emerald-600" />
                  启用爬虫模块
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  禁用爬虫模块
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "enable" ? (
                <>
                  启用后，您可以：
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>配置爬取站点</li>
                    <li>执行爬取任务</li>
                    <li>查看爬取的页面和商品数据</li>
                  </ul>
                </>
              ) : (
                <>
                  禁用后：
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>所有定时爬取任务将停止</li>
                    <li>已爬取的数据将保留</li>
                    <li>爬虫管理页面将无法访问</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              disabled={isToggling}
              className={pendingAction === "disable" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {isToggling ? "处理中..." : "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
