/**
 * Labels 模块共享类型定义
 */

import type { LucideIcon } from "lucide-react";

// ========== 工具类别 ==========
export interface ToolCategoryInfo {
  label: string;
  desc: string;
  icon: LucideIcon;
  tools?: { name: string; desc: string }[];
}

// ========== 中间件 ==========
export interface MiddlewareInfo {
  label: string;
  desc: string;
  icon: LucideIcon;
}

export interface MiddlewarePipelineInfo {
  label: string;
  desc: string;
  icon?: LucideIcon;
}

export interface MiddlewarePipelineInfoExtended extends MiddlewarePipelineInfo {
  details?: string[];
  triggerCondition?: string;
  note?: string;
  relatedDocs?: string;
}

// ========== 工具 ==========
export interface ToolInfo {
  label: string;
  desc: string;
}

// ========== 提示词层级 ==========
export interface PromptLayerInfo {
  label: string;
  desc: string;
}

// ========== 策略配置项 ==========
export interface PolicyFieldInfo {
  label: string;
  desc: string;
}
