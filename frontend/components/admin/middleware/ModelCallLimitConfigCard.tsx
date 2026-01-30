"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export interface ModelCallLimitConfig {
  thread_limit: number | null;
  run_limit: number | null;
  exit_behavior: "end" | "error";
}

interface ModelCallLimitConfigCardProps {
  enabled: boolean;
  config: ModelCallLimitConfig;
  onEnabledChange: (enabled: boolean) => void;
  onConfigChange: (config: Partial<ModelCallLimitConfig>) => void;
}

const DEFAULT_CONFIG: ModelCallLimitConfig = {
  thread_limit: null,
  run_limit: 20,
  exit_behavior: "end",
};

export function ModelCallLimitConfigCard({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
}: ModelCallLimitConfigCardProps) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              🚦 模型调用限制
            </CardTitle>
            <CardDescription>
              限制模型调用次数，防止死循环和成本失控
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-5">
          {/* 单次运行限制 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>单次运行限制</Label>
              <Switch
                checked={cfg.run_limit !== null}
                onCheckedChange={(v) =>
                  onConfigChange({ run_limit: v ? 20 : null })
                }
              />
            </div>
            {cfg.run_limit !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">限制</span>
                  <span className="text-sm font-mono">{cfg.run_limit} 次</span>
                </div>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[cfg.run_limit]}
                  onValueChange={([v]) => onConfigChange({ run_limit: v })}
                />
                <p className="text-xs text-muted-foreground">
                  单次对话中 LLM 调用的最大次数
                </p>
              </>
            )}
          </div>

          {/* 线程累计限制 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>线程累计限制</Label>
              <Switch
                checked={cfg.thread_limit !== null}
                onCheckedChange={(v) =>
                  onConfigChange({ thread_limit: v ? 100 : null })
                }
              />
            </div>
            {cfg.thread_limit !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">限制</span>
                  <span className="text-sm font-mono">{cfg.thread_limit} 次</span>
                </div>
                <Slider
                  min={10}
                  max={1000}
                  step={10}
                  value={[cfg.thread_limit]}
                  onValueChange={([v]) => onConfigChange({ thread_limit: v })}
                />
                <p className="text-xs text-muted-foreground">
                  跨多次对话的累计调用次数
                </p>
              </>
            )}
          </div>

          {/* 超限行为 */}
          <div className="space-y-2">
            <Label>超限行为</Label>
            <Select
              value={cfg.exit_behavior}
              onValueChange={(v) =>
                onConfigChange({ exit_behavior: v as "end" | "error" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="end">
                  <div className="flex items-center gap-2">
                    <span>🛑 优雅结束</span>
                    <span className="text-xs text-muted-foreground">
                      返回提示消息
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    <span>❌ 抛出异常</span>
                    <span className="text-xs text-muted-foreground">
                      终止执行
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
