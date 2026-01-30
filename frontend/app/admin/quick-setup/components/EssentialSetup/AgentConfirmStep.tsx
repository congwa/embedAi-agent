"use client";

import { ShoppingBag, HelpCircle, BookOpen, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AgentType = "product" | "faq" | "kb" | "custom";

interface AgentConfirmStepProps {
  agentType: AgentType;
  agentName?: string;
  onAgentTypeChange: (type: AgentType) => void;
  onAgentNameChange: (name: string) => void;
}

const AGENT_TYPES = [
  {
    id: "product" as const,
    name: "商品推荐",
    description: "智能搜索、预算筛选、商品对比",
    icon: ShoppingBag,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "faq" as const,
    name: "FAQ 问答",
    description: "快速匹配预设问答对",
    icon: HelpCircle,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "kb" as const,
    name: "知识库",
    description: "文档检索与语义搜索",
    icon: BookOpen,
    color: "from-green-500 to-emerald-500",
  },
  // {
  //   id: "custom" as const,
  //   name: "自定义",
  //   description: "完全自定义配置",
  //   icon: Wrench,
  //   color: "from-violet-500 to-purple-500",
  // },
];

export function AgentConfirmStep({
  agentType,
  agentName,
  onAgentTypeChange,
  onAgentNameChange,
}: AgentConfirmStepProps) {
  const selectedType = AGENT_TYPES.find((t) => t.id === agentType);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">创建默认 Agent</h2>
        <p className="text-zinc-400">选择 Agent 类型，系统将自动创建</p>
      </div>

      {/* Agent Type Grid */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {AGENT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = agentType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onAgentTypeChange(type.id)}
              className={cn(
                "relative p-5 rounded-xl border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                  isSelected
                    ? `bg-gradient-to-br ${type.color} text-white`
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h3 className={cn("font-semibold mb-1", isSelected ? "text-white" : "text-zinc-200")}>
                {type.name}
              </h3>
              <p className="text-xs text-zinc-500">{type.description}</p>

              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Agent Name (Optional) */}
      <div className="max-w-md mx-auto space-y-2 pt-4">
        <Label className="text-zinc-300">Agent 名称（可选）</Label>
        <Input
          value={agentName || ""}
          onChange={(e) => onAgentNameChange(e.target.value)}
          placeholder={`默认${selectedType?.name || ""}助手`}
          className="bg-zinc-900 border-zinc-800 text-white"
        />
        <p className="text-xs text-zinc-500">留空将使用默认名称</p>
      </div>

      {/* Summary */}
      <div className="max-w-md mx-auto mt-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-300 mb-2">即将创建</h4>
        <div className="flex items-center gap-3">
          {selectedType && (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br", selectedType.color)}>
              <selectedType.icon className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <p className="text-white font-medium">
              {agentName || `默认${selectedType?.name || ""}助手`}
            </p>
            <p className="text-xs text-zinc-500">{selectedType?.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
