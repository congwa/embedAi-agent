"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";

export interface SupportMessage {
  type: string;
  payload: {
    message_id?: string;
    content?: string;
    operator?: string;
    created_at?: string;
    message?: string;
    connection_id?: string;
  };
}

interface UseSupportSubscriptionOptions {
  onMessage?: (message: SupportMessage) => void;
  enabled?: boolean;
}

/**
 * 独立的客服消息订阅 hook
 * 
 * 用于在人工模式下接收客服消息，独立于发送消息的 SSE 连接
 */
export function useSupportSubscription(
  userId: string | null,
  conversationId: string | null,
  options: UseSupportSubscriptionOptions = {}
) {
  const { onMessage, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);
  
  // 保持 onMessage 回调最新
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // 使用 useEffect 管理连接生命周期，避免不必要的重连
  useEffect(() => {
    // 清理函数
    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        console.log("[support-subscription] 断开连接");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
    };

    // 如果不满足条件，清理并返回
    if (!enabled || !userId || !conversationId) {
      cleanup();
      return;
    }

    // 如果已有连接且参数没变，不重新连接
    if (eventSourceRef.current) {
      return;
    }

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1/support/user-stream/${conversationId}?user_id=${userId}`;
    
    console.log("[support-subscription] 建立连接:", url);
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[support-subscription] 连接已建立");
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SupportMessage;
        
        // 过滤心跳，但打印调试信息
        if (data.type === "support.ping") {
          console.log("[support-subscription] 收到心跳");
          return;
        }
        
        console.log("[support-subscription] 收到消息:", data.type, data.payload);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error("[support-subscription] 解析消息失败:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[support-subscription] 连接错误:", err);
      setIsConnected(false);
      setError("连接中断");
      eventSourceRef.current = null;
      
      // 自动重连（3秒后）
      if (enabled && userId && conversationId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("[support-subscription] 尝试重连...");
          // 触发重新执行 useEffect
          setError((prev) => prev === "连接中断" ? "重连中..." : prev);
        }, 3000);
      }
    };

    return cleanup;
  }, [enabled, userId, conversationId, error]); // error 变化会触发重连

  return {
    isConnected,
    error,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
    },
    reconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setError("手动重连");
    },
  };
}
