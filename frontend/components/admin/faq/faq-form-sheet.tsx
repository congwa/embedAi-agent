"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FAQEntry, Agent } from "@/lib/api/agents";

interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  tags: string;
  source: string;
  priority: number;
  enabled: boolean;
  agent_id: string;
}

interface FAQFormSheetProps {
  open: boolean;
  entry: FAQEntry | null;
  agents: Agent[];
  onClose: () => void;
  onSave: (data: Partial<FAQEntry>) => Promise<{ merged?: boolean; target_id?: string | null }>;
  /** 初始问题（用于从会话/聊天页面预填） */
  initialQuestion?: string;
  /** 初始答案（用于从会话/聊天页面预填） */
  initialAnswer?: string;
  /** 初始来源（如 chat:xxx 或 conversation:xxx） */
  initialSource?: string;
  /** 初始 Agent ID（用于锁定 Agent） */
  initialAgentId?: string;
  /** 是否锁定 Agent 选择（从会话/聊天入口时不允许修改） */
  readOnlyAgent?: boolean;
}

export function FAQFormSheet({
  open,
  entry,
  agents,
  onClose,
  onSave,
  initialQuestion,
  initialAnswer,
  initialSource,
  initialAgentId,
  readOnlyAgent,
}: FAQFormSheetProps) {
  const isCreating = !entry;
  const [isSaving, setIsSaving] = useState(false);
  const [mergeResult, setMergeResult] = useState<{ merged: boolean; target_id: string | null } | null>(null);
  const [formData, setFormData] = useState<FAQFormData>({
    question: "",
    answer: "",
    category: "",
    tags: "",
    source: "",
    priority: 0,
    enabled: true,
    agent_id: "",
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        question: entry.question,
        answer: entry.answer,
        category: entry.category || "",
        tags: entry.tags?.join(", ") || "",
        source: entry.source || "",
        priority: entry.priority,
        enabled: entry.enabled,
        agent_id: entry.agent_id || "",
      });
    } else {
      // 使用预填值或默认值
      setFormData({
        question: initialQuestion || "",
        answer: initialAnswer || "",
        category: "",
        tags: "",
        source: initialSource || "",
        priority: 0,
        enabled: true,
        agent_id: initialAgentId || "",
      });
    }
    setMergeResult(null);
  }, [entry, initialQuestion, initialAnswer, initialSource, initialAgentId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const data = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : null,
        source: formData.source || null,
        priority: formData.priority,
        enabled: formData.enabled,
        agent_id: formData.agent_id || null,
      };
      const result = await onSave(data);
      if (result?.merged !== undefined) {
        setMergeResult({ merged: result.merged, target_id: result.target_id || null });
        // 显示结果后短暂延迟再关闭
        setTimeout(() => {
          onClose();
          setMergeResult(null);
        }, 1500);
      } else {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>{isCreating ? "新建 FAQ" : "编辑 FAQ"}</SheetTitle>
          <SheetDescription>
            {isCreating ? "创建一个新的 FAQ 条目" : "修改 FAQ 条目信息"}
          </SheetDescription>
        </SheetHeader>
        {/* 合并结果提示 */}
        {mergeResult && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${
            mergeResult.merged 
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
              : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          }`}>
            {mergeResult.merged 
              ? `✓ 已自动合并到 FAQ #${mergeResult.target_id?.slice(0, 8)}...` 
              : "✓ 新建 FAQ 成功"}
          </div>
        )}
        <div className="mt-6 space-y-4">
          <div>
            <Label>问题 *</Label>
            <Textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="输入问题"
              rows={3}
            />
          </div>
          <div>
            <Label>答案 *</Label>
            <Textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="输入答案"
              rows={5}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>分类</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="分类名称"
              />
            </div>
            <div>
              <Label>优先级</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div>
            <Label>标签（逗号分隔）</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div>
            <Label>来源</Label>
            <Input
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="数据来源"
            />
          </div>
          <div>
            <Label>绑定 Agent</Label>
            {readOnlyAgent && formData.agent_id ? (
              <Input
                value={agents.find((a) => a.id === formData.agent_id)?.name || formData.agent_id}
                disabled
                className="bg-zinc-100 dark:bg-zinc-800"
              />
            ) : (
              <Select
                value={formData.agent_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, agent_id: v === "none" ? "" : v })}
                disabled={readOnlyAgent}
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
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="enabled">启用</Label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
