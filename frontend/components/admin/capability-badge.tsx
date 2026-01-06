"use client";

import {
  HelpCircle,
  Globe,
  Wrench,
  Brain,
  Database,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type Capability = "faq" | "crawler" | "tools" | "memory" | "kb" | "custom";

interface CapabilityConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

const capabilityConfigs: Record<Capability, CapabilityConfig> = {
  faq: {
    label: "FAQ",
    icon: HelpCircle,
    color: "bg-blue-100 text-blue-700",
  },
  crawler: {
    label: "爬虫",
    icon: Globe,
    color: "bg-green-100 text-green-700",
  },
  tools: {
    label: "工具",
    icon: Wrench,
    color: "bg-purple-100 text-purple-700",
  },
  memory: {
    label: "记忆",
    icon: Brain,
    color: "bg-amber-100 text-amber-700",
  },
  kb: {
    label: "知识库",
    icon: Database,
    color: "bg-pink-100 text-pink-700",
  },
  custom: {
    label: "自定义",
    icon: Sparkles,
    color: "bg-zinc-100 text-zinc-700",
  },
};

interface CapabilityBadgeProps {
  capability: Capability;
  size?: "sm" | "default";
  className?: string;
}

export function CapabilityBadge({
  capability,
  size = "default",
  className,
}: CapabilityBadgeProps) {
  const config = capabilityConfigs[capability];
  const Icon = config.icon;
  const iconClass = size === "sm" ? "mr-1 h-2.5 w-2.5" : "mr-1 h-3 w-3";

  return (
    <Badge className={cn(config.color, `hover:${config.color}`, className)}>
      <Icon className={iconClass} />
      {config.label}
    </Badge>
  );
}

interface CapabilityBadgesProps {
  capabilities: Capability[];
  size?: "sm" | "default";
  className?: string;
}

export function CapabilityBadges({
  capabilities,
  size = "default",
  className,
}: CapabilityBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {capabilities.map((cap) => (
        <CapabilityBadge key={cap} capability={cap} size={size} />
      ))}
    </div>
  );
}
