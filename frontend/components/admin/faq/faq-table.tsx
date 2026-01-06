"use client";

import { Edit, Trash2, Check, X, Database, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FAQEntry } from "@/lib/api/agents";

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

interface FAQTableProps {
  entries: FAQEntry[];
  onEdit: (entry: FAQEntry) => void;
  onDelete: (entryId: string) => void;
}

export function FAQTable({ entries, onEdit, onDelete }: FAQTableProps) {
  const handleDelete = (entryId: string) => {
    if (confirm("确定要删除这条 FAQ 吗？")) {
      onDelete(entryId);
    }
  };

  return (
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
            {entries.map((entry) => (
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
                      onClick={() => onEdit(entry)}
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
            {entries.length === 0 && (
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
  );
}
