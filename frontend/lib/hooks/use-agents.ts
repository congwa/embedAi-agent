"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getAgents,
  getAgent,
  refreshAgent as refreshAgentApi,
  type Agent,
  type AgentListResponse,
} from "@/lib/api/agents";

interface UseAgentsOptions {
  status?: string;
  type?: string;
  autoLoad?: boolean;
}

interface UseAgentsReturn {
  agents: Agent[];
  total: number;
  isLoading: boolean;
  error: string | null;
  loadAgents: () => Promise<void>;
  refreshAgent: (agentId: string) => Promise<void>;
  getAgentById: (agentId: string) => Agent | undefined;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsReturn {
  const { status, type, autoLoad = true } = options;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAgents({
        limit: 100,
        status_filter: status,
        type_filter: type,
      });
      setAgents(response.items);
      setTotal(response.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载 Agent 列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [status, type]);

  const refreshAgent = useCallback(async (agentId: string) => {
    try {
      await refreshAgentApi(agentId);
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "刷新 Agent 失败");
    }
  }, [loadAgents]);

  const getAgentById = useCallback(
    (agentId: string) => agents.find((a) => a.id === agentId),
    [agents]
  );

  useEffect(() => {
    if (autoLoad) {
      loadAgents();
    }
  }, [autoLoad, loadAgents]);

  return {
    agents,
    total,
    isLoading,
    error,
    loadAgents,
    refreshAgent,
    getAgentById,
  };
}

interface UseAgentDetailOptions {
  agentId: string;
  autoLoad?: boolean;
}

interface UseAgentDetailReturn {
  agent: Agent | null;
  isLoading: boolean;
  error: string | null;
  loadAgent: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAgentDetail(
  options: UseAgentDetailOptions
): UseAgentDetailReturn {
  const { agentId, autoLoad = true } = options;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAgent(agentId);
      setAgent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载 Agent 详情失败");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const refresh = useCallback(async () => {
    try {
      await refreshAgentApi(agentId);
      await loadAgent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "刷新 Agent 失败");
    }
  }, [agentId, loadAgent]);

  useEffect(() => {
    if (autoLoad && agentId) {
      loadAgent();
    }
  }, [autoLoad, agentId, loadAgent]);

  return {
    agent,
    isLoading,
    error,
    loadAgent,
    refresh,
  };
}
