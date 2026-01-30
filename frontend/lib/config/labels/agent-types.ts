/**
 * Agent 类型标签配置
 */

export const AGENT_TYPE_LABELS: Record<string, string> = {
  product: "商品推荐",
  faq: "FAQ 问答",
  kb: "知识库",
  custom: "自定义",
};

export function getAgentTypeLabel(type: string): string {
  return AGENT_TYPE_LABELS[type] || type;
}
