"use client";

import { FileText, Database, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FAQStats {
  total: number;
  embedded: number;
  notEmbedded: number;
  categories: string[];
}

interface FAQStatsCardsProps {
  stats: FAQStats;
}

export function FAQStatsCards({ stats }: FAQStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">总条数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
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
            <HelpCircle className="h-8 w-8 text-zinc-300" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
