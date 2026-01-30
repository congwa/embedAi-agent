"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export interface ModelRetryConfig {
  max_retries: number;
  backoff_factor: number;
  initial_delay: number;
  max_delay: number;
  jitter: boolean;
  on_failure: "continue" | "error";
}

interface ModelRetryConfigCardProps {
  enabled: boolean;
  config: ModelRetryConfig;
  onEnabledChange: (enabled: boolean) => void;
  onConfigChange: (config: Partial<ModelRetryConfig>) => void;
}

const DEFAULT_CONFIG: ModelRetryConfig = {
  max_retries: 2,
  backoff_factor: 2.0,
  initial_delay: 1.0,
  max_delay: 60.0,
  jitter: true,
  on_failure: "continue",
};

export function ModelRetryConfigCard({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
}: ModelRetryConfigCardProps) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              🔄 模型重试
            </CardTitle>
            <CardDescription>
              模型调用失败时自动重试，应对网络抖动和 API 限流
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-5">
          {/* 最大重试次数 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>最大重试次数</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {cfg.max_retries}
              </span>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[cfg.max_retries]}
              onValueChange={([v]) => onConfigChange({ max_retries: v })}
            />
            <p className="text-xs text-muted-foreground">
              0 = 不重试，建议 2-3 次
            </p>
          </div>

          {/* 退避因子 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>退避因子</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {cfg.backoff_factor}x
              </span>
            </div>
            <Slider
              min={0}
              max={5}
              step={0.5}
              value={[cfg.backoff_factor]}
              onValueChange={([v]) => onConfigChange({ backoff_factor: v })}
            />
            <p className="text-xs text-muted-foreground">
              0 = 固定延迟，2.0 = 每次翻倍
            </p>
          </div>

          {/* 延迟配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>初始延迟 (秒)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                value={cfg.initial_delay}
                onChange={(e) =>
                  onConfigChange({ initial_delay: parseFloat(e.target.value) || 1.0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>最大延迟 (秒)</Label>
              <Input
                type="number"
                step="1"
                min="1"
                max="300"
                value={cfg.max_delay}
                onChange={(e) =>
                  onConfigChange({ max_delay: parseFloat(e.target.value) || 60.0 })
                }
              />
            </div>
          </div>

          {/* 随机抖动 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>随机抖动</Label>
              <p className="text-xs text-muted-foreground">
                ±25% 随机延迟，避免雪崩效应
              </p>
            </div>
            <Switch
              checked={cfg.jitter}
              onCheckedChange={(v) => onConfigChange({ jitter: v })}
            />
          </div>

          {/* 失败行为 */}
          <div className="space-y-2">
            <Label>重试耗尽后行为</Label>
            <Select
              value={cfg.on_failure}
              onValueChange={(v) =>
                onConfigChange({ on_failure: v as "continue" | "error" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">
                  <div className="flex flex-col items-start">
                    <span>继续执行</span>
                    <span className="text-xs text-muted-foreground">
                      返回错误消息，Agent 继续运行
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex flex-col items-start">
                    <span>抛出异常</span>
                    <span className="text-xs text-muted-foreground">
                      终止 Agent 执行
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
