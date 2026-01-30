"use client";

import { useEffect, useCallback } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUserStore, useConversationStore, useChatStore, useRealtimeStore } from "@/stores";
import { useUserWebSocket } from "@/hooks/use-websocket";
import type { SupportMessage, ConversationState } from "@/types/websocket";
import { ChatSidebar } from "./ChatSidebar";
import { ChatContent } from "./ChatContent";
import { ChatThemeProvider } from "./themes";

export function ChatApp() {
  // Store 状态
  const userId = useUserStore((s) => s.userId);
  const isUserLoading = useUserStore((s) => s.isLoading);
  const initUser = useUserStore((s) => s.initUser);
  const loadConversations = useConversationStore((s) => s.loadConversations);
  const currentConversationId = useConversationStore((s) => s.currentConversationId);
  const addSupportEvent = useChatStore((s) => s.addSupportEvent);
  const addHumanAgentMessage = useChatStore((s) => s.addHumanAgentMessage);
  
  // Realtime Store
  const setConnected = useRealtimeStore((s) => s.setConnected);
  const setHandoffState = useRealtimeStore((s) => s.setHandoffState);
  const setAgentOnline = useRealtimeStore((s) => s.setAgentOnline);
  const setAgentTyping = useRealtimeStore((s) => s.setAgentTyping);
  const setUnreadCount = useRealtimeStore((s) => s.setUnreadCount);
  const resetRealtime = useRealtimeStore((s) => s.reset);

  // WebSocket 回调
  const handleWsMessage = useCallback((message: SupportMessage) => {
    if (message.role === "human_agent") {
      addHumanAgentMessage(message.content, message.operator);
    }
  }, [addHumanAgentMessage]);

  const handleStateChange = useCallback((state: ConversationState) => {
    // 更新 Realtime Store
    setHandoffState(state.handoff_state, state.operator);
    setAgentOnline(state.agent_online ?? false, state.peer_last_online_at);
    if (state.unread_count !== undefined) {
      setUnreadCount(state.unread_count);
    }
    
    // 添加 timeline 事件
    if (state.handoff_state === "human" && state.operator) {
      addSupportEvent(`客服 ${state.operator} 已接入会话`);
    } else if (state.handoff_state === "ai") {
      addSupportEvent("客服已结束服务，已切换回 AI 模式");
    }
  }, [addSupportEvent, setHandoffState, setAgentOnline, setUnreadCount]);

  // WebSocket 连接
  const { isConnected, connectionId, conversationState, agentTyping } = useUserWebSocket({
    conversationId: currentConversationId,
    userId,
    onMessage: handleWsMessage,
    onStateChange: handleStateChange,
    enabled: !!currentConversationId && !!userId,
  });

  // 同步 WebSocket 状态到 Store
  useEffect(() => {
    setConnected(isConnected, connectionId);
  }, [isConnected, connectionId, setConnected]);

  useEffect(() => {
    setAgentTyping(agentTyping);
  }, [agentTyping, setAgentTyping]);

  // 会话切换时重置状态
  useEffect(() => {
    if (!currentConversationId) {
      resetRealtime();
    }
  }, [currentConversationId, resetRealtime]);

  // 初始化用户
  useEffect(() => {
    initUser();
  }, [initUser]);

  // 用户加载完成后加载会话列表
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  // 加载中状态
  if (isUserLoading || !userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mx-auto" />
          <p className="text-sm text-zinc-500">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatThemeProvider>
      <SidebarProvider>
        <ChatSidebar />
        <SidebarInset>
          <ChatContent />
        </SidebarInset>
      </SidebarProvider>
    </ChatThemeProvider>
  );
}
