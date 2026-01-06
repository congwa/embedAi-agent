"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  Check,
  X,
  Database,
  FileText,
  AlertCircle,
} from "lucide-react";
import { PageHeader, DataTablePagination } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getFAQEntries,
  createFAQEntry,
  updateFAQEntry,
  deleteFAQEntry,
  importFAQ,
  rebuildFAQIndex,
  getAgents,
  type FAQEntry,
  type Agent,
} from "@/lib/api/agents";

function StatusBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
      <Check className="mr-1 h-3 w-3" />
      启用
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-zinc-100 text-zinc-500">
      <X className="mr-1 h-3 w-3" />
      禁用
    </Badge>
  );
}

function VectorBadge({ vectorId }: { vectorId: string | null }) {
  return vectorId ? (
    <Badge variant="outline" className="border-green-300 text-green-600">
      <Database className="mr-1 h-3 w-3" />
      已嵌入
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-300 text-amber-600">
      <AlertCircle className="mr-1 h-3 w-3" />
      未嵌入
    </Badge>
  );
}

export default function FAQPage() {
  const [entries, setEntries] = useState<FAQEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // 编辑状态
  const [editingEntry, setEditingEntry] = useState<FAQEntry | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 导入状态
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importAgentId, setImportAgentId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // 重建索引状态
  const [isRebuilding, setIsRebuilding] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    tags: "",
    source: "",
    priority: 0,
    enabled: true,
    agent_id: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [entriesData, agentsData] = await Promise.all([
        getFAQEntries({
          skip: (page - 1) * pageSize,
          limit: pageSize,
          agent_id: selectedAgent !== "all" ? selectedAgent : undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        }),
        getAgents({ limit: 100 }),
      ]);
      setEntries(entriesData);
      setAgents(agentsData.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedAgent, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取分类列表
  const categories = [...new Set(entries.map((e) => e.category).filter(Boolean))] as string[];

  // 过滤后的条目
  const filteredEntries = entries.filter((entry) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.question.toLowerCase().includes(q) ||
        entry.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // 统计数据
  const totalCount = entries.length;
  const embeddedCount = entries.filter((e) => e.vector_id).length;
  const notEmbeddedCount = totalCount - embeddedCount;

  const handleCreate = () => {
    setIsCreating(true);
    setEditingEntry(null);
    setFormData({
      question: "",
      answer: "",
      category: "",
      tags: "",
      source: "",
      priority: 0,
      enabled: true,
      agent_id: "",
    });
    setIsSheetOpen(true);
  };

  const handleEdit = (entry: FAQEntry) => {
    setIsCreating(false);
    setEditingEntry(entry);
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
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    try {
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

      if (isCreating) {
        await createFAQEntry(data);
      } else if (editingEntry) {
        await updateFAQEntry(editingEntry.id, data);
      }
      setIsSheetOpen(false);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("确定要删除这条 FAQ 吗？")) return;
    try {
      await deleteFAQEntry(entryId);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const lines = importText.trim().split("\n");
      const entries = lines.map((line) => {
        const [question, answer, category] = line.split("\t");
        return {
          question: question?.trim() || "",
          answer: answer?.trim() || "",
          category: category?.trim() || undefined,
        };
      }).filter((e) => e.question && e.answer);

      if (entries.length === 0) {
        setError("没有有效的导入数据");
        return;
      }

      const result = await importFAQ({
        agent_id: importAgentId || undefined,
        entries,
        rebuild_index: true,
      });

      alert(`导入完成：成功 ${result.imported_count} 条，跳过 ${result.skipped_count} 条`);
      if (result.errors.length > 0) {
        console.error("导入错误:", result.errors);
      }
      setIsImportSheetOpen(false);
      setImportText("");
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRebuildIndex = async () => {
    if (!confirm("确定要重建 FAQ 索引吗？这可能需要一些时间。")) return;
    try {
      setIsRebuilding(true);
      await rebuildFAQIndex(selectedAgent !== "all" ? selectedAgent : undefined);
      alert("索引重建完成");
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "重建索引失败");
    } finally {
      setIsRebuilding(false);
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="FAQ 管理" description="FAQ 数据运营工作台" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportSheetOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleRebuildIndex} disabled={isRebuilding}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRebuilding ? "animate-spin" : ""}`} />
            重建索引
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新建
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setError(null)}>
            关闭
          </Button>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">总条数</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <FileText className="h-8 w-8 text-zinc-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">已嵌入</p>
                <p className="text-2xl font-bold text-green-600">{embeddedCount}</p>
              </div>
              <Database className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">未嵌入</p>
                <p className="text-2xl font-bold text-amber-600">{notEmbeddedCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">分类数</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-zinc-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="搜索问题或答案..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择 Agent" />
              </SelectTrigger>
              <SelectContent>
                {/* SelectItem 不能使用空字符串作为 value，因为 Radix UI 使用空字符串来清空选择 */}
                <SelectItem value="all">全部 Agent</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {/* SelectItem 不能使用空字符串作为 value，因为 Radix UI 使用空字符串来清空选择 */}
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ 列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">问题</TableHead>
                <TableHead>答案</TableHead>
                <TableHead className="w-[100px]">分类</TableHead>
                <TableHead className="w-[80px]">优先级</TableHead>
                <TableHead className="w-[80px]">状态</TableHead>
                <TableHead className="w-[100px]">嵌入</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="line-clamp-2">{entry.question}</div>
                  </TableCell>
                  <TableCell>
                    <div className="line-clamp-2 text-zinc-500">{entry.answer}</div>
                  </TableCell>
                  <TableCell>
                    {entry.category && (
                      <Badge variant="outline">{entry.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{entry.priority}</TableCell>
                  <TableCell>
                    <StatusBadge enabled={entry.enabled} />
                  </TableCell>
                  <TableCell>
                    <VectorBadge vectorId={entry.vector_id} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑 Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{isCreating ? "新建 FAQ" : "编辑 FAQ"}</SheetTitle>
            <SheetDescription>
              {isCreating ? "创建一个新的 FAQ 条目" : "修改 FAQ 条目信息"}
            </SheetDescription>
          </SheetHeader>
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
              <Select
                value={formData.agent_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, agent_id: v === "none" ? "" : v })}
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
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 导入 Sheet */}
      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
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
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsImportSheetOpen(false)}>
                取消
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? "导入中..." : "开始导入"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
