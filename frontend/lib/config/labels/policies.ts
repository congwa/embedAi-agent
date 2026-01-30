/**
 * 策略配置项标签
 */

import type { PolicyFieldInfo } from "./types";
import { getMiddlewareLabel } from "./middleware";

export const POLICY_FIELD_LABELS: Record<string, PolicyFieldInfo> = {
  // 工具策略
  min_tool_calls: { label: "最小调用次数", desc: "每次对话至少调用工具的次数" },
  allow_direct_answer: { label: "允许直接回答", desc: "是否允许不调用工具直接回答" },
  fallback_tool: { label: "兜底工具", desc: "无匹配时使用的默认工具" },
  clarification_tool: { label: "澄清工具", desc: "需要澄清时使用的工具" },
  // 注意：中间件开关标签已迁移到 middleware.ts，通过 getMiddlewareLabel 获取
};

export function getPolicyFieldLabel(field: string): PolicyFieldInfo {
  // 优先从策略字段查找
  if (POLICY_FIELD_LABELS[field]) {
    return POLICY_FIELD_LABELS[field];
  }
  // 中间件开关字段使用统一的中间件标签
  if (field.endsWith("_enabled")) {
    const info = getMiddlewareLabel(field);
    return { label: info.label, desc: info.desc };
  }
  return { label: field.replace(/_/g, " "), desc: "" };
}
