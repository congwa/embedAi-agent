"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { updateAgent, type MiddlewareFlags, type PIIRule } from "@/lib/api/agents";
import { getMiddlewareLabel, type MiddlewareFlagKey } from "@/lib/config/labels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PIIConfigCard } from "@/components/admin/pii";
import {
  ModelRetryConfigCard,
  ModelFallbackConfigCard,
  ModelCallLimitConfigCard,
  ContextEditingConfigCard,
  type ModelRetryConfig,
  type ModelCallLimitConfig,
  type ContextEditingConfig,
} from "@/components/admin/middleware";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type StrategyType = "messages" | "tokens";

export default function MiddlewareConfigPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent, refresh } = useAgentDetail({ agentId });
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<MiddlewareFlags>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  // 初始化表单数据
  useState(() => {
    if (agent?.middleware_flags) {
      setFormData(agent.middleware_flags);
    }
  });

  if (!agent) return null;

  const handleChange = <K extends keyof MiddlewareFlags>(
    key: K,
    value: MiddlewareFlags[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveStatus(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateAgent(agentId, { middleware_flags: formData });
      setSaveStatus("success");
      setIsDirty(false);
      refresh();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus("error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(agent.middleware_flags || {});
    setIsDirty(false);
  };

  const getValue = <K extends keyof MiddlewareFlags>(key: K): MiddlewareFlags[K] => {
    return formData[key] ?? agent.middleware_flags?.[key] ?? null;
  };

  const getBoolValue = (key: keyof MiddlewareFlags): boolean => {
    const val = getValue(key);
    return val === true;
  };

  const getNumberValue = (key: keyof MiddlewareFlags): number | undefined => {
    const val = getValue(key);
    return typeof val === "number" ? val : undefined;
  };

  const getStringValue = (key: keyof MiddlewareFlags): string => {
    const val = getValue(key);
    return typeof val === "string" ? val : "";
  };

  return (
    <div className="space-y-6">
      {/* 滑动窗口配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">滑动窗口</CardTitle>
              <CardDescription>
                在模型调用前裁剪消息历史，控制上下文长度
              </CardDescription>
            </div>
            <Switch
              checked={getBoolValue("sliding_window_enabled")}
              onCheckedChange={(v) => handleChange("sliding_window_enabled", v)}
            />
          </div>
        </CardHeader>
        {getBoolValue("sliding_window_enabled") && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>裁剪策略</Label>
                <Select
                  value={getStringValue("sliding_window_strategy") || "messages"}
                  onValueChange={(v) => handleChange("sliding_window_strategy", v as StrategyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="messages">按消息数</SelectItem>
                    <SelectItem value="tokens">按 Token 数</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {getStringValue("sliding_window_strategy") === "tokens" ? (
                <div className="space-y-2">
                  <Label>最大 Token 数</Label>
                  <Input
                    type="number"
                    min={1000}
                    max={100000}
                    value={getNumberValue("sliding_window_max_tokens") || 8000}
                    onChange={(e) => handleChange("sliding_window_max_tokens", parseInt(e.target.value) || null)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>最大消息数</Label>
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    value={getNumberValue("sliding_window_max_messages") || 50}
                    onChange={(e) => handleChange("sliding_window_max_messages", parseInt(e.target.value) || null)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 上下文压缩配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">上下文压缩</CardTitle>
              <CardDescription>
                当消息历史过长时自动摘要，保持上下文连贯性
              </CardDescription>
            </div>
            <Switch
              checked={getBoolValue("summarization_enabled")}
              onCheckedChange={(v) => handleChange("summarization_enabled", v)}
            />
          </div>
        </CardHeader>
        {getBoolValue("summarization_enabled") && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">触发条件</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">消息数阈值</Label>
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    placeholder="如：50"
                    value={getNumberValue("summarization_trigger_messages") || ""}
                    onChange={(e) => handleChange("summarization_trigger_messages", parseInt(e.target.value) || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">Token 阈值（可选）</Label>
                  <Input
                    type="number"
                    min={1000}
                    max={100000}
                    placeholder="如：8000"
                    value={getNumberValue("summarization_trigger_tokens") || ""}
                    onChange={(e) => handleChange("summarization_trigger_tokens", parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">保留策略</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">保留方式</Label>
                  <Select
                    value={getStringValue("summarization_keep_strategy") || "messages"}
                    onValueChange={(v) => handleChange("summarization_keep_strategy", v as StrategyType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="messages">按消息数</SelectItem>
                      <SelectItem value="tokens">按 Token 数</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {getStringValue("summarization_keep_strategy") === "tokens" ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">保留 Token 数</Label>
                    <Input
                      type="number"
                      min={500}
                      max={50000}
                      value={getNumberValue("summarization_keep_tokens") || 2000}
                      onChange={(e) => handleChange("summarization_keep_tokens", parseInt(e.target.value) || null)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500">保留消息数</Label>
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      value={getNumberValue("summarization_keep_messages") || 20}
                      onChange={(e) => handleChange("summarization_keep_messages", parseInt(e.target.value) || null)}
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">摘要模型（留空使用主模型）</Label>
              <Input
                placeholder="如：provider:model_name"
                value={getStringValue("summarization_model")}
                onChange={(e) => handleChange("summarization_model", e.target.value || null)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* 噪音过滤配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">噪音过滤</CardTitle>
              <CardDescription>
                过滤和截断工具输出中的冗余内容，提升模型注意力
              </CardDescription>
            </div>
            <Switch
              checked={getBoolValue("noise_filter_enabled")}
              onCheckedChange={(v) => handleChange("noise_filter_enabled", v)}
            />
          </div>
        </CardHeader>
        {getBoolValue("noise_filter_enabled") && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>最大输出字符</Label>
                <Input
                  type="number"
                  min={500}
                  max={10000}
                  value={getNumberValue("noise_filter_max_chars") || 2000}
                  onChange={(e) => handleChange("noise_filter_max_chars", parseInt(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>保留头部字符</Label>
                <Input
                  type="number"
                  min={100}
                  max={2000}
                  value={getNumberValue("noise_filter_preserve_head") || 500}
                  onChange={(e) => handleChange("noise_filter_preserve_head", parseInt(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>保留尾部字符</Label>
                <Input
                  type="number"
                  min={100}
                  max={5000}
                  value={getNumberValue("noise_filter_preserve_tail") || 1000}
                  onChange={(e) => handleChange("noise_filter_preserve_tail", parseInt(e.target.value) || null)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* PII 检测配置 */}
      <PIIConfigCard
        enabled={getBoolValue("pii_enabled")}
        rules={(getValue("pii_rules") as PIIRule[]) || []}
        onEnabledChange={(v) => handleChange("pii_enabled", v)}
        onRulesChange={(rules) => handleChange("pii_rules", rules)}
      />

      {/* 模型重试配置 */}
      <ModelRetryConfigCard
        enabled={getBoolValue("model_retry_enabled")}
        config={{
          max_retries: getNumberValue("model_retry_max_retries") ?? 2,
          backoff_factor: getNumberValue("model_retry_backoff_factor") ?? 2.0,
          initial_delay: getNumberValue("model_retry_initial_delay") ?? 1.0,
          max_delay: getNumberValue("model_retry_max_delay") ?? 60.0,
          jitter: getValue("model_retry_jitter") !== false,
          on_failure: (getStringValue("model_retry_on_failure") as "continue" | "error") || "continue",
        }}
        onEnabledChange={(v) => handleChange("model_retry_enabled", v)}
        onConfigChange={(cfg) => {
          if (cfg.max_retries !== undefined) handleChange("model_retry_max_retries", cfg.max_retries);
          if (cfg.backoff_factor !== undefined) handleChange("model_retry_backoff_factor", cfg.backoff_factor);
          if (cfg.initial_delay !== undefined) handleChange("model_retry_initial_delay", cfg.initial_delay);
          if (cfg.max_delay !== undefined) handleChange("model_retry_max_delay", cfg.max_delay);
          if (cfg.jitter !== undefined) handleChange("model_retry_jitter", cfg.jitter);
          if (cfg.on_failure !== undefined) handleChange("model_retry_on_failure", cfg.on_failure);
        }}
      />

      {/* 模型降级配置 */}
      <ModelFallbackConfigCard
        enabled={getBoolValue("model_fallback_enabled")}
        models={(getValue("model_fallback_models") as string[]) || []}
        onEnabledChange={(v) => handleChange("model_fallback_enabled", v)}
        onModelsChange={(models) => handleChange("model_fallback_models", models)}
      />

      {/* 模型调用限制配置 */}
      <ModelCallLimitConfigCard
        enabled={getBoolValue("model_call_limit_enabled")}
        config={{
          thread_limit: getNumberValue("model_call_limit_thread") ?? null,
          run_limit: getNumberValue("model_call_limit_run") ?? 20,
          exit_behavior: (getStringValue("model_call_limit_exit_behavior") as "end" | "error") || "end",
        }}
        onEnabledChange={(v) => handleChange("model_call_limit_enabled", v)}
        onConfigChange={(cfg) => {
          if (cfg.thread_limit !== undefined) handleChange("model_call_limit_thread", cfg.thread_limit);
          if (cfg.run_limit !== undefined) handleChange("model_call_limit_run", cfg.run_limit);
          if (cfg.exit_behavior !== undefined) handleChange("model_call_limit_exit_behavior", cfg.exit_behavior);
        }}
      />

      {/* 上下文编辑配置 */}
      <ContextEditingConfigCard
        enabled={getBoolValue("context_editing_enabled")}
        config={{
          token_count_method: (getStringValue("context_editing_token_count_method") as "approximate" | "model") || "approximate",
          trigger: getNumberValue("context_editing_trigger") ?? 100000,
          keep: getNumberValue("context_editing_keep") ?? 3,
          clear_at_least: getNumberValue("context_editing_clear_at_least") ?? 0,
          clear_tool_inputs: getValue("context_editing_clear_tool_inputs") === true,
          exclude_tools: (getValue("context_editing_exclude_tools") as string[]) || [],
          placeholder: getStringValue("context_editing_placeholder") || "[cleared]",
        }}
        onEnabledChange={(v) => handleChange("context_editing_enabled", v)}
        onConfigChange={(cfg) => {
          if (cfg.token_count_method !== undefined) handleChange("context_editing_token_count_method", cfg.token_count_method);
          if (cfg.trigger !== undefined) handleChange("context_editing_trigger", cfg.trigger);
          if (cfg.keep !== undefined) handleChange("context_editing_keep", cfg.keep);
          if (cfg.clear_at_least !== undefined) handleChange("context_editing_clear_at_least", cfg.clear_at_least);
          if (cfg.clear_tool_inputs !== undefined) handleChange("context_editing_clear_tool_inputs", cfg.clear_tool_inputs);
          if (cfg.exclude_tools !== undefined) handleChange("context_editing_exclude_tools", cfg.exclude_tools);
          if (cfg.placeholder !== undefined) handleChange("context_editing_placeholder", cfg.placeholder);
        }}
      />

      {/* 基础中间件开关 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基础中间件</CardTitle>
          <CardDescription>常用中间件的开关配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["todo_enabled", "tool_retry_enabled", "tool_limit_enabled", "memory_enabled"] as MiddlewareFlagKey[]).map((key, index, arr) => {
            const info = getMiddlewareLabel(key);
            return (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{info.label}</Label>
                    <p className="text-xs text-zinc-500">{info.desc}</p>
                  </div>
                  <Switch
                    checked={getBoolValue(key)}
                    onCheckedChange={(v) => handleChange(key, v)}
                  />
                </div>
                {index < arr.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 保存状态提示 */}
      {saveStatus && (
        <Alert variant={saveStatus === "success" ? "default" : "destructive"}>
          {saveStatus === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {saveStatus === "success" ? "中间件配置已保存" : "保存失败，请重试"}
          </AlertDescription>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
          <RotateCcw className="mr-2 h-4 w-4" />
          重置
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          保存配置
        </Button>
      </div>
    </div>
  );
}
