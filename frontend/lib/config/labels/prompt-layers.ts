/**
 * 提示词层级标签配置
 */

import type { PromptLayerInfo } from "./types";

export const PROMPT_LAYER_LABELS: Record<string, PromptLayerInfo> = {
  base: { label: "基础提示词", desc: "Agent 的核心系统提示词" },
  skill_injection: { label: "技能注入", desc: "始终生效技能的内容注入" },
};

export function getPromptLayerLabel(name: string): PromptLayerInfo {
  return PROMPT_LAYER_LABELS[name] || { label: name, desc: "" };
}
