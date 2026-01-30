"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  completeEssentialSetup,
  type EssentialSetupRequest,
  type QuickSetupState,
} from "@/lib/api/quick-setup";

import { ModeSelectStep } from "./ModeSelectStep";
import { ApiConfigStep } from "./ApiConfigStep";
import { DatabaseCheckStep } from "./DatabaseCheckStep";
import { AgentConfirmStep } from "./AgentConfirmStep";

const STEPS = [
  { key: "mode", title: "选择模式", description: "选择系统运行模式" },
  { key: "api", title: "API 配置", description: "配置 LLM 服务" },
  { key: "database", title: "数据库", description: "检查数据库连接" },
  { key: "agent", title: "确认 Agent", description: "创建默认 Agent" },
];

interface EssentialSetupProps {
  onComplete: (state: QuickSetupState) => void;
}

export function EssentialSetup({ onComplete }: EssentialSetupProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单数据（llm_model 留空，由 ApiConfigStep 自动选择第一个）
  const [formData, setFormData] = useState<Partial<EssentialSetupRequest>>({
    mode: "single",
    llm_provider: "siliconflow",
    llm_api_key: "",
    llm_model: "",
    embedding_model: "",
    embedding_dimension: 1536,
    embedding_api_key: "",
    embedding_base_url: "",
    agent_type: "product",
  });
  
  // Embedding 是否使用相同的 LLM 配置
  const [useSameLlmConfig, setUseSameLlmConfig] = useState(true);
  
  // API 测试状态
  const [llmTestPassed, setLlmTestPassed] = useState(false);
  const [embeddingTestPassed, setEmbeddingTestPassed] = useState(false);

  // 数据库配置
  const [qdrantHost, setQdrantHost] = useState("localhost");
  const [qdrantPort, setQdrantPort] = useState(6333);
  const [databaseVerified, setDatabaseVerified] = useState(false);

  const updateFormData = (data: Partial<EssentialSetupRequest>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setError(null);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!formData.llm_api_key) {
      setError("请输入 API Key");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await completeEssentialSetup(formData as EssentialSetupRequest);

      if (response.success && response.state) {
        onComplete(response.state);
      } else {
        setError(response.message || "配置失败");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "配置失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // mode
        return !!formData.mode;
      case 1: // api - 必须两个测试都通过
        return !!formData.llm_provider && 
               !!formData.llm_api_key && 
               !!formData.llm_model && 
               !!formData.embedding_model &&
               !!formData.embedding_dimension &&
               llmTestPassed && 
               embeddingTestPassed;
      case 2: // database
        return databaseVerified;
      case 3: // agent
        return !!formData.agent_type;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModeSelectStep
            value={formData.mode || "single"}
            onChange={(mode: "single" | "supervisor") => updateFormData({ mode })}
          />
        );
      case 1:
        return (
          <ApiConfigStep
            provider={formData.llm_provider || "siliconflow"}
            apiKey={formData.llm_api_key || ""}
            model={formData.llm_model || ""}
            baseUrl={formData.llm_base_url}
            embeddingModel={formData.embedding_model || ""}
            embeddingDimension={formData.embedding_dimension || 1536}
            embeddingApiKey={formData.embedding_api_key}
            embeddingBaseUrl={formData.embedding_base_url}
            useSameLlmConfig={useSameLlmConfig}
            onProviderChange={(provider: string) => updateFormData({ llm_provider: provider })}
            onApiKeyChange={(apiKey: string) => updateFormData({ llm_api_key: apiKey })}
            onModelChange={(model: string) => updateFormData({ llm_model: model })}
            onBaseUrlChange={(baseUrl: string) => updateFormData({ llm_base_url: baseUrl })}
            onEmbeddingModelChange={(model: string) => updateFormData({ embedding_model: model })}
            onEmbeddingDimensionChange={(dimension: number) => updateFormData({ embedding_dimension: dimension })}
            onEmbeddingApiKeyChange={(apiKey: string) => updateFormData({ embedding_api_key: apiKey })}
            onEmbeddingBaseUrlChange={(baseUrl: string) => updateFormData({ embedding_base_url: baseUrl })}
            onUseSameLlmConfigChange={setUseSameLlmConfig}
            onLlmTestStatusChange={setLlmTestPassed}
            onEmbeddingTestStatusChange={setEmbeddingTestPassed}
          />
        );
      case 2:
        return (
          <DatabaseCheckStep
            qdrantHost={qdrantHost}
            qdrantPort={qdrantPort}
            onHostChange={setQdrantHost}
            onPortChange={setQdrantPort}
            onConnectionVerified={setDatabaseVerified}
          />
        );
      case 3:
        return (
          <AgentConfirmStep
            agentType={formData.agent_type || "product"}
            agentName={formData.agent_name}
            onAgentTypeChange={(type: "product" | "faq" | "kb" | "custom") => updateFormData({ agent_type: type })}
            onAgentNameChange={(name: string) => updateFormData({ agent_name: name })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-600/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-zinc-800/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold">
              E
            </div>
            <div>
              <h1 className="font-semibold text-white">EmbedeaseAi</h1>
              <p className="text-xs text-zinc-500">快速开始</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="relative z-10 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                      index < currentStep
                        ? "bg-emerald-500 text-white"
                        : index === currentStep
                          ? "bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/30"
                          : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      index <= currentStep ? "text-white" : "text-zinc-500"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-24 h-0.5 mx-4 transition-colors",
                      index < currentStep ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 p-6 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            className="text-zinc-400 hover:text-white"
          >
            上一步
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-8"
            >
              下一步
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  配置中...
                </>
              ) : (
                <>
                  完成配置
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
