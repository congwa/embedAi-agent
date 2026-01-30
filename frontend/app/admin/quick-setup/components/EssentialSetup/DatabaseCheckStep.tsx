"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, Database, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkQdrantConnection } from "@/lib/api/quick-setup";

interface DatabaseCheckStepProps {
  qdrantHost: string;
  qdrantPort: number;
  onHostChange: (host: string) => void;
  onPortChange: (port: number) => void;
  onConnectionVerified: (verified: boolean) => void;
}

export function DatabaseCheckStep({
  qdrantHost,
  qdrantPort,
  onHostChange,
  onPortChange,
  onConnectionVerified,
}: DatabaseCheckStepProps) {
  const [checkStatus, setCheckStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [latency, setLatency] = useState<number | null>(null);
  const [useCustom, setUseCustom] = useState(false);

  // 初始检查
  useEffect(() => {
    handleCheck();
  }, []);

  const handleCheck = async () => {
    setCheckStatus("checking");
    setErrorMessage("");
    setLatency(null);

    try {
      const result = await checkQdrantConnection({
        host: qdrantHost,
        port: qdrantPort,
      });

      if (result.success) {
        setCheckStatus("success");
        setLatency(result.latency_ms);
        onConnectionVerified(true);
      } else {
        setCheckStatus("error");
        setErrorMessage(result.message);
        onConnectionVerified(false);
      }
    } catch (error) {
      setCheckStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "连接检查失败");
      onConnectionVerified(false);
    }
  };

  const handleHostChange = (host: string) => {
    onHostChange(host);
    setCheckStatus("idle");
    onConnectionVerified(false);
  };

  const handlePortChange = (port: string) => {
    const portNum = parseInt(port, 10);
    if (!isNaN(portNum)) {
      onPortChange(portNum);
      setCheckStatus("idle");
      onConnectionVerified(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">检查数据库连接</h2>
        <p className="text-zinc-400">确保向量数据库 Qdrant 可以正常连接</p>
      </div>

      <div className="max-w-md mx-auto space-y-6 mt-8">
        {/* 连接状态卡片 */}
        <div
          className={cn(
            "p-6 rounded-2xl border-2 transition-all",
            checkStatus === "success"
              ? "border-emerald-500 bg-emerald-500/10"
              : checkStatus === "error"
                ? "border-red-500 bg-red-500/10"
                : "border-zinc-800 bg-zinc-900/50"
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                checkStatus === "success"
                  ? "bg-emerald-500 text-white"
                  : checkStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-800 text-zinc-400"
              )}
            >
              {checkStatus === "checking" ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : checkStatus === "success" ? (
                <CheckCircle className="h-6 w-6" />
              ) : checkStatus === "error" ? (
                <XCircle className="h-6 w-6" />
              ) : (
                <Database className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Qdrant 向量数据库</h3>
              <p className="text-sm text-zinc-400">
                {checkStatus === "checking"
                  ? "正在检查连接..."
                  : checkStatus === "success"
                    ? `连接成功${latency ? ` (${latency.toFixed(0)}ms)` : ""}`
                    : checkStatus === "error"
                      ? errorMessage
                      : `${qdrantHost}:${qdrantPort}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCheck}
              disabled={checkStatus === "checking"}
              className="text-zinc-400 hover:text-white"
            >
              <RefreshCw className={cn("h-4 w-4", checkStatus === "checking" && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* 自定义配置 */}
        {(checkStatus === "error" || useCustom) && (
          <div className="space-y-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">自定义 Qdrant 地址</span>
              {!useCustom && (
                <button
                  onClick={() => setUseCustom(true)}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  编辑
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-zinc-500">主机</Label>
                <Input
                  value={qdrantHost}
                  onChange={(e) => handleHostChange(e.target.value)}
                  placeholder="localhost"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">端口</Label>
                <Input
                  type="number"
                  value={qdrantPort}
                  onChange={(e) => handlePortChange(e.target.value)}
                  placeholder="6333"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <Button
              onClick={handleCheck}
              disabled={checkStatus === "checking"}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white"
            >
              {checkStatus === "checking" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  检查中...
                </>
              ) : (
                "重新检查"
              )}
            </Button>
          </div>
        )}

        {/* 提示 */}
        <p className="text-xs text-zinc-500 text-center">
          {checkStatus === "success" ? (
            "数据库连接正常，可以继续配置"
          ) : checkStatus === "error" ? (
            "请确保 Qdrant 服务已启动，或输入正确的远程地址"
          ) : (
            "Qdrant 用于存储和检索向量数据"
          )}
        </p>
      </div>
    </div>
  );
}
