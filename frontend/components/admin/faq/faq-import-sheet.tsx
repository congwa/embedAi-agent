"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent, FAQImportResponse } from "@/lib/api/agents";

interface FAQImportSheetProps {
  open: boolean;
  agents: Agent[];
  onClose: () => void;
  onImport: (data: {
    agent_id?: string;
    entries: Array<{
      question: string;
      answer: string;
      category?: string;
    }>;
    rebuild_index?: boolean;
  }) => Promise<FAQImportResponse>;
}

export function FAQImportSheet({
  open,
  agents,
  onClose,
  onImport,
}: FAQImportSheetProps) {
  const [importText, setImportText] = useState("");
  const [importAgentId, setImportAgentId] = useState("");
  const [rebuildIndex, setRebuildIndex] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<FAQImportResponse | null>(null);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setResult(null);

      const lines = importText.trim().split("\n");
      const entries = lines
        .map((line) => {
          const [question, answer, category] = line.split("\t");
          return {
            question: question?.trim() || "",
            answer: answer?.trim() || "",
            category: category?.trim() || undefined,
          };
        })
        .filter((e) => e.question && e.answer);

      if (entries.length === 0) {
        alert("没有有效的导入数据");
        return;
      }

      const importResult = await onImport({
        agent_id: importAgentId || undefined,
        entries,
        rebuild_index: rebuildIndex,
      });

      setResult(importResult);

      if (importResult.errors.length === 0) {
        setTimeout(() => {
          onClose();
          setImportText("");
          setResult(null);
        }, 2000);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportText("");
    setResult(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>批量导入 FAQ</SheetTitle>
          <SheetDescription>
            每行一条记录，使用 Tab 分隔：问题\t答案\t分类（可选）
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label>绑定 Agent（可选）</Label>
            <Select
              value={importAgentId || "none"}
              onValueChange={(v) => setImportAgentId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择 Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">全局共享</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>导入数据</Label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`问题1\t答案1\t分类1\n问题2\t答案2\t分类2`}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rebuildIndex"
              checked={rebuildIndex}
              onChange={(e) => setRebuildIndex(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="rebuildIndex">导入后重建嵌入索引</Label>
          </div>

          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.errors.length > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              <p className="font-medium">
                导入完成：成功 {result.imported_count} 条，跳过 {result.skipped_count} 条
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 text-sm">
                  <p>错误 ({result.errors.length}):</p>
                  <ul className="list-inside list-disc">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...还有 {result.errors.length - 5} 个错误</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !importText.trim()}>
              {isImporting ? "导入中..." : "开始导入"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
