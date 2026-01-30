"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export interface ContextEditingConfig {
  token_count_method: "approximate" | "model";
  trigger: number;
  keep: number;
  clear_at_least: number;
  clear_tool_inputs: boolean;
  exclude_tools: string[];
  placeholder: string;
}

interface ContextEditingConfigCardProps {
  enabled: boolean;
  config: ContextEditingConfig;
  onEnabledChange: (enabled: boolean) => void;
  onConfigChange: (config: Partial<ContextEditingConfig>) => void;
}

const DEFAULT_CONFIG: ContextEditingConfig = {
  token_count_method: "approximate",
  trigger: 100000,
  keep: 3,
  clear_at_least: 0,
  clear_tool_inputs: false,
  exclude_tools: [],
  placeholder: "[cleared]",
};

export function ContextEditingConfigCard({
  enabled,
  config,
  onEnabledChange,
  onConfigChange,
}: ContextEditingConfigCardProps) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const [toolInput, setToolInput] = useState("");

  const handleAddTool = (tool: string) => {
    if (tool && !cfg.exclude_tools.includes(tool)) {
      onConfigChange({ exclude_tools: [...cfg.exclude_tools, tool] });
    }
    setToolInput("");
  };

  const handleRemoveTool = (tool: string) => {
    onConfigChange({
      exclude_tools: cfg.exclude_tools.filter((t) => t !== tool),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              ✂️ 上下文裁剪
            </CardTitle>
            <CardDescription>
              自动清理超长的工具输出，保持上下文可控
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-5">
          {/* Token 计数方式 */}
          <div className="space-y-2">
            <Label>Token 计数方式</Label>
            <Select
              value={cfg.token_count_method}
              onValueChange={(v) =>
                onConfigChange({
                  token_count_method: v as "approximate" | "model",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approximate">
                  <div className="flex flex-col items-start">
                    <span>⚡ 快速估算</span>
                    <span className="text-xs text-muted-foreground">
                      速度快，精度约 90%
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="model">
                  <div className="flex flex-col items-start">
                    <span>🎯 精确计数</span>
                    <span className="text-xs text-muted-foreground">
                      调用 tokenizer，更准确
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 工具结果清理配置 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">工具结果清理</h4>

            {/* 触发阈值 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>触发阈值</Label>
                <span className="text-sm font-mono">
                  {cfg.trigger.toLocaleString()} tokens
                </span>
              </div>
              <Slider
                min={10000}
                max={500000}
                step={10000}
                value={[cfg.trigger]}
                onValueChange={([v]) => onConfigChange({ trigger: v })}
              />
              <p className="text-xs text-muted-foreground">
                超过此 token 数时触发清理
              </p>
            </div>

            {/* 保留最近 N 个 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>保留最近</Label>
                <span className="text-sm font-mono">{cfg.keep} 个</span>
              </div>
              <Slider
                min={0}
                max={20}
                step={1}
                value={[cfg.keep]}
                onValueChange={([v]) => onConfigChange({ keep: v })}
              />
              <p className="text-xs text-muted-foreground">
                不清理最近 N 个工具结果
              </p>
            </div>

            {/* 清理工具输入 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>清理工具输入</Label>
                <p className="text-xs text-muted-foreground">
                  同时清理工具调用的参数
                </p>
              </div>
              <Switch
                checked={cfg.clear_tool_inputs}
                onCheckedChange={(v) => onConfigChange({ clear_tool_inputs: v })}
              />
            </div>

            {/* 排除工具 */}
            <div className="space-y-2">
              <Label>排除工具</Label>
              <div className="flex flex-wrap gap-2">
                {cfg.exclude_tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="gap-1">
                    {tool}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTool(tool)}
                    />
                  </Badge>
                ))}
                <Input
                  placeholder="输入工具名后回车"
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && toolInput) {
                      handleAddTool(toolInput);
                    }
                  }}
                  className="h-7 w-40 text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                这些工具的输出不会被清理
              </p>
            </div>

            {/* 占位符 */}
            <div className="space-y-2">
              <Label>清理后占位符</Label>
              <Input
                value={cfg.placeholder}
                onChange={(e) => onConfigChange({ placeholder: e.target.value })}
                placeholder="[cleared]"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
