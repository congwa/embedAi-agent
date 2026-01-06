"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getKnowledgeConfigs,
  createKnowledgeConfig,
  updateKnowledgeConfig,
  deleteKnowledgeConfig,
  type KnowledgeConfig,
} from "@/lib/api/agents";

interface KnowledgeFilters {
  type?: string;
  searchQuery?: string;
}

interface UseKnowledgeOptions {
  autoLoad?: boolean;
}

interface UseKnowledgeReturn {
  configs: KnowledgeConfig[];
  filteredConfigs: KnowledgeConfig[];
  isLoading: boolean;
  error: string | null;
  filters: KnowledgeFilters;
  setFilters: (filters: KnowledgeFilters) => void;
  loadData: () => Promise<void>;
  createConfig: (data: Partial<KnowledgeConfig>) => Promise<KnowledgeConfig>;
  updateConfig: (id: string, data: Partial<KnowledgeConfig>) => Promise<KnowledgeConfig>;
  deleteConfig: (id: string) => Promise<void>;
}

export function useKnowledge(options: UseKnowledgeOptions = {}): UseKnowledgeReturn {
  const { autoLoad = true } = options;

  const [configs, setConfigs] = useState<KnowledgeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<KnowledgeFilters>({
    type: "all",
    searchQuery: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getKnowledgeConfigs({ limit: 100 });
      setConfigs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载知识库配置失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      const matchesType = filters.type === "all" || config.type === filters.type;
      const matchesSearch =
        !filters.searchQuery ||
        config.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        config.collection_name?.toLowerCase().includes(filters.searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [configs, filters]);

  const createConfig = useCallback(
    async (data: Partial<KnowledgeConfig>) => {
      const result = await createKnowledgeConfig(data);
      await loadData();
      return result;
    },
    [loadData]
  );

  const updateConfig = useCallback(
    async (id: string, data: Partial<KnowledgeConfig>) => {
      const result = await updateKnowledgeConfig(id, data);
      await loadData();
      return result;
    },
    [loadData]
  );

  const deleteConfig = useCallback(
    async (id: string) => {
      await deleteKnowledgeConfig(id);
      await loadData();
    },
    [loadData]
  );

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    configs,
    filteredConfigs,
    isLoading,
    error,
    filters,
    setFilters,
    loadData,
    createConfig,
    updateConfig,
    deleteConfig,
  };
}
