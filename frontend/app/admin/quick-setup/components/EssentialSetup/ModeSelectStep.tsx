"use client";

import { Bot, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectStepProps {
  value: "single" | "supervisor";
  onChange: (mode: "single" | "supervisor") => void;
}

const MODES = [
  {
    id: "single" as const,
    title: "单 Agent 模式",
    description: "一个智能助手处理所有对话，适合大多数场景",
    icon: Bot,
    recommended: true,
  },
  {
    id: "supervisor" as const,
    title: "多 Agent 编排",
    description: "主 Agent 调度多个专业 Agent，适合复杂业务",
    icon: Network,
    recommended: false,
  },
];

export function ModeSelectStep({ value, onChange }: ModeSelectStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">选择运行模式</h2>
        <p className="text-zinc-400">选择适合您业务场景的模式，后续可以更改</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-8">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={cn(
                "relative p-6 rounded-2xl border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"
              )}
            >
              {mode.recommended && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-xs font-medium bg-emerald-500 text-white rounded-full">
                  推荐
                </span>
              )}

              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  isSelected
                    ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h3 className={cn("text-lg font-semibold mb-1", isSelected ? "text-white" : "text-zinc-200")}>
                {mode.title}
              </h3>
              <p className="text-sm text-zinc-400">{mode.description}</p>

              {isSelected && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  );
}
