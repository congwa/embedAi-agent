/**
 * 中间件标签配置
 */

import {
  ListTodo,
  Brain,
  FileText,
  RotateCcw,
  Gauge,
  Eraser,
  Layers,
  Sparkles,
  Settings,
  Shield,
} from "lucide-react";
import type { MiddlewareInfo, MiddlewarePipelineInfoExtended } from "./types";

// ========== 中间件开关配置 ==========

export const MIDDLEWARE_LABELS: Record<string, MiddlewareInfo> = {
  todo_enabled: {
    label: "TODO 规划",
    desc: "自动拆解复杂任务为步骤",
    icon: ListTodo,
  },
  memory_enabled: {
    label: "记忆系统",
    desc: "记住用户偏好和历史",
    icon: Brain,
  },
  summarization_enabled: {
    label: "上下文压缩",
    desc: "压缩长对话保持上下文",
    icon: FileText,
  },
  tool_retry_enabled: {
    label: "工具重试",
    desc: "工具调用失败时自动重试",
    icon: RotateCcw,
  },
  tool_limit_enabled: {
    label: "工具限制",
    desc: "限制单次对话工具调用次数",
    icon: Gauge,
  },
  noise_filter_enabled: {
    label: "噪音过滤",
    desc: "过滤冗余信息提升质量",
    icon: Eraser,
  },
  sliding_window_enabled: {
    label: "滑动窗口",
    desc: "限制上下文长度节省 token",
    icon: Layers,
  },
  pii_enabled: {
    label: "PII 检测",
    desc: "检测并处理个人敏感信息",
    icon: Shield,
  },
  model_retry_enabled: {
    label: "模型重试",
    desc: "模型调用失败时自动重试",
    icon: RotateCcw,
  },
  model_fallback_enabled: {
    label: "模型降级",
    desc: "主模型失败时切换备选模型",
    icon: Layers,
  },
  model_call_limit_enabled: {
    label: "模型调用限制",
    desc: "限制模型调用次数防止死循环",
    icon: Gauge,
  },
  context_editing_enabled: {
    label: "上下文编辑",
    desc: "清理工具结果管理上下文大小",
    icon: Eraser,
  },
};

export function getMiddlewareLabel(key: string): MiddlewareInfo {
  return (
    MIDDLEWARE_LABELS[key] || {
      label: key.replace(/_/g, " "),
      desc: "",
      icon: Settings,
    }
  );
}

// ========== 中间件管道配置 ==========

export const MIDDLEWARE_PIPELINE_LABELS: Record<string, MiddlewarePipelineInfoExtended> = {
  MemoryOrchestration: {
    label: "记忆编排",
    desc: "用户记忆的读取和写入",
    icon: Brain,
    details: [
      "对话开始时加载用户历史记忆",
      "对话过程中捕获重要信息",
      "对话结束时保存新记忆",
    ],
  },
  PIIDetection: {
    label: "隐私保护",
    desc: "检测和处理个人敏感信息",
    icon: Shield,
    details: [
      "检测邮箱、信用卡、IP 等敏感信息",
      "支持 block/redact/mask/hash 策略",
      "可配置检测范围（输入/输出）",
    ],
  },
  ResponseSanitization: {
    label: "响应净化",
    desc: "过滤敏感内容和异常响应",
    icon: Eraser,
    details: [
      "检测模型返回的异常格式",
      "过滤可能的敏感或不当内容",
      "替换为友好的用户提示",
    ],
  },
  SSE: {
    label: "流式输出",
    desc: "实时流式输出响应内容",
    icon: Sparkles,
    details: [
      "发送 llm.call.start 事件",
      "实时推送模型生成内容",
      "发送 llm.call.end 事件",
    ],
  },
  TodoList: {
    label: "任务规划",
    desc: "自动拆解复杂任务为步骤",
    icon: ListTodo,
    details: [
      "识别用户的复杂任务",
      "自动拆解为可执行步骤",
      "按步骤逐一完成",
    ],
  },
  SequentialToolExecution: {
    label: "顺序执行",
    desc: "按顺序执行工具调用",
    icon: Layers,
    details: [
      "收集模型的多个工具调用请求",
      "按顺序依次执行",
      "汇总结果返回给模型",
    ],
  },
  NoiseFilter: {
    label: "噪音过滤",
    desc: "过滤冗余信息提升质量",
    icon: Eraser,
    details: [
      "识别响应中的冗余信息",
      "过滤无关的系统输出",
      "保留核心有价值内容",
    ],
  },
  Logging: {
    label: "日志记录",
    desc: "记录请求和响应日志",
    icon: FileText,
    details: [
      "记录 LLM 请求参数",
      "记录响应内容和耗时",
      "支持调试和审计",
    ],
  },
  ToolRetry: {
    label: "工具重试",
    desc: "工具调用失败时自动重试",
    icon: RotateCcw,
    details: [
      "捕获工具执行异常",
      "按配置的次数自动重试",
      "超过重试次数后返回错误",
    ],
  },
  ToolCallLimit: {
    label: "调用限制",
    desc: "限制单次对话工具调用次数",
    icon: Gauge,
    details: [
      "统计当前对话的工具调用次数",
      "超过限制时阻止继续调用",
      "防止无限循环调用",
    ],
  },
  SlidingWindow: {
    label: "滑动窗口",
    desc: "限制上下文长度节省 token",
    icon: Layers,
    details: [
      "监控对话历史长度",
      "超出窗口时裁剪早期消息",
      "保留最近的对话上下文",
    ],
  },
  Summarization: {
    label: "上下文压缩",
    desc: "压缩长对话保持上下文",
    icon: FileText,
    details: [
      "检测对话历史过长",
      "自动生成历史摘要",
      "用摘要替换详细历史",
    ],
  },
  ModelRetry: {
    label: "模型重试",
    desc: "模型调用失败时自动重试（指数退避）",
    icon: RotateCcw,
    details: [
      "捕获模型调用异常",
      "按指数退避策略延迟重试",
      "支持配置最大重试次数和延迟",
    ],
    triggerCondition: "模型调用抛出异常",
  },
  ModelFallback: {
    label: "模型降级",
    desc: "主模型失败时切换备选模型",
    icon: Layers,
    details: [
      "主模型调用失败时触发",
      "按顺序尝试备选模型列表",
      "所有模型失败后返回错误",
    ],
    triggerCondition: "主模型调用失败",
  },
  ModelCallLimit: {
    label: "模型调用限制",
    desc: "限制模型调用次数防止死循环",
    icon: Gauge,
    details: [
      "统计线程/运行级调用次数",
      "超限时结束或抛出错误",
      "防止 Agent 无限循环",
    ],
    triggerCondition: "调用次数达到限制",
    note: "建议设置合理的 run_limit 防止资源浪费",
  },
  ContextEditing: {
    label: "上下文编辑",
    desc: "清理工具结果管理上下文大小",
    icon: Eraser,
    details: [
      "检测上下文 token 数超过阈值",
      "清理早期工具调用结果",
      "保留最近 N 个工具结果",
    ],
    triggerCondition: "上下文 token 数超过阈值",
  },
};

export function getMiddlewarePipelineLabel(name: string): MiddlewarePipelineInfoExtended {
  return MIDDLEWARE_PIPELINE_LABELS[name] || { label: name, desc: "" };
}

// ========== 统一中间件键名列表 ==========

/** 所有可配置的中间件开关键名（按显示顺序排列） */
export const MIDDLEWARE_FLAG_KEYS = [
  "todo_enabled",
  "memory_enabled",
  "summarization_enabled",
  "sliding_window_enabled",
  "noise_filter_enabled",
  "tool_retry_enabled",
  "tool_limit_enabled",
  "pii_enabled",
  "model_retry_enabled",
  "model_fallback_enabled",
  "model_call_limit_enabled",
  "context_editing_enabled",
] as const;

export type MiddlewareFlagKey = (typeof MIDDLEWARE_FLAG_KEYS)[number];

/** 获取所有中间件开关配置列表 */
export function getAllMiddlewareFlags(): Array<{ key: MiddlewareFlagKey; info: MiddlewareInfo }> {
  return MIDDLEWARE_FLAG_KEYS.map((key) => ({
    key,
    info: getMiddlewareLabel(key),
  }));
}
