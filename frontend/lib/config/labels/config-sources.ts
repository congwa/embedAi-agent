/**
 * 配置来源标签
 */

export const CONFIG_SOURCE_LABELS: Record<string, string> = {
  agent: "Agent 配置",
  settings: "全局设置",
  default: "系统默认",
};

export function getConfigSourceLabel(source: string): string {
  return CONFIG_SOURCE_LABELS[source] || source;
}
