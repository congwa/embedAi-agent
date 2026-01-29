"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Bot,
  Zap,
  Network,
  AlertTriangle,
  MessageSquare,
  Check,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useModeStore } from "@/stores";
import { useSupportStats } from "@/hooks/use-support-stats";
import { 
  multiModeMainNav, 
  systemNavItems,
  multiModeFooterNav,
  type NavItem 
} from "@/lib/config/navigation";

function NavItemComponent({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href ||
      pathname.startsWith(item.href + "/") ||
      (item.children && item.children.some((child) => pathname === child.href));

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
          item.highlight && !isActive && item.highlightColor === "emerald" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30",
          item.highlight && !isActive && item.highlightColor === "violet" && "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30"
        )}
      >
        <item.icon className={cn(
          "h-4 w-4",
          item.highlight && item.highlightColor === "emerald" && "text-emerald-500",
          item.highlight && item.highlightColor === "violet" && "text-violet-500"
        )} />
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <Badge variant={item.badgeVariant || "secondary"} className="text-[10px]">
            {item.badge}
          </Badge>
        )}
      </Link>
      {item.children && isActive && (
        <ul className="ml-7 mt-1 space-y-1">
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {child.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function MultiAgentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { switchMode } = useModeStore();
  const { stats: supportStats, hasNotification } = useSupportStats();
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchMode = async () => {
    setIsSwitching(true);
    await switchMode("single");
    setIsSwitching(false);
    setShowSwitchDialog(false);
    router.push("/admin/single");
  };

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-full flex-col">
          {/* Header with Mode Switcher */}
          <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                  <Zap className="h-4 w-4 text-white dark:text-zinc-900" />
                </div>
              </Link>
              
              {/* Mode Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        管理后台
                      </span>
                      <span className="text-[10px] font-medium flex items-center gap-1 text-violet-500">
                        <Network className="h-3 w-3" /> Supervisor
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {/* 切换到单 Agent */}
                  <DropdownMenuItem 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setShowSwitchDialog(true)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Bot className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">单 Agent 模式</div>
                      <div className="text-xs text-zinc-500">单一 Agent 处理</div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* 当前模式 */}
                  <DropdownMenuItem className="flex items-center gap-3 cursor-default bg-violet-50 dark:bg-violet-900/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                      <Network className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-violet-700 dark:text-violet-300">Supervisor 模式</div>
                      <div className="text-xs text-violet-600/70 dark:text-violet-400/70">运行中</div>
                    </div>
                    <Check className="h-4 w-4 text-violet-600" />
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* 预配置入口 */}
                  <DropdownMenuItem asChild>
                    <Link href="/admin/single" className="flex items-center gap-3 cursor-pointer">
                      <Settings className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">配置单 Agent</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">预设</Badge>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {/* 主菜单 */}
            <ul className="space-y-1">
              {multiModeMainNav.map((item) => (
                <NavItemComponent key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>

            {/* 系统管理菜单 */}
            <Separator className="my-4" />
            <div className="mb-2 px-3">
              <span className="text-xs font-medium text-zinc-500">系统管理</span>
            </div>
            <ul className="space-y-1">
              {systemNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>
          </nav>

          {/* Footer - 快速入口 + 客服工作台 */}
          <div className="border-t border-zinc-200 p-4 space-y-1 dark:border-zinc-800">
            {/* 底部导航入口 */}
            {multiModeFooterNav.map((item) => (
              <NavItemComponent key={item.href} item={item} pathname={pathname} />
            ))}
            
            {/* 客服工作台 */}
            <Link
              href="/support"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MessageSquare className="h-4 w-4" />
                  {hasNotification && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </div>
                客服工作台
              </div>
              {supportStats.pending_count > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                >
                  {supportStats.pending_count > 99 ? "99+" : supportStats.pending_count}
                </Badge>
              )}
            </Link>
          </div>
        </div>
      </aside>

      {/* 模式切换确认弹窗 */}
      <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-500" />
              切换到单 Agent 模式
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  切换后，所有用户请求将由当前激活的单个 Agent 处理。
                </p>
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Supervisor 编排配置将暂停生效。</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSwitching}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSwitchMode}
              disabled={isSwitching}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSwitching ? "切换中..." : "确认切换"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
