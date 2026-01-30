// Quick Setup 快捷配置中心 API

import { apiRequest } from "./client";

// ========== Types ==========

export type SetupStepStatus = "pending" | "in_progress" | "completed" | "skipped";
export type ChecklistItemStatus = "ok" | "default" | "missing" | "error";

export interface SetupStep {
  index: number;
  key: string;
  title: string;
  description: string | null;
  status: SetupStepStatus;
  data: Record<string, unknown> | null;
}

export type SetupLevel = "none" | "essential" | "full";

export interface QuickSetupState {
  completed: boolean;
  current_step: number;
  steps: SetupStep[];
  agent_id: string | null;
  updated_at: string | null;
  setup_level: SetupLevel;
  essential_completed: boolean;
  essential_data: Record<string, unknown> | null;
}

export interface ChecklistItem {
  key: string;
  label: string;
  category: string;
  status: ChecklistItemStatus;
  current_value: string | null;
  default_value: string | null;
  description: string | null;
  step_index: number | null;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  total: number;
  ok_count: number;
  default_count: number;
  missing_count: number;
}

export interface AgentTypeField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "switch" | "number";
  required: boolean;
  default: unknown;
  options: Array<{ value: string; label: string }> | null;
  description: string | null;
  group: string | null;
}

export interface AgentTypeStepConfig {
  step_key: string;
  enabled: boolean;
  title_override: string | null;
  description_override: string | null;
  fields: AgentTypeField[];
  hints: string[];
}

export interface AgentTypeConfig {
  type: "product" | "faq" | "kb" | "custom";
  name: string;
  description: string;
  icon: string;
  default_tool_categories: string[];
  default_middleware_flags: Record<string, boolean>;
  default_knowledge_type: string | null;
  steps: AgentTypeStepConfig[];
  greeting_template: Record<string, unknown> | null;
  system_prompt_template: string | null;
}

export interface ServiceHealthItem {
  name: string;
  status: "ok" | "error" | "unknown";
  message: string | null;
  latency_ms: number | null;
}

export interface HealthCheckResponse {
  services: ServiceHealthItem[];
  all_ok: boolean;
}

export interface QuickStats {
  agents: {
    total: number;
    default_id: string | null;
    default_name: string | null;
    default_type: string | null;
  };
  faq: {
    total: number;
    unindexed: number;
  };
  knowledge_configs: {
    total: number;
  };
  settings: {
    llm_provider: string;
    llm_model: string;
    embedding_model: string;
    qdrant_collection: string;
    memory_enabled: boolean;
    crawler_enabled: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ========== Essential Setup Types ==========

export interface EssentialSetupRequest {
  mode: "single" | "supervisor";
  llm_provider: string;
  llm_api_key: string;
  llm_model: string;
  llm_base_url?: string;
  // Embedding 配置
  embedding_model: string;
  embedding_dimension: number;  // 嵌入维度
  embedding_api_key?: string;  // 不填则使用 LLM API Key
  embedding_base_url?: string; // 不填则使用 LLM Base URL
  agent_type: "product" | "faq" | "kb" | "custom";
  agent_name?: string;
}

export interface EssentialSetupResponse {
  success: boolean;
  agent_id: string | null;
  message: string;
  state: QuickSetupState | null;
}

export interface EssentialValidationResponse {
  can_proceed: boolean;
  missing_items: string[];
  warnings: string[];
}

// ========== State API ==========

export async function getSetupState(): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>("/api/v1/admin/quick-setup/state");
}

export async function updateSetupState(
  data: Partial<QuickSetupState>
): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>("/api/v1/admin/quick-setup/state", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function resetSetupState(): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>("/api/v1/admin/quick-setup/state/reset", {
    method: "POST",
  });
}

export async function completeStep(
  stepIndex: number,
  data?: Record<string, unknown>
): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>(
    `/api/v1/admin/quick-setup/state/step/${stepIndex}/complete`,
    {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }
  );
}

export async function skipStep(stepIndex: number): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>(
    `/api/v1/admin/quick-setup/state/step/${stepIndex}/skip`,
    {
      method: "POST",
    }
  );
}

export async function gotoStep(stepIndex: number): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>(
    `/api/v1/admin/quick-setup/state/step/${stepIndex}/goto`,
    {
      method: "POST",
    }
  );
}

export async function setCurrentAgent(agentId: string): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>(
    `/api/v1/admin/quick-setup/state/agent/${agentId}`,
    {
      method: "POST",
    }
  );
}

export async function setSetupMode(mode: "single" | "supervisor"): Promise<QuickSetupState> {
  return apiRequest<QuickSetupState>(
    `/api/v1/admin/quick-setup/state/mode/${mode}`,
    {
      method: "POST",
    }
  );
}

export async function getCurrentMode(): Promise<{ mode: string | null }> {
  return apiRequest<{ mode: string | null }>("/api/v1/admin/quick-setup/state/mode");
}

// ========== Checklist API ==========

export async function getChecklist(): Promise<ChecklistResponse> {
  return apiRequest<ChecklistResponse>("/api/v1/admin/quick-setup/checklist");
}

export async function getChecklistSummary(): Promise<Record<string, Record<string, number>>> {
  return apiRequest<Record<string, Record<string, number>>>(
    "/api/v1/admin/quick-setup/checklist/summary"
  );
}

// ========== Agent Type API ==========

export async function getAgentTypes(): Promise<AgentTypeConfig[]> {
  const response = await apiRequest<{ items: AgentTypeConfig[] }>(
    "/api/v1/admin/quick-setup/agent-types"
  );
  return response.items;
}

export async function getAgentTypeConfig(
  agentType: string
): Promise<AgentTypeConfig> {
  return apiRequest<AgentTypeConfig>(
    `/api/v1/admin/quick-setup/agent-types/${agentType}`
  );
}

export async function getAgentTypeDefaults(
  agentType: string
): Promise<{
  tool_categories: string[];
  middleware_flags: Record<string, boolean>;
  knowledge_type: string | null;
  system_prompt_template: string | null;
  greeting_template: Record<string, unknown> | null;
}> {
  return apiRequest(`/api/v1/admin/quick-setup/agent-types/${agentType}/defaults`);
}

// ========== Health & Stats API ==========

export async function checkServicesHealth(): Promise<HealthCheckResponse> {
  return apiRequest<HealthCheckResponse>("/api/v1/admin/quick-setup/health");
}

export async function getQuickStats(): Promise<QuickStats> {
  return apiRequest<QuickStats>("/api/v1/admin/quick-setup/stats");
}

// ========== Validation API ==========

export async function validateStep(
  stepKey: string,
  data: Record<string, unknown>,
  agentType?: string
): Promise<ValidationResult> {
  const params = new URLSearchParams();
  if (agentType) params.set("agent_type", agentType);
  const query = params.toString();
  return apiRequest<ValidationResult>(
    `/api/v1/admin/quick-setup/validate/${stepKey}${query ? `?${query}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ========== Essential Setup API ==========

export async function completeEssentialSetup(
  data: EssentialSetupRequest
): Promise<EssentialSetupResponse> {
  return apiRequest<EssentialSetupResponse>(
    "/api/v1/admin/quick-setup/essential/complete",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function validateEssentialSetup(
  data: EssentialSetupRequest
): Promise<EssentialValidationResponse> {
  return apiRequest<EssentialValidationResponse>(
    "/api/v1/admin/quick-setup/essential/validate",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ========== Models Discovery API ==========

export interface LLMProvider {
  id: string;
  name: string;
  base_url: string;
}

export interface LLMModel {
  id: string;
  name: string;
  reasoning: boolean;
  tool_call: boolean;
  structured_output?: boolean;
  context_limit?: number;
}

export async function getProviders(): Promise<LLMProvider[]> {
  return apiRequest<LLMProvider[]>("/api/v1/admin/quick-setup/providers");
}

export async function getProviderModels(providerId: string): Promise<LLMModel[]> {
  return apiRequest<LLMModel[]>(`/api/v1/admin/quick-setup/providers/${providerId}/models`);
}

// ========== Health Check API ==========

export interface QdrantCheckRequest {
  host: string;
  port: number;
}

export interface QdrantCheckResponse {
  success: boolean;
  message: string;
  latency_ms: number | null;
}

export async function checkQdrantConnection(data: QdrantCheckRequest): Promise<QdrantCheckResponse> {
  return apiRequest<QdrantCheckResponse>("/api/v1/admin/quick-setup/health/qdrant", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
