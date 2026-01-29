/**
 * Agent 详情页 Tab 配置
 * 统一管理三个入口（agents/single/multi）的 Tab 显示逻辑
 */

export type AgentDetailContext = "center" | "single" | "multi";

export interface AgentTabConfig {
  id: string;
  label: string;
  href: string;
}

export interface AgentTabOptions {
  agentType: string;
  context: AgentDetailContext;
  isSupervisor?: boolean;
}

/**
 * 获取 Agent 详情页的 Tab 配置
 * 
 * @param options.agentType - Agent 类型 (product/faq/kb/custom)
 * @param options.context - 入口上下文
 *   - center: /admin/agents (Agent 中心，全功能)
 *   - single: /admin/single/agents (单 Agent 模式)
 *   - multi: /admin/multi/agents (Supervisor 模式下的子 Agent)
 * @param options.isSupervisor - 是否为 Supervisor Agent
 */
export function getAgentTabs(options: AgentTabOptions): AgentTabConfig[] {
  const { agentType, context, isSupervisor } = options;
  
  const tabs: AgentTabConfig[] = [
    { id: "overview", label: "基础设置", href: "" },
  ];

  // 运行态预览 - 所有入口都有
  if (context === "center") {
    tabs.push({ id: "effective-config", label: "运行态预览", href: "/effective-config" });
  }

  // 开场白 - 所有入口都有
  tabs.push({ id: "greeting", label: "开场白", href: "/greeting" });

  // 推荐问题 - single 和 center 有，multi 暂不需要（由 Supervisor 统一管理）
  if (context !== "multi") {
    tabs.push({ id: "suggested-questions", label: "推荐问题", href: "/suggested-questions" });
  }

  // 工具配置 - 所有入口都有
  tabs.push({ id: "tools", label: "工具配置", href: "/tools" });

  // 中间件 - 所有入口都有
  tabs.push({ id: "middleware", label: "中间件", href: "/middleware" });

  // 记忆与提示词 - single 和 center 有
  if (context !== "multi") {
    tabs.push({ id: "memory", label: "记忆与提示词", href: "/memory" });
  }

  // 路由配置 - 仅 multi 入口有（子 Agent 的路由关键词）
  if (context === "multi") {
    tabs.push({ id: "routing", label: "路由配置", href: "/routing" });
  }

  // 会话洞察 - single 和 center 有
  if (context !== "multi") {
    tabs.push({ id: "conversations", label: "会话洞察", href: "/conversations" });
  }

  // FAQ 管理 - 按 type 显示
  if (agentType === "faq") {
    tabs.push({ id: "faq", label: "FAQ 管理", href: "/faq" });
  }

  // 知识库 - 按 type 显示
  if (agentType === "kb" || agentType === "faq") {
    tabs.push({ id: "knowledge", label: "知识库", href: "/knowledge" });
  }

  // 多 Agent 编排 - 仅 center 入口有
  if (context === "center") {
    tabs.push({ id: "supervisor", label: "多Agent编排", href: "/supervisor" });
  }

  return tabs;
}

/**
 * 根据 pathname 获取当前 Tab ID
 */
export function getCurrentTabId(
  pathname: string,
  basePath: string,
  tabs: AgentTabConfig[]
): string {
  const currentTab = tabs.find((tab) => {
    const tabPath = `${basePath}${tab.href}`;
    return pathname === tabPath;
  });
  return currentTab?.id || "overview";
}

/**
 * Agent 类型标签映射
 */
export const AGENT_TYPE_LABELS: Record<string, string> = {
  product: "商品推荐",
  faq: "FAQ 问答",
  kb: "知识库",
  custom: "自定义",
};
