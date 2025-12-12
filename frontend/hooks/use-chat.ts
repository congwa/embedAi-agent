"use client";

import { useCallback, useEffect, useState } from "react";
import type { Message } from "@/types/conversation";
import type { Product } from "@/types/product";
import { getConversation, streamChat } from "@/lib/api";

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
        console.warn("[chat] 发送消息失败: 缺少必要参数", { userId, convId, content: content?.slice(0, 20) });
        return;
      }

      console.log("[chat] 开始发送消息", { convId, content: content.slice(0, 30) });

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
        console.log("[chat] 添加用户消息, 当前消息数:", prev.length);
        return [...prev, userMessage];
      });

      // 添加空的助手消息（用于流式显示）
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };
      setMessages((prev) => {
        console.log("[chat] 添加助手消息, 当前消息数:", prev.length);
        return [...prev, assistantMessage];
      });

      try {
        let fullContent = "";
        let products: Product[] | undefined;
        let eventCount = 0;

        for await (const event of streamChat({
          user_id: userId,
          conversation_id: convId,
          message: content.trim(),
        })) {
          eventCount++;
          console.log("[chat] 收到事件", { type: event.type, eventCount });
          
          if (event.type === "text" && event.content) {
            fullContent += event.content;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          } else if (event.type === "products" && event.data) {
            products = event.data;
            console.log("[chat] 收到商品数据", products.length);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, products }
                  : msg
              )
            );
          } else if (event.type === "done") {
            console.log("[chat] 流式完成");
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            
            // 更新会话标题（使用用户第一条消息）
            if (messages.length === 0 && onTitleUpdate) {
              const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
              onTitleUpdate(title);
            }
          } else if (event.type === "error") {
            throw new Error(event.content || "聊天出错");
          }
        }

        console.log("[chat] 消息发送完成, 总事件数:", eventCount);
      } catch (error) {
        console.error("[chat] 发送消息失败:", error);
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
