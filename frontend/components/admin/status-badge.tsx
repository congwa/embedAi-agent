"use client";

import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  enabled: boolean;
  enabledText?: string;
  disabledText?: string;
  size?: "sm" | "default";
  className?: string;
}

export function StatusBadge({
  enabled,
  enabledText = "启用",
  disabledText = "禁用",
  size = "default",
  className,
}: StatusBadgeProps) {
  const iconClass = size === "sm" ? "mr-1 h-2.5 w-2.5" : "mr-1 h-3 w-3";

  return enabled ? (
    <Badge
      variant="default"
      className={cn(
        "bg-green-100 text-green-700 hover:bg-green-100",
        className
      )}
    >
      <Check className={iconClass} />
      {enabledText}
    </Badge>
  ) : (
    <Badge variant="secondary" className={cn("bg-zinc-100 text-zinc-500", className)}>
      <X className={iconClass} />
      {disabledText}
    </Badge>
  );
}
