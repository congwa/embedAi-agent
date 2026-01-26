/**
 * 系统配置 API 客户端
 */

import { apiRequest } from "./client";

// ========== 类型定义 ==========

export interface SystemConfigMasked {
  initialized: boolean;
  llm_provider: string;
  llm_api_key_masked: string;
  llm_base_url: string;
  llm_chat_model: string;
  embedding_provider: string;
  embedding_api_key_masked: string | null;
  embedding_base_url: string | null;
  embedding_model: string;
  embedding_dimension: number;
  rerank_enabled: boolean;
  rerank_provider: string | null;
  rerank_api_key_masked: string | null;
  rerank_base_url: string | null;
  rerank_model: string | null;
  rerank_top_n: number;
  source: "env" | "database";
}

export interface ProviderPreset {
  id: string;
  name: string;
  base_url: string;
  default_model: string;
  default_embedding_model: string;
  default_embedding_dimension: number;
}

export interface ProviderPresetsResponse {
  items: ProviderPreset[];
}

export interface QuickConfigUpdate {
  api_key: string;
  provider?: string;
  base_url?: string;
}

export interface FullConfigUpdate {
  llm_provider: string;
  llm_api_key: string;
  llm_base_url: string;
  llm_chat_model: string;
  embedding_provider: string;
  embedding_api_key?: string | null;
  embedding_base_url?: string | null;
  embedding_model: string;
  embedding_dimension: number;
  rerank_enabled?: boolean;
  rerank_provider?: string | null;
  rerank_api_key?: string | null;
  rerank_base_url?: string | null;
  rerank_model?: string | null;
  rerank_top_n?: number;
}

export interface ConfigTestRequest {
  provider: string;
  api_key: string;
  base_url: string;
  model?: string;
}

export interface ConfigTestResponse {
  success: boolean;
  message: string;
  latency_ms?: number;
  models?: string[];
}

export interface ConfigStatus {
  configured: boolean;
  source: string;
  llm_provider: string | null;
  embedding_model: string | null;
}

// ========== API 函数 ==========

const BASE_PATH = "/api/v1/admin/system-config";

/**
 * 获取系统配置（API Key 脱敏）
 */
export async function getSystemConfig(): Promise<SystemConfigMasked> {
  return apiRequest<SystemConfigMasked>(BASE_PATH);
}

/**
 * 获取提供商预设列表
 */
export async function getProviderPresets(): Promise<ProviderPresetsResponse> {
  return apiRequest<ProviderPresetsResponse>(`${BASE_PATH}/providers`);
}

/**
 * 快速配置（只需 API Key）
 */
export async function updateQuickConfig(
  data: QuickConfigUpdate
): Promise<SystemConfigMasked> {
  return apiRequest<SystemConfigMasked>(`${BASE_PATH}/quick`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 完整配置更新
 */
export async function updateFullConfig(
  data: FullConfigUpdate
): Promise<SystemConfigMasked> {
  return apiRequest<SystemConfigMasked>(`${BASE_PATH}/full`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 测试配置
 */
export async function testConfig(
  data: ConfigTestRequest
): Promise<ConfigTestResponse> {
  return apiRequest<ConfigTestResponse>(`${BASE_PATH}/test`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 获取配置状态
 */
export async function getConfigStatus(): Promise<ConfigStatus> {
  return apiRequest<ConfigStatus>(`${BASE_PATH}/status`);
}
