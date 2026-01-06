"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface AgentFilters {
  status?: string;
  type?: string;
  searchQuery?: string;
}

interface AgentFilterBarProps {
  filters: AgentFilters;
  onFilterChange: (filters: AgentFilters) => void;
}

export function AgentFilterBar({ filters, onFilterChange }: AgentFilterBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="搜索 Agent..."
                value={filters.searchQuery || ""}
                onChange={(e) =>
                  onFilterChange({ ...filters, searchQuery: e.target.value })
                }
                className="pl-9"
              />
            </div>
          </div>
          <Select
            value={filters.type || "all"}
            onValueChange={(v) =>
              onFilterChange({ ...filters, type: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="product">商品推荐</SelectItem>
              <SelectItem value="faq">FAQ 问答</SelectItem>
              <SelectItem value="kb">知识库</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) =>
              onFilterChange({ ...filters, status: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="enabled">启用</SelectItem>
              <SelectItem value="disabled">禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
