"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, ListTodo, FileText, Power, Settings } from "lucide-react";
import { PageHeader } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";

interface CrawlerConfig {
  enabled: boolean;
}

const crawlerModules = [
  {
    title: "站点配置",
    description: "管理爬取站点配置，包括起始 URL、爬取规则等",
    href: "/admin/crawler/sites",
    icon: Globe,
  },
  {
    title: "任务列表",
    description: "查看爬取任务执行历史和统计信息",
    href: "/admin/crawler/tasks",
    icon: ListTodo,
  },
  {
    title: "页面数据",
    description: "浏览爬取的原始页面数据和解析状态",
    href: "/admin/crawler/pages",
    icon: FileText,
  },
];

export default function CrawlerPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CrawlerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<CrawlerConfig>("/api/v1/crawler/config");
      setConfig(data);
    } catch {
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleEnable = async () => {
    try {
      setIsEnabling(true);
      const data = await apiRequest<CrawlerConfig>("/api/v1/crawler/config/enable", {
        method: "PUT",
      });
      setConfig(data);
    } catch {
      // 启用失败
    } finally {
      setIsEnabling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  // 未启用状态
  if (config && !config.enabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="爬虫管理"
          description="管理站点配置、查看任务和页面数据"
        />

        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Power className="h-8 w-8 text-zinc-400" />
            </div>
            <CardTitle className="text-xl">爬虫模块未启用</CardTitle>
            <CardDescription className="mx-auto max-w-md">
              启用爬虫模块后，您可以配置站点、执行爬取任务，并将网站数据自动导入到商品库中。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3 pb-8">
            <Button onClick={handleEnable} disabled={isEnabling}>
              {isEnabling ? "启用中..." : "立即启用"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/settings/crawler")}>
              <Settings className="mr-2 h-4 w-4" />
              查看设置
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="爬虫管理"
        description="管理站点配置、查看任务和页面数据"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {crawlerModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full transition-all hover:border-zinc-400 hover:shadow-md dark:hover:border-zinc-600">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <module.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
