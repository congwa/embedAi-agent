"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface InfoPopoverProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  icon?: LucideIcon;
  status?: "enabled" | "disabled";
  statusLabel?: string;
  details?: React.ReactNode;
  footer?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  delayShow?: number;
  delayHide?: number;
}

export function InfoPopover({
  trigger,
  title,
  description,
  icon: Icon,
  status,
  statusLabel,
  details,
  footer,
  side = "top",
  align = "center",
  className,
  contentClassName,
  delayShow = 200,
  delayHide = 100,
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimers();
    showTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, delayShow);
  }, [clearTimers, delayShow]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, delayHide);
  }, [clearTimers, delayHide]);

  React.useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const statusBadge = status && (
    <Badge
      variant={status === "enabled" ? "default" : "destructive"}
      className="text-xs"
    >
      {statusLabel || (status === "enabled" ? "已启用" : "已禁用")}
    </Badge>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn("cursor-pointer", className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {trigger}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn("w-80", contentClassName)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              <span className="font-medium">{title}</span>
            </div>
            {statusBadge}
          </div>

          <p className="text-sm text-muted-foreground">{description}</p>

          {details && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              {details}
            </div>
          )}

          {footer && (
            <div className="border-t pt-3">
              {footer}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
