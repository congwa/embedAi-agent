"use client";

import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatTheme } from "./chat-theme-provider";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitcher({ className, showLabel = false }: ThemeSwitcherProps) {
  const { themeId, setTheme, availableThemes } = useChatTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "sm" : "icon"}
          className={cn("gap-2", className)}
        >
          <Palette className="h-4 w-4" />
          {showLabel && <span>主题</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>选择聊天主题</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            {/* 主题预览色块 */}
            <div className="flex gap-0.5">
              <div
                className="h-4 w-4 rounded-l-sm"
                style={{ backgroundColor: theme.previewColors.background }}
              />
              <div
                className="h-4 w-4"
                style={{ backgroundColor: theme.previewColors.primary }}
              />
              <div
                className="h-4 w-4 rounded-r-sm"
                style={{ backgroundColor: theme.previewColors.accent }}
              />
            </div>
            {/* 主题信息 */}
            <div className="flex-1">
              <div className="text-sm font-medium">{theme.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {theme.description}
              </div>
            </div>
            {/* 选中标记 */}
            {themeId === theme.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 简化版：仅图标按钮
export function ThemeSwitcherIcon({ className }: { className?: string }) {
  return <ThemeSwitcher className={className} showLabel={false} />;
}

// 完整版：带标签
export function ThemeSwitcherWithLabel({ className }: { className?: string }) {
  return <ThemeSwitcher className={className} showLabel={true} />;
}
