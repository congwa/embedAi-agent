// 用户端 WebSocket Hook

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  WSMessage,
  WSAction,
  SupportMessage,
  ConversationState,
  ConnectedPayload,
  ServerMessagePayload,
  TypingPayload,
  HandoffStartedPayload,
  HandoffEndedPayload,
  AgentPresencePayload,
  ConversationStatePayload,
  MessageWithdrawnPayload,
  MessageEditedPayload,
  MessagesDeletedPayload,
} from "@/types/websocket";
import { WS_PROTOCOL_VERSION } from "@/types/websocket";

interface UseUserWebSocketOptions {
  conversationId: string | null;
  userId: string | null;
  wsBaseUrl?: string;
  onMessage?: (message: SupportMessage) => void;
  onStateChange?: (state: ConversationState) => void;
  onMessageWithdrawn?: (payload: MessageWithdrawnPayload) => void;
  onMessageEdited?: (payload: MessageEditedPayload) => void;
  onMessagesDeleted?: (payload: MessagesDeletedPayload) => void;
  enabled?: boolean;
}

interface UseUserWebSocketReturn {
  isConnected: boolean;
  connectionId: string | null;
  conversationState: ConversationState;
  agentTyping: boolean;
  sendMessage: (content: string) => void;
  setTyping: (isTyping: boolean) => void;
  requestHandoff: (reason?: string) => void;
  markAsRead: (messageIds: string[]) => void;
}

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildMessage(
  action: WSAction,
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
  onMessageWithdrawn,
  onMessageEdited,
  onMessagesDeleted,
  enabled = true,
}: UseUserWebSocketOptions): UseUserWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const conversationStateRef = useRef<ConversationState>({
    handoff_state: "ai",
    user_online: true,
    agent_online: false,
  });
  const [conversationState, setConversationState] = useState<ConversationState>(
    conversationStateRef.current
  );
  const [agentTyping, setAgentTyping] = useState(false);

  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

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
        const currentState = conversationStateRef.current;

        switch (msg.action) {
          case "system.connected": {
            const payload = msg.payload as unknown as ConnectedPayload;
            setConnectionId(payload.connection_id);
            setConversationState((prev) => ({
              ...prev,
              handoff_state: payload.handoff_state as "ai" | "pending" | "human",
              user_online: true,
              agent_online: payload.peer_online,
            }));
            break;
          }

          case "system.pong":
            break;
          case "system.ack":
            break;
          case "system.error":
            console.error("WebSocket error:", msg.payload);
            break;

          case "server.message": {
            const payload = msg.payload as unknown as ServerMessagePayload;
            onMessage?.({
              id: payload.message_id,
              role: payload.role,
              content: payload.content,
              created_at: payload.created_at,
              operator: payload.operator,
            });
            break;
          }

          case "server.typing": {
            const payload = msg.payload as unknown as TypingPayload;
            if (payload.role === "agent") {
              setAgentTyping(payload.is_typing);
            }
            break;
          }

          case "server.handoff_started": {
            const payload = msg.payload as unknown as HandoffStartedPayload;
            const newState: ConversationState = {
              ...currentState,
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
              ...currentState,
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
            const payload = msg.payload as unknown as AgentPresencePayload;
            setConversationState((prev) => ({
              ...prev,
              agent_online: true,
              operator: payload.operator,
            }));
            break;
          }

          case "server.agent_offline": {
            setConversationState((prev) => ({
              ...prev,
              agent_online: false,
            }));
            setAgentTyping(false);
            break;
          }

          case "server.conversation_state": {
            const payload = msg.payload as unknown as ConversationStatePayload;
            const newState: ConversationState = {
              ...currentState,
              handoff_state: payload.handoff_state as "ai" | "pending" | "human",
              operator: payload.operator,
            };
            setConversationState(newState);
            onStateChange?.(newState);
            break;
          }

          case "server.message_withdrawn": {
            const payload = msg.payload as unknown as MessageWithdrawnPayload;
            onMessageWithdrawn?.(payload);
            break;
          }

          case "server.message_edited": {
            const payload = msg.payload as unknown as MessageEditedPayload;
            onMessageEdited?.(payload);
            break;
          }

          case "server.messages_deleted": {
            const payload = msg.payload as unknown as MessagesDeletedPayload;
            onMessagesDeleted?.(payload);
            break;
          }

          default:
            console.log("Unknown action:", msg.action);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    },
    [onMessage, onStateChange, onMessageWithdrawn, onMessageEdited, onMessagesDeleted]
  );

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!conversationId || !userId || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // 构建 WebSocket URL
    let wsUrl = wsBaseUrl || process.env.NEXT_PUBLIC_WS_URL;
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
        console.log("[UserWS] Connected");

        // 启动心跳
        pingIntervalRef.current = setInterval(() => {
          send(buildMessage("system.ping", {}, conversationId));
        }, 30000);
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionId(null);
        console.log("[UserWS] Disconnected");

        // 清理心跳
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // 自动重连
        if (enabled && conversationId && userId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[UserWS] Reconnecting...");
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("[UserWS] Error:", error);
      };
    } catch (e) {
      console.error("[UserWS] Failed to connect:", e);
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
    setConnectionId(null);
  }, []);

  // 初始化/清理连接
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

  // 标记已读
  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (!conversationId) return;
      send(buildMessage("client.user.read", { message_ids: messageIds }, conversationId));
    },
    [send, conversationId]
  );

  return {
    isConnected,
    connectionId,
    conversationState,
    agentTyping,
    sendMessage,
    setTyping,
    requestHandoff,
    markAsRead,
  };
}
