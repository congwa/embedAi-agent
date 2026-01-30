"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  AlertCircle,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getSetupState,
  resetSetupState,
  completeStep,
  skipStep,
  gotoStep,
  getAgentTypes,
  type QuickSetupState,
  type SetupStep,
  type AgentTypeConfig,
  type SetupLevel,
} from "@/lib/api/quick-setup";
import { useSetupGuard } from "@/components/providers/setup-guard-provider";
import { EssentialSetup } from "./components/EssentialSetup";

import { WelcomeStep } from "./steps/welcome-step";
import { ModeStep } from "./steps/mode-step";
import { SystemStep } from "./steps/system-step";
import { ModelsStep } from "./steps/models-step";
import { AgentTypeStep } from "./steps/agent-type-step";
import { KnowledgeStep } from "./steps/knowledge-step";
import { GreetingStep } from "./steps/greeting-step";
import { ChannelStep } from "./steps/channel-step";
import { SummaryStep } from "./steps/summary-step";
import { SupervisorStep } from "./steps/supervisor-step";
import type { StepProps } from "@/types/quick-setup";

const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
  welcome: WelcomeStep,
  mode: ModeStep,
  system: SystemStep,
  models: ModelsStep,
  "agent-type": AgentTypeStep,
  knowledge: KnowledgeStep,
  greeting: GreetingStep,
  channel: ChannelStep,
  summary: SummaryStep,
  supervisor: SupervisorStep,
};

export type { StepProps } from "@/types/quick-setup";

function StepIndicator({
  step,
  index,
  isActive,
  isPast,
  onClick,
}: {
  step: SetupStep;
  index: number;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
}) {
  const isCompleted = step.status === "completed";
  const isSkipped = step.status === "skipped";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/5"
          : "hover:bg-white/5 border border-transparent",
        isCompleted && !isActive && "opacity-80"
      )}
    >
      <div
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
          isCompleted
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
            : isActive
              ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/30"
              : isSkipped
                ? "bg-zinc-700 text-zinc-400"
                : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700"
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" />
        ) : isSkipped ? (
          <SkipForward className="h-3.5 w-3.5" />
        ) : (
          <span>{index + 1}</span>
        )}
        {isActive && (
          <span className="absolute inset-0 rounded-full animate-ping bg-violet-500/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium truncate transition-colors",
            isActive
              ? "text-white"
              : isCompleted
                ? "text-zinc-300"
                : isSkipped
                  ? "text-zinc-500"
                  : "text-zinc-400 group-hover:text-zinc-300"
          )}
        >
          {step.title}
        </div>
      </div>
    </button>
  );
}

export default function QuickSetupPage() {
  const router = useRouter();
  const { refreshSetupState } = useSetupGuard();
  const [state, setState] = useState<QuickSetupState | null>(null);
  const [agentTypes, setAgentTypes] = useState<AgentTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMode, setShowMode] = useState<"essential" | "full">("essential");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [stateData, typesData] = await Promise.all([
        getSetupState(),
        getAgentTypes(),
      ]);
      setState(stateData);
      setAgentTypes(typesData);
      
      // 根据状态决定显示模式
      if (stateData.essential_completed || stateData.setup_level !== "none") {
        setShowMode("full");
      } else {
        setShowMode("essential");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = async (data?: Record<string, unknown>) => {
    if (!state) return;
    try {
      setIsActioning(true);
      const newState = await completeStep(state.current_step, data);
      setState(newState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setIsActioning(false);
    }
  };

  const handleSkip = async () => {
    if (!state) return;
    try {
      setIsActioning(true);
      const newState = await skipStep(state.current_step);
      setState(newState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setIsActioning(false);
    }
  };

  const handleGoto = async (index: number) => {
    try {
      setIsActioning(true);
      const newState = await gotoStep(index);
      setState(newState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setIsActioning(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsActioning(true);
      const newState = await resetSetupState();
      setState(newState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "重置失败");
    } finally {
      setIsActioning(false);
    }
  };

  const handlePrev = () => {
    if (state && state.current_step > 0) {
      handleGoto(state.current_step - 1);
    }
  };

  const handleNext = () => {
    if (state && state.current_step < state.steps.length - 1) {
      handleGoto(state.current_step + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-violet-400" />
          </div>
          <p className="text-sm text-zinc-500 animate-pulse">正在加载配置向导...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">加载失败</h2>
            <p className="text-zinc-400">{error}</p>
          </div>
          <Button onClick={loadData} className="bg-white text-zinc-900 hover:bg-zinc-100">
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (!state) return null;

  // 精简模式：首次用户（未完成精简配置）
  if (showMode === "essential") {
    return (
      <EssentialSetup
        onComplete={async (newState) => {
          setState(newState);
          // 刷新 SetupGuardProvider 的状态，避免被重定向回来
          await refreshSetupState?.();
          router.push("/admin");
        }}
      />
    );
  }

  const currentStep = state.steps[state.current_step];
  const StepComponent = STEP_COMPONENTS[currentStep.key];
  const completedCount = state.steps.filter((s) => s.status === "completed").length;
  const progress = ((state.current_step + 1) / state.steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-600/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      </div>

      <div className="relative h-full flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-80 border-r border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 blur-lg opacity-50" />
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                  E
                </div>
              </div>
              <div>
                <h1 className="font-semibold text-white">EmbedeaseAi</h1>
                <p className="text-xs text-zinc-500">配置向导</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                步骤 {state.current_step + 1} / {state.steps.length}
              </span>
              <span className="text-emerald-400 font-medium">
                {completedCount} 已完成
              </span>
            </div>
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {state.steps.map((step, idx) => (
              <StepIndicator
                key={step.index}
                step={step}
                index={idx}
                isActive={step.index === state.current_step}
                isPast={step.index < state.current_step}
                onClick={() => handleGoto(step.index)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              重新开始
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <span className="font-medium text-white">快速配置</span>
              </div>
              <span className="text-xs text-zinc-500">
                {state.current_step + 1} / {state.steps.length}
              </span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-4xl mx-auto">
              {StepComponent ? (
                <StepComponent
                  step={currentStep}
                  state={state}
                  agentTypes={agentTypes}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onGoto={handleGoto}
                  isLoading={isActioning}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">
                  步骤组件未找到: {currentStep.key}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Footer */}
          {state.current_step < state.steps.length - 1 && (
            <div className="p-4 lg:p-6 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={state.current_step === 0 || isActioning}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  上一步
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isActioning}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    跳过此步
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isActioning}
                    className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 px-6"
                  >
                    继续
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
