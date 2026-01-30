"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getProviders, getProviderModels, type LLMProvider, type LLMModel } from "@/lib/api/quick-setup";

interface PresetModel {
  value: string;
  label: string;
  provider: string;
}

interface ModelFallbackConfigCardProps {
  enabled: boolean;
  models: string[];
  onEnabledChange: (enabled: boolean) => void;
  onModelsChange: (models: string[]) => void;
}

export function ModelFallbackConfigCard({
  enabled,
  models,
  onEnabledChange,
  onModelsChange,
}: ModelFallbackConfigCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [customModel, setCustomModel] = useState("");
  const [presetModels, setPresetModels] = useState<PresetModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // 动态加载模型列表
  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const providers = await getProviders();
        const allModels: PresetModel[] = [];
        
        // 只加载主要提供商的模型
        const mainProviders = providers.filter(p => 
          ["openai", "anthropic", "deepseek", "siliconflow"].includes(p.id)
        );
        
        for (const provider of mainProviders) {
          const providerModels = await getProviderModels(provider.id);
          for (const model of providerModels.slice(0, 5)) { // 每个提供商最多5个
            allModels.push({
              value: `${provider.id}:${model.id}`,
              label: model.name,
              provider: provider.id,
            });
          }
        }
        
        setPresetModels(allModels);
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    }
    
    loadModels();
  }, []);

  const handleAddModel = (model: string) => {
    if (model && !models.includes(model)) {
      onModelsChange([...models, model]);
    }
    setIsAdding(false);
    setCustomModel("");
  };

  const handleRemoveModel = (model: string) => {
    onModelsChange(models.filter((m) => m !== model));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newModels = [...models];
    const [removed] = newModels.splice(fromIndex, 1);
    newModels.splice(toIndex, 0, removed);
    onModelsChange(newModels);
  };

  const availablePresets = presetModels.filter((m) => !models.includes(m.value));

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              🔀 模型降级
            </CardTitle>
            <CardDescription>
              主模型失败时自动切换备用模型，提高可用性
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {/* 备选模型列表 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">备选模型（按优先级排序）</div>

            {models.length > 0 ? (
              <div className="space-y-2">
                {models.map((model, index) => (
                  <div
                    key={model}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50"
                  >
                    <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="flex-1 font-mono text-sm truncate">{model}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => handleReorder(index, index - 1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === models.length - 1}
                        onClick={() => handleReorder(index, index + 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveModel(model)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg border-dashed">
                暂无备选模型，请添加
              </div>
            )}
          </div>

          {/* 添加模型 */}
          {!isAdding ? (
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLoadingModels}>
                    {isLoadingModels ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    添加预设模型
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                  {availablePresets.length > 0 ? (
                    availablePresets.map((preset: PresetModel) => (
                      <DropdownMenuItem
                        key={preset.value}
                        onClick={() => handleAddModel(preset.value)}
                      >
                        <span className="text-xs text-muted-foreground w-20">
                          {preset.provider}
                        </span>
                        <span>{preset.label}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      {isLoadingModels ? "加载中..." : "没有更多可用模型"}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                <Plus className="h-3 w-3 mr-1" />
                自定义模型
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="provider:model_name"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customModel) {
                    handleAddModel(customModel);
                  }
                }}
                className="font-mono text-sm"
              />
              <Button size="sm" onClick={() => handleAddModel(customModel)}>
                添加
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setCustomModel("");
                }}
              >
                取消
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            主模型失败后，按顺序尝试备选模型，直到成功或全部失败
          </p>
        </CardContent>
      )}
    </Card>
  );
}
