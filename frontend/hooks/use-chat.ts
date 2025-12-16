"use client";

import { useCallback, useEffect, useState } from "react";
import type { Message } from "@/types/conversation";
import type { Product } from "@/types/product";
import { getConversation, streamChat } from "@/lib/api";
import type { ChatEvent } from "@/types/chat";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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
        isStreaming: true,
      };
      setMessages((prev) => {
        return [...prev, assistantMessage];
      });

      try {
        let fullContent = "";
        let products: Product[] | undefined;

        for await (const event of streamChat({
          user_id: userId,
          conversation_id: convId,
          message: content.trim(),
        })) {
          const applyAssistantUpdate = (updater: (msg: ChatMessage) => ChatMessage) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMessageId ? updater(msg) : msg))
            );
          };

          if (event.type === "meta.start") {
            const payload = event.payload as Extract<ChatEvent["payload"], { assistant_message_id: string }>;
            if (payload?.assistant_message_id && payload.assistant_message_id !== assistantMessageId) {
              const serverId = payload.assistant_message_id;
              // 将前端临时 id 替换为服务端 message_id，保证渲染与落库对齐
              setMessages((prev) =>
                prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, id: serverId } : msg))
              );
              assistantMessageId = serverId;
            }
            continue;
          }
          
          if (event.type === "assistant.delta") {
            const payload = event.payload as Extract<ChatEvent["payload"], { delta: string }>;
            if (payload?.delta) {
              fullContent += payload.delta;
              applyAssistantUpdate((msg) => ({ ...msg, content: fullContent }));
            }
          } else if (event.type === "assistant.products") {
            const payload = event.payload as Extract<ChatEvent["payload"], { items: Product[] }>;
            if (payload?.items) {
              products = payload.items;
              applyAssistantUpdate((msg) => ({ ...msg, products }));
            }
          } else if (event.type === "assistant.final") {
            const payload = event.payload as Extract<ChatEvent["payload"], { content: string }>;
            if (payload?.content) {
              fullContent = payload.content;
            }
            if (payload && "products" in payload && Array.isArray((payload as any).products)) {
              products = (payload as any).products as Product[];
            }

            applyAssistantUpdate((msg) => ({ ...msg, content: fullContent, products, isStreaming: false }));
            
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
        setError(error instanceof Error ? error.message : "发送失败");
        
        // 移除失败的助手消息
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
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
  };
}
