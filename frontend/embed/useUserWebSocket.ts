// 用户端 WebSocket Hook（Embed 独立版本）

import { useCallback, useEffect, useRef, useState } from "react";

const WS_PROTOCOL_VERSION = 1;

// 类型定义
interface WSMessage {
  v: number;
  id: string;
  ts: number;
  action: string;
  payload: Record<string, unknown>;
  conversation_id?: string;
}

export interface SupportMessage {
  id: string;
  role: "user" | "assistant" | "human_agent" | "system";
  content: string;
  created_at: string;
  operator?: string;
  is_delivered?: boolean;
  delivered_at?: string;
  read_at?: string;
  read_by?: string;
}

export interface ConversationState {
  handoff_state: "ai" | "pending" | "human";
  operator?: string;
  user_online: boolean;
  agent_online: boolean;
  peer_last_online_at?: string;
  unread_count?: number;
}

export interface ReadReceiptPayload {
  role: string;
  message_ids: string[];
  read_at: string;
  read_by: string;
}

interface UseUserWebSocketOptions {
  conversationId: string | null;
  userId: string | null;
  wsBaseUrl?: string;
  onMessage?: (message: SupportMessage) => void;
  onStateChange?: (state: ConversationState) => void;
  onReadReceipt?: (payload: ReadReceiptPayload) => void;
  enabled?: boolean;
}

interface UseUserWebSocketReturn {
  isConnected: boolean;
  conversationState: ConversationState;
  agentTyping: boolean;
  sendMessage: (content: string) => void;
  setTyping: (isTyping: boolean) => void;
  requestHandoff: (reason?: string) => void;
}

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildMessage(
  action: string,
  payload: Record<string, unknown>,
  conversationId?: string
): WSMessage {
  return {
    v: WS_PROTOCOL_VERSION,
    id: generateId(),
    ts: Date.now(),
    action,
    payload,
    conversation_id: conversationId,
  };
}

export function useUserWebSocket({
  conversationId,
  userId,
  wsBaseUrl,
  onMessage,
  onStateChange,
  onReadReceipt,
  enabled = true,
}: UseUserWebSocketOptions): UseUserWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    handoff_state: "ai",
    user_online: true,
    agent_online: false,
  });
  const [agentTyping, setAgentTyping] = useState(false);

  // 发送消息
  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // 处理收到的消息
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        switch (msg.action) {
          case "system.connected": {
            const payload = msg.payload as {
              connection_id: string;
              handoff_state: string;
              peer_online: boolean;
              peer_last_online_at: string | null;
              unread_count: number;
            };
            setConversationState((prev) => ({
              ...prev,
              handoff_state: payload.handoff_state as "ai" | "pending" | "human",
              user_online: true,
              agent_online: payload.peer_online,
              peer_last_online_at: payload.peer_last_online_at ?? undefined,
              unread_count: payload.unread_count,
            }));
            break;
          }

          case "system.pong":
          case "system.ack":
            break;

          case "system.error":
            console.error("[EmbedWS] Error:", msg.payload);
            break;

          case "server.message": {
            const payload = msg.payload as {
              message_id: string;
              role: "user" | "assistant" | "human_agent" | "system";
              content: string;
              created_at: string;
              operator?: string;
              is_delivered?: boolean;
              delivered_at?: string;
              read_at?: string;
              read_by?: string;
            };
            onMessage?.({
              id: payload.message_id,
              role: payload.role,
              content: payload.content,
              created_at: payload.created_at,
              operator: payload.operator,
              is_delivered: payload.is_delivered,
              delivered_at: payload.delivered_at,
              read_at: payload.read_at,
              read_by: payload.read_by,
            });
            break;
          }

          case "server.read_receipt": {
            const payload = msg.payload as unknown as ReadReceiptPayload;
            onReadReceipt?.(payload);
            break;
          }

          case "server.typing": {
            const payload = msg.payload as { role: string; is_typing: boolean };
            if (payload.role === "agent") {
              setAgentTyping(payload.is_typing);
            }
            break;
          }

          case "server.handoff_started": {
            const payload = msg.payload as { operator: string };
            const newState: ConversationState = {
              ...conversationState,
              handoff_state: "human",
              operator: payload.operator,
              agent_online: true,
            };
            setConversationState(newState);
            onStateChange?.(newState);
            break;
          }

          case "server.handoff_ended": {
            const newState: ConversationState = {
              ...conversationState,
              handoff_state: "ai",
              operator: undefined,
              agent_online: false,
            };
            setConversationState(newState);
            onStateChange?.(newState);
            setAgentTyping(false);
            break;
          }

          case "server.agent_online": {
            const payload = msg.payload as { operator: string; online: boolean; last_online_at?: string };
            setConversationState((prev) => ({
              ...prev,
              agent_online: true,
              operator: payload.operator,
              peer_last_online_at: payload.last_online_at,
            }));
            break;
          }

          case "server.agent_offline": {
            const payload = msg.payload as { operator: string; online: boolean; last_online_at?: string };
            setConversationState((prev) => ({
              ...prev,
              agent_online: false,
              peer_last_online_at: payload.last_online_at,
            }));
            setAgentTyping(false);
            break;
          }

          case "server.conversation_state": {
            const payload = msg.payload as {
              handoff_state: string;
              operator?: string;
            };
            const newState: ConversationState = {
              ...conversationState,
              handoff_state: payload.handoff_state as "ai" | "pending" | "human",
              operator: payload.operator,
            };
            setConversationState(newState);
            onStateChange?.(newState);
            break;
          }
        }
      } catch (e) {
        console.error("[EmbedWS] Parse error:", e);
      }
    },
    [conversationState, onMessage, onStateChange]
  );

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!conversationId || !userId || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    let wsUrl = wsBaseUrl;
    if (!wsUrl) {
      if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${window.location.host}`;
      } else {
        return;
      }
    }

    const url = `${wsUrl}/ws/user/${conversationId}?token=user_${userId}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("[EmbedWS] Connected");

        pingIntervalRef.current = setInterval(() => {
          send(buildMessage("system.ping", {}, conversationId));
        }, 30000);
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setIsConnected(false);
        console.log("[EmbedWS] Disconnected");

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (enabled && conversationId && userId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[EmbedWS] Reconnecting...");
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("[EmbedWS] Error:", error);
      };
    } catch (e) {
      console.error("[EmbedWS] Connect failed:", e);
    }
  }, [conversationId, userId, wsBaseUrl, enabled, send, handleMessage]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled && conversationId && userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [conversationId, userId, enabled, connect, disconnect]);

  // 发送消息
  const sendMessage = useCallback(
    (content: string) => {
      if (!conversationId) return;
      send(
        buildMessage(
          "client.user.send_message",
          { content, message_id: generateId() },
          conversationId
        )
      );
    },
    [send, conversationId]
  );

  // 设置输入状态
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      send(buildMessage("client.user.typing", { is_typing: isTyping }, conversationId));
    },
    [send, conversationId]
  );

  // 请求人工客服
  const requestHandoff = useCallback(
    (reason?: string) => {
      if (!conversationId) return;
      send(
        buildMessage("client.user.request_handoff", { reason: reason || "" }, conversationId)
      );
    },
    [send, conversationId]
  );

  return {
    isConnected,
    conversationState,
    agentTyping,
    sendMessage,
    setTyping,
    requestHandoff,
  };
}
