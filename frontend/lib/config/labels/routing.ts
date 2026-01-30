/**
 * 路由策略标签配置
 */

export const ROUTING_POLICY_LABELS: Record<string, string> = {
  keyword: "关键词匹配",
  intent: "意图识别",
  hybrid: "混合模式",
};

export function getRoutingPolicyLabel(type: string): string {
  return ROUTING_POLICY_LABELS[type] || type;
}
