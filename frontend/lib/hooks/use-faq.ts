"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getFAQEntries,
  createFAQEntry,
  updateFAQEntry,
  deleteFAQEntry,
  importFAQ,
  rebuildFAQIndex,
  type FAQEntry,
  type FAQImportResponse,
} from "@/lib/api/agents";

interface FAQFilters {
  agentId?: string;
  category?: string;
  searchQuery?: string;
}

interface FAQStats {
  total: number;
  embedded: number;
  notEmbedded: number;
  categories: string[];
}

interface UseFAQOptions {
  agentId?: string;
  category?: string;
  pageSize?: number;
  autoLoad?: boolean;
}

interface UseFAQReturn {
  entries: FAQEntry[];
  filteredEntries: FAQEntry[];
  stats: FAQStats;
  isLoading: boolean;
  error: string | null;
  filters: FAQFilters;
  setFilters: (filters: FAQFilters) => void;
  page: number;
  setPage: (page: number) => void;
  loadData: () => Promise<void>;
  createEntry: (data: Partial<FAQEntry>) => Promise<FAQEntry>;
  updateEntry: (id: string, data: Partial<FAQEntry>) => Promise<FAQEntry>;
  deleteEntry: (id: string) => Promise<void>;
  importEntries: (data: {
    agent_id?: string;
    entries: Array<{
      question: string;
      answer: string;
      category?: string;
    }>;
    rebuild_index?: boolean;
  }) => Promise<FAQImportResponse>;
  rebuildIndex: (agentId?: string) => Promise<void>;
  isRebuilding: boolean;
}

export function useFAQ(options: UseFAQOptions = {}): UseFAQReturn {
  const { agentId, category, pageSize = 20, autoLoad = true } = options;

  const [entries, setEntries] = useState<FAQEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FAQFilters>({
    agentId,
    category,
    searchQuery: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getFAQEntries({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        agent_id: filters.agentId !== "all" ? filters.agentId : undefined,
        category: filters.category !== "all" ? filters.category : undefined,
      });
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载 FAQ 失败");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters.agentId, filters.category]);

  const filteredEntries = useMemo(() => {
    if (!filters.searchQuery) return entries;
    const q = filters.searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.question.toLowerCase().includes(q) ||
        entry.answer.toLowerCase().includes(q)
    );
  }, [entries, filters.searchQuery]);

  const stats = useMemo<FAQStats>(() => {
    const embedded = entries.filter((e) => e.vector_id).length;
    const categories = [
      ...new Set(entries.map((e) => e.category).filter(Boolean)),
    ] as string[];
    return {
      total: entries.length,
      embedded,
      notEmbedded: entries.length - embedded,
      categories,
    };
  }, [entries]);

  const createEntry = useCallback(
    async (data: Partial<FAQEntry>) => {
      const result = await createFAQEntry(data);
      await loadData();
      return result;
    },
    [loadData]
  );

  const updateEntry = useCallback(
    async (id: string, data: Partial<FAQEntry>) => {
      const result = await updateFAQEntry(id, data);
      await loadData();
      return result;
    },
    [loadData]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await deleteFAQEntry(id);
      await loadData();
    },
    [loadData]
  );

  const importEntries = useCallback(
    async (data: Parameters<typeof importFAQ>[0]) => {
      const result = await importFAQ(data);
      await loadData();
      return result;
    },
    [loadData]
  );

  const rebuildIndex = useCallback(
    async (targetAgentId?: string) => {
      try {
        setIsRebuilding(true);
        await rebuildFAQIndex(targetAgentId);
        await loadData();
      } finally {
        setIsRebuilding(false);
      }
    },
    [loadData]
  );

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    entries,
    filteredEntries,
    stats,
    isLoading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    loadData,
    createEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    rebuildIndex,
    isRebuilding,
  };
}
