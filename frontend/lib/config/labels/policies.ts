/**
 * 策略配置项标签
 */

import type { PolicyFieldInfo } from "./types";

export const POLICY_FIELD_LABELS: Record<string, PolicyFieldInfo> = {
  // 工具策略
  min_tool_calls: { label: "最小调用次数", desc: "每次对话至少调用工具的次数" },
  allow_direct_answer: { label: "允许直接回答", desc: "是否允许不调用工具直接回答" },
  fallback_tool: { label: "兜底工具", desc: "无匹配时使用的默认工具" },
  clarification_tool: { label: "澄清工具", desc: "需要澄清时使用的工具" },
  // 中间件开关
  todo_enabled: { label: "任务规划", desc: "自动拆解复杂任务" },
  memory_enabled: { label: "记忆系统", desc: "记住用户偏好和历史" },
  sliding_window_enabled: { label: "滑动窗口", desc: "限制上下文长度" },
  summarization_enabled: { label: "上下文压缩", desc: "压缩长对话" },
  noise_filter_enabled: { label: "噪音过滤", desc: "过滤冗余信息" },
  tool_retry_enabled: { label: "工具重试", desc: "失败时自动重试" },
};

export function getPolicyFieldLabel(field: string): PolicyFieldInfo {
  return POLICY_FIELD_LABELS[field] || { label: field.replace(/_/g, " "), desc: "" };
}
