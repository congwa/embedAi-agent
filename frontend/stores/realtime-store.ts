/**
 * 实时状态管理 Store
 * 
 * 统一管理 WebSocket 连接状态、在线状态、接入状态等
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface RealtimeState {
  // 连接状态
  isConnected: boolean;
  connectionId: string | null;
  
  // 会话状态
  handoffState: "ai" | "pending" | "human";
  operator: string | null;
  
  // 在线状态
  agentOnline: boolean;
  agentLastOnlineAt: string | null;
  
  // 输入状态
  agentTyping: boolean;
  
  // 未读消息
  unreadCount: number;
  
  // Actions
  setConnected: (connected: boolean, connectionId?: string | null) => void;
  setHandoffState: (state: "ai" | "pending" | "human", operator?: string | null) => void;
  setAgentOnline: (online: boolean, lastOnlineAt?: string | null) => void;
  setAgentTyping: (typing: boolean) => void;
  setUnreadCount: (count: number) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  connectionId: null,
  handoffState: "ai" as const,
  operator: null,
  agentOnline: false,
  agentLastOnlineAt: null,
  agentTyping: false,
  unreadCount: 0,
};

export const useRealtimeStore = create<RealtimeState>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setConnected: (connected, connectionId = null) => {
      set({ isConnected: connected, connectionId });
    },

    setHandoffState: (state, operator = null) => {
      set({ handoffState: state, operator });
    },

    setAgentOnline: (online, lastOnlineAt = null) => {
      set({ agentOnline: online, agentLastOnlineAt: lastOnlineAt });
    },

    setAgentTyping: (typing) => {
      set({ agentTyping: typing });
    },

    setUnreadCount: (count) => {
      set({ unreadCount: count });
    },

    reset: () => {
      set(initialState);
    },
  }))
);
