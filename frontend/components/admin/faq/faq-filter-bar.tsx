"use client";

import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Agent } from "@/lib/api/agents";

interface FAQFilters {
  agentId?: string;
  category?: string;
  searchQuery?: string;
}

interface FAQFilterBarProps {
  agents: Agent[];
  categories: string[];
  filters: FAQFilters;
  onFilterChange: (filters: FAQFilters) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function FAQFilterBar({
  agents,
  categories,
  filters,
  onFilterChange,
  onRefresh,
  isLoading,
}: FAQFilterBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="搜索问题或答案..."
                value={filters.searchQuery || ""}
                onChange={(e) =>
                  onFilterChange({ ...filters, searchQuery: e.target.value })
                }
                className="pl-9"
              />
            </div>
          </div>
          <Select
            value={filters.agentId || "all"}
            onValueChange={(v) =>
              onFilterChange({ ...filters, agentId: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择 Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部 Agent</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) =>
              onFilterChange({ ...filters, category: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
