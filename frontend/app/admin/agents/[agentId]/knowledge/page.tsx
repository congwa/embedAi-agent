"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Database, HelpCircle, AlertCircle, ChevronRight } from "lucide-react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { useFAQ } from "@/lib/hooks/use-faq";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AgentKnowledgePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent } = useAgentDetail({ agentId });
  const { entries, stats, isLoading } = useFAQ({ agentId });

  if (!agent) return null;

  const knowledgeConfig = agent.knowledge_config;

  return (
    <div className="space-y-6">
      {/* 知识库配置 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            绑定的知识库配置
          </CardTitle>
          {knowledgeConfig && (
            <Link href={`/admin/knowledge`}>
              <Button variant="ghost" size="sm">
                查看全部
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {knowledgeConfig ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{knowledgeConfig.name}</h4>
                  <p className="text-sm text-zinc-500">
                    类型: {knowledgeConfig.type} · Top K: {knowledgeConfig.top_k}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    enabled={knowledgeConfig.rerank_enabled}
                    enabledText="Rerank"
                    disabledText="无 Rerank"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <div>
                  <p className="text-xs text-zinc-500">集合</p>
                  <code className="text-sm">
                    {knowledgeConfig.collection_name || "-"}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">数据版本</p>
                  <code className="text-sm">
                    {knowledgeConfig.data_version || "-"}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">嵌入模型</p>
                  <code className="text-sm">
                    {knowledgeConfig.embedding_model || "默认"}
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Database className="mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">未绑定知识库配置</p>
              <Link href="/admin/knowledge">
                <Button variant="outline" size="sm" className="mt-4">
                  前往配置
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ 统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">FAQ 总数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-zinc-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">已嵌入</p>
                <p className="text-2xl font-bold text-green-600">{stats.embedded}</p>
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
                <p className="text-2xl font-bold text-amber-600">{stats.notEmbedded}</p>
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
                <p className="text-2xl font-bold">{stats.categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ 列表预览 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" />
            FAQ 条目
          </CardTitle>
          <Link href={`/admin/faq?agent=${agentId}`}>
            <Button variant="ghost" size="sm">
              管理全部
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>问题</TableHead>
                <TableHead className="w-[100px]">分类</TableHead>
                <TableHead className="w-[80px]">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-zinc-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-zinc-500">
                    暂无 FAQ 条目
                  </TableCell>
                </TableRow>
              ) : (
                entries.slice(0, 5).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <div className="line-clamp-1">{entry.question}</div>
                    </TableCell>
                    <TableCell>
                      {entry.category && (
                        <Badge variant="outline">{entry.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.vector_id ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          已嵌入
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未嵌入</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
