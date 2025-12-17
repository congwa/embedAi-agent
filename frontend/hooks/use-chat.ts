"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "@/types/conversation";
import type { Product } from "@/types/product";
import { getConversation, streamChat, type StreamChatController } from "@/lib/api";
import type { ChatEvent } from "@/types/chat";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  /**
   * 按时间顺序的分段内容（用于支持：推理 -> 正文 -> 推理 -> 正文 ... 交替显示）
   * - reasoning：推理片段（可折叠）
   * - content：真实回复片段（正常展示）
   */
  segments?: Array<{
    id: string;
    kind: "reasoning" | "content";
    text: string;
    /**
     * 仅对 reasoning 有意义：
     * - streaming 时当前推理段默认展开
     * - 一旦进入 content 段，上一段推理会自动折叠（但不会消失）
     */
    isOpen?: boolean;
  }>;
  products?: Product[];
  isStreaming?: boolean;
}

export function useChat(
  userId: string | null,
  conversationId: string | null,
  onTitleUpdate?: (title: string) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false); // 标记正在发送消息
  const [error, setError] = useState<string | null>(null);
  
  // 新增：保存当前流的控制器
  const streamControllerRef = useRef<StreamChatController | null>(null);

  // 加载会话消息
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // 如果正在发送消息，跳过加载（避免清空刚添加的消息）
    if (isSending) {
      console.log("[chat] 正在发送消息，跳过加载");
      return;
    }

    setIsLoading(true);
    try {
      const conversation = await getConversation(conversationId);
      const chatMessages: ChatMessage[] = conversation.messages.map((msg: Message) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        segments:
          msg.role === "assistant" && msg.content
            ? [
                {
                  id: `${msg.id}-content-0`,
                  kind: "content" as const,
                  text: msg.content,
                },
              ]
            : undefined,
        products: msg.products ? JSON.parse(msg.products) : undefined,
      }));
      setMessages(chatMessages);
      console.log("[chat] 加载了", chatMessages.length, "条消息");
    } catch (error) {
      console.error("[chat] 加载消息失败:", error);
      setError("加载消息失败");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isSending]);

  // 新增：中断当前对话
  const abortStream = useCallback(() => {
    if (streamControllerRef.current) {
      console.log("[chat] 用户中断对话");
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
      
      // 移除最后一条正在生成的助手消息（因为后端不会保存被中断的消息）
      setMessages((prev) =>
        prev.filter((msg, index) => 
          !(index === prev.length - 1 && msg.role === "assistant" && msg.isStreaming)
        )
      );
      
      setIsStreaming(false);
      setIsSending(false);
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string, targetConversationId?: string) => {
      const convId = targetConversationId || conversationId;
      
      if (!userId || !convId || !content.trim()) {
        return;
      }

      setError(null);
      setIsSending(true); // 标记开始发送
      setIsStreaming(true);

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
      };
      setMessages((prev) => {
        return [...prev, userMessage];
      });

      // 添加空的助手消息（用于流式显示）
      let assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        segments: [],
        isStreaming: true,
      };
      setMessages((prev) => {
        return [...prev, assistantMessage];
      });

      let fullContent = "";
      let fullReasoning = "";
      let products: Product[] | undefined;

      const applyAssistantSegmentsDelta = (
        kind: "reasoning" | "content",
        delta: string,
        nextContent: string,
        nextReasoning: string
      ) => {
        // 关键：捕获当前 assistantMessageId，避免 setState updater 延迟执行时读取到被后续事件改写后的 id
        const targetId = assistantMessageId;
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== targetId) return msg;
            const prevSegments = Array.isArray(msg.segments) ? msg.segments : [];
            const segments = [...prevSegments];
            const last = segments.length > 0 ? segments[segments.length - 1] : undefined;

            if (last && last.kind === kind) {
              segments[segments.length - 1] = { ...last, text: last.text + delta };
            } else {
              // 进入新段：如果上一个是推理段，自动折叠它（但不移除）
              if (last && last.kind === "reasoning") {
                segments[segments.length - 1] = { ...last, isOpen: false };
              }
              segments.push({
                id: crypto.randomUUID(),
                kind,
                text: delta,
                isOpen: kind === "reasoning",
              });

              console.log("[chat] segment switch", {
                from: last?.kind ?? null,
                to: kind,
                assistantMessageId,
                segmentsCount: segments.length,
              });
            }

            return {
              ...msg,
              content: nextContent,
              reasoning: nextReasoning || undefined,
              segments,
            };
          })
        );
      };

      try {
        // 创建控制器并保存引用
        const controller: StreamChatController = { abort: () => {} };
        streamControllerRef.current = controller;

        for await (const event of streamChat({
          user_id: userId,
          conversation_id: convId,
          message: content.trim(),
        }, controller)) {
          console.log('[SSE Event]', event.type, event);
          const applyAssistantUpdate = (updater: (msg: ChatMessage) => ChatMessage) => {
            // 同上：捕获当前 id，避免 updater 延迟执行时读到被改写后的 assistantMessageId
            const targetId = assistantMessageId;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === targetId ? updater(msg) : msg))
            );
          };

          if (event.type === "meta.start") {
            const payload = event.payload as Extract<ChatEvent["payload"], { assistant_message_id: string }>;
            // 捕获 clientId，避免 setMessages 延迟执行导致用到被改写后的 assistantMessageId
            const clientId = assistantMessageId;
            if (payload?.assistant_message_id && payload.assistant_message_id !== clientId) {
              const serverId = payload.assistant_message_id;
              // 将前端临时 id 替换为服务端 message_id，保证渲染与落库对齐
              setMessages((prev) =>
                prev.map((msg) => (msg.id === clientId ? { ...msg, id: serverId } : msg))
              );
              assistantMessageId = serverId;
              console.log("[chat] assistant_message_id remap", { clientId, serverId });
            }
            continue;
          }
          
          if (event.type === "assistant.delta") {
            const payload = event.payload as Extract<ChatEvent["payload"], { delta: string }>;
            if (payload?.delta) {
              // 不合帧：后端返回多长增量，就立刻显示多长
              fullContent += payload.delta;
              applyAssistantSegmentsDelta("content", payload.delta, fullContent, fullReasoning);
            }
          } else if (event.type === "assistant.reasoning.delta") {
            const payload = event.payload as Extract<ChatEvent["payload"], { delta: string }>;
            if (payload?.delta) {
              // 不合帧：后端返回多长增量，就立刻显示多长
              fullReasoning += payload.delta;
              applyAssistantSegmentsDelta("reasoning", payload.delta, fullContent, fullReasoning);
            }
          } else if (event.type === "assistant.products") {
            const payload = event.payload as Extract<ChatEvent["payload"], { items: Product[] }>;
            if (payload?.items) {
              products = payload.items;
              applyAssistantUpdate((msg) => ({ ...msg, products }));
            }
          } else if (event.type === "assistant.final") {
            const payload = event.payload as Extract<ChatEvent["payload"], { content: string; reasoning?: string | null; products?: Product[] | null }>;
            if (typeof payload?.content === "string" && payload.content) {
              // final 以服务端为准：如果更长/不同，补齐差异（避免覆盖导致丢段）
              if (payload.content.startsWith(fullContent)) {
                const rest = payload.content.slice(fullContent.length);
                if (rest) {
                  fullContent = payload.content;
                  applyAssistantSegmentsDelta("content", rest, fullContent, fullReasoning);
                } else {
                  fullContent = payload.content;
                }
              } else if (payload.content.length >= fullContent.length) {
                fullContent = payload.content;
              }
            }
            if (typeof payload?.reasoning === "string" && payload.reasoning) {
              if (payload.reasoning.startsWith(fullReasoning)) {
                const rest = payload.reasoning.slice(fullReasoning.length);
                if (rest) {
                  fullReasoning = payload.reasoning;
                  applyAssistantSegmentsDelta("reasoning", rest, fullContent, fullReasoning);
                } else {
                  fullReasoning = payload.reasoning;
                }
              } else if (payload.reasoning.length >= fullReasoning.length) {
                fullReasoning = payload.reasoning;
              }
            }
            if (payload?.products && Array.isArray(payload.products)) {
              products = payload.products;
            }

            applyAssistantUpdate((msg) => ({ ...msg, content: fullContent, reasoning: fullReasoning || undefined, products, isStreaming: false }));
            
            // 更新会话标题（使用用户第一条消息）
            if (messages.length === 0 && onTitleUpdate) {
              const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
              onTitleUpdate(title);
            }
          } else if (event.type === "error") {
            const payload = event.payload as Extract<ChatEvent["payload"], { message: string }>;
            throw new Error(payload?.message || "聊天出错");
          }
        }
      } catch (error) {
        // 如果不是用户主动中断，才显示错误
        if (error instanceof Error && error.name !== 'AbortError') {
          setError(error.message);
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        }
      } finally {
        streamControllerRef.current = null;
        setIsSending(false); // 发送完成
        setIsStreaming(false);
      }
    },
    [userId, conversationId, messages.length, onTitleUpdate]
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // 当会话 ID 变化时重新加载消息
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    refreshMessages: loadMessages,
    abortStream, // 新增：暴露中断方法
  };
}
