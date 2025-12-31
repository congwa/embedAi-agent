"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "@/types/conversation";
import { getConversation, streamChat, type StreamChatController } from "@/lib/api";
import type { ChatEvent } from "@/types/chat";
import {
  type TimelineState,
  type TimelineItem,
  type SupportEventItem,
  createInitialState,
  addUserMessage,
  startAssistantTurn,
  timelineReducer,
  clearTurn,
  endTurn,
  historyToTimeline,
} from "./use-timeline-reducer";
import { useSupportSubscription, type SupportMessage } from "./use-support-subscription";

export type {
  TimelineItem,
  TimelineState,
  UserMessageItem,
  LLMCallClusterItem,
  ToolCallItem,
  LLMCallSubItem,
  ToolCallSubItem,
  ReasoningSubItem,
  ContentSubItem,
  ProductsSubItem,
  TodosSubItem,
  ContextSummarizedSubItem,
  ErrorItem,
  FinalItem,
  MemoryEventItem,
  SupportEventItem,
  ItemStatus,
  // 兼容旧类型
  ReasoningItem,
  ContentItem,
  ProductsItem,
  TodosItem,
  ContextSummarizedItem,
} from "./use-timeline-reducer";

export function useChat(
  userId: string | null,
  conversationId: string | null,
  onTitleUpdate?: (title: string) => void
) {
  const [timelineState, setTimelineState] = useState<TimelineState>(createInitialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHumanMode, setIsHumanMode] = useState(false);

  const streamControllerRef = useRef<StreamChatController | null>(null);
  const isStreamingRef = useRef(false);

  // 处理客服订阅消息
  const handleSupportMessage = useCallback((message: SupportMessage) => {
    console.log("[chat] 收到客服消息:", message.type);
    
    // 将订阅消息转换为 timeline item
    const item: SupportEventItem = {
      type: "support.event",
      id: `support:${message.payload.message_id || crypto.randomUUID()}`,
      turnId: `support-turn-${Date.now()}`,
      eventType: message.type.replace("support.", "") as SupportEventItem["eventType"],
      message: message.payload.message,
      content: message.payload.content,
      operator: message.payload.operator,
      messageId: message.payload.message_id,
      ts: Date.now(),
    };

    setTimelineState((prev) => ({
      ...prev,
      timeline: [...prev.timeline, item],
      indexById: { ...prev.indexById, [item.id]: prev.timeline.length },
    }));
  }, []);

  // 客服消息订阅（仅在人工模式下启用）
  const { isConnected: isSupportConnected } = useSupportSubscription(
    userId,
    conversationId,
    {
      enabled: isHumanMode,
      onMessage: handleSupportMessage,
    }
  );

  // 加载会话消息
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setTimelineState(createInitialState());
      setIsHumanMode(false);
      return;
    }

    // 使用 ref 检查流状态，避免依赖状态导致不必要的重新调用
    if (isStreamingRef.current) {
      console.log("[chat] 正在流式传输，跳过加载");
      return;
    }

    setIsLoading(true);
    try {
      const conversation = await getConversation(conversationId);
      const messages = conversation.messages.map((msg: Message) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        products: msg.products ? JSON.parse(msg.products) : undefined,
      }));
      setTimelineState(historyToTimeline(messages));
      
      // 检测会话是否处于人工模式
      const isHuman = conversation.handoff_state === "human";
      setIsHumanMode(isHuman);
      console.log("[chat] 加载了", messages.length, "条消息, 人工模式:", isHuman);
    } catch (err) {
      console.error("[chat] 加载消息失败:", err);
      setError("加载消息失败");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // 中断当前对话
  const abortStream = useCallback(() => {
    if (streamControllerRef.current) {
      console.log("[chat] 用户中断对话");
      streamControllerRef.current.abort();
      streamControllerRef.current = null;

      // 清除当前 turn 的所有 items
      const currentTurnId = timelineState.activeTurn.turnId;
      if (currentTurnId) {
        setTimelineState((prev) => clearTurn(prev, currentTurnId));
      }
    }
  }, [timelineState.activeTurn.turnId]);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string, targetConversationId?: string) => {
      const convId = targetConversationId || conversationId;

      if (!userId || !convId || !content.trim()) {
        return;
      }

      setError(null);

      // 添加用户消息
      const userMessageId = crypto.randomUUID();
      setTimelineState((prev) => addUserMessage(prev, userMessageId, content.trim()));

      // 开始 assistant turn
      const assistantTurnId = crypto.randomUUID();
      setTimelineState((prev) => startAssistantTurn(prev, assistantTurnId));

      try {
        const controller: StreamChatController = { abort: () => { } };
        streamControllerRef.current = controller;
        isStreamingRef.current = true;
        let loggedDeltaOnce = false;
        for await (const event of streamChat(
          {
            user_id: userId,
            conversation_id: convId,
            message: content.trim(),
          },
          controller
        )) {
          // frontend/hooks/use-chat.ts
          if (
            event.type !== "assistant.delta" &&
            event.type !== "assistant.reasoning.delta"
          ) {
            loggedDeltaOnce = false;
            console.log("[SSE Event]", event.type, JSON.stringify(event.payload));
          } else if (!loggedDeltaOnce) {
            console.log("[SSE Event]", event.type, "(delta streaming)");
            loggedDeltaOnce = true;
          }
          
          // 检测人工模式
          if (event.type === "meta.start") {
            const payload = event.payload as { mode?: string };
            if (payload.mode === "human") {
              console.log("[chat] 进入人工模式，启用订阅");
              setIsHumanMode(true);
            }
          }
          
          setTimelineState((prev) => timelineReducer(prev, event));
        }

        // 流结束
        setTimelineState((prev) => endTurn(prev));

        // 更新会话标题
        if (timelineState.timeline.length === 0 && onTitleUpdate) {
          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          onTitleUpdate(title);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          // 清除当前 turn
          setTimelineState((prev) => clearTurn(prev, assistantTurnId));
        }
      } finally {
        streamControllerRef.current = null;
        isStreamingRef.current = false;
      }
    },
    [userId, conversationId, timelineState.timeline.length, onTitleUpdate]
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    setTimelineState(createInitialState());
    setError(null);
  }, []);

  // 当会话 ID 变化时重新加载消息
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    timeline: timelineState.timeline,
    isStreaming: timelineState.activeTurn.isStreaming,
    isLoading,
    error,
    isHumanMode,
    isSupportConnected,
    sendMessage,
    clearMessages,
    refreshMessages: loadMessages,
    abortStream,
  };
}
