/**
 * 统一的 WebSocket React Hook
 * 
 * 基于 WebSocketManager 提供 React 组件使用的接口
 */

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  WebSocketManager,
  createUserWebSocketManager,
  createAgentWebSocketManager,
  type ConnectionState,
  type WSMessage,
} from "@/lib/websocket";
import type {
  SupportMessage,
  ConversationState,
  ConnectedPayload,
  ServerMessagePayload,
  TypingPayload,
  HandoffStartedPayload,
  HandoffEndedPayload,
  UserPresencePayload,
  AgentPresencePayload,
  ReadReceiptPayload,
  MessageWithdrawnPayload,
  MessageEditedPayload,
  MessagesDeletedPayload,
} from "@/types/websocket";
import type { ImageAttachment } from "@/types/chat";

// ============ 公共配置 ============

function getWebSocketBaseUrl(): string {
  if (typeof window === "undefined") return "";
  
  // 优先使用环境变量
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;
  
  // Next.js rewrites 不支持 WebSocket，需要直连后端
  // 开发环境默认使用本地后端
  if (process.env.NODE_ENV === "development") {
    return "ws://127.0.0.1:8000";
  }
  
  // 生产环境尝试使用同域 WebSocket（需要 nginx 等反向代理支持）
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

// ============ 用户端 Hook ============

export interface UseUserWebSocketOptions {
  conversationId: string | null;
  userId: string | null;
  wsBaseUrl?: string;
  enabled?: boolean;
  onMessage?: (message: SupportMessage) => void;
  onStateChange?: (state: ConversationState) => void;
  onReadReceipt?: (payload: ReadReceiptPayload) => void;
  onMessageWithdrawn?: (payload: MessageWithdrawnPayload) => void;
  onMessageEdited?: (payload: MessageEditedPayload) => void;
  onMessagesDeleted?: (payload: MessagesDeletedPayload) => void;
}

export interface UseUserWebSocketReturn {
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 是否已连接 */
  isConnected: boolean;
  /** 连接 ID */
  connectionId: string | null;
  /** 会话状态 */
  conversationState: ConversationState;
  /** 客服是否正在输入 */
  agentTyping: boolean;
  /** 发送消息 */
  sendMessage: (content: string) => void;
  /** 设置输入状态 */
  setTyping: (isTyping: boolean) => void;
  /** 请求人工客服 */
  requestHandoff: (reason?: string) => void;
  /** 标记已读 */
  markAsRead: (messageIds: string[]) => void;
  /** 手动重连 */
  reconnect: () => void;
}

const DEFAULT_CONVERSATION_STATE: ConversationState = {
  handoff_state: "ai",
  user_online: true,
  agent_online: false,
};

export function useUserWebSocket({
  conversationId,
  userId,
  wsBaseUrl,
  enabled = true,
  onMessage,
  onStateChange,
  onReadReceipt,
  onMessageWithdrawn,
  onMessageEdited,
  onMessagesDeleted,
}: UseUserWebSocketOptions): UseUserWebSocketReturn {
  const managerRef = useRef<WebSocketManager | null>(null);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>(DEFAULT_CONVERSATION_STATE);
  const [agentTyping, setAgentTyping] = useState(false);

  // 使用 ref 存储回调以避免重复创建 manager
  const callbacksRef = useRef({
    onMessage,
    onStateChange,
    onReadReceipt,
    onMessageWithdrawn,
    onMessageEdited,
    onMessagesDeleted,
  });
  
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onStateChange,
      onReadReceipt,
      onMessageWithdrawn,
      onMessageEdited,
      onMessagesDeleted,
    };
  }, [onMessage, onStateChange, onReadReceipt, onMessageWithdrawn, onMessageEdited, onMessagesDeleted]);

  // 消息处理器
  const handleMessage = useCallback((msg: WSMessage) => {
    const callbacks = callbacksRef.current;
    
    switch (msg.action) {
      case "system.connected": {
        const payload = msg.payload as unknown as ConnectedPayload;
        setConnectionId(payload.connection_id);
        const newState: ConversationState = {
          handoff_state: payload.handoff_state as "ai" | "pending" | "human",
          user_online: true,
          agent_online: payload.peer_online,
          peer_last_online_at: payload.peer_last_online_at ?? undefined,
          unread_count: payload.unread_count,
        };
        setConversationState(newState);
        // 同步状态到 Store
        callbacks.onStateChange?.(newState);
        break;
      }

      case "system.ack":
      case "system.error":
        if (msg.action === "system.error") {
          console.error("[UserWS] Server error:", msg.payload);
        }
        break;

      case "server.message": {
        const payload = msg.payload as unknown as ServerMessagePayload;
        callbacks.onMessage?.({
          id: payload.message_id,
          role: payload.role,
          content: payload.content,
          created_at: payload.created_at,
          operator: payload.operator,
          images: payload.images,
          is_delivered: payload.is_delivered,
          delivered_at: payload.delivered_at,
          read_at: payload.read_at,
          read_by: payload.read_by,
        });
        break;
      }

      case "server.read_receipt": {
        const payload = msg.payload as unknown as ReadReceiptPayload;
        callbacks.onReadReceipt?.(payload);
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
        setConversationState((prev) => {
          const newState: ConversationState = {
            ...prev,
            handoff_state: "human",
            operator: payload.operator,
            agent_online: true,
          };
          callbacks.onStateChange?.(newState);
          return newState;
        });
        break;
      }

      case "server.handoff_ended": {
        setConversationState((prev) => {
          const newState: ConversationState = {
            ...prev,
            handoff_state: "ai",
            operator: undefined,
            agent_online: false,
          };
          callbacks.onStateChange?.(newState);
          return newState;
        });
        setAgentTyping(false);
        break;
      }

      case "server.agent_online": {
        const payload = msg.payload as unknown as AgentPresencePayload;
        setConversationState((prev) => ({
          ...prev,
          agent_online: true,
          operator: payload.operator,
          peer_last_online_at: payload.last_online_at,
        }));
        break;
      }

      case "server.agent_offline": {
        const payload = msg.payload as unknown as AgentPresencePayload;
        setConversationState((prev) => ({
          ...prev,
          agent_online: false,
          peer_last_online_at: payload.last_online_at,
        }));
        setAgentTyping(false);
        break;
      }

      case "server.message_withdrawn": {
        const payload = msg.payload as unknown as MessageWithdrawnPayload;
        callbacks.onMessageWithdrawn?.(payload);
        break;
      }

      case "server.message_edited": {
        const payload = msg.payload as unknown as MessageEditedPayload;
        callbacks.onMessageEdited?.(payload);
        break;
      }

      case "server.messages_deleted": {
        const payload = msg.payload as unknown as MessagesDeletedPayload;
        callbacks.onMessagesDeleted?.(payload);
        break;
      }
    }
  }, []);

  // 创建/销毁 manager
  useEffect(() => {
    // 检查条件
    if (!enabled || !conversationId || !userId) {
      // 清理现有连接
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
        setConnectionState("disconnected");
        setConnectionId(null);
        setConversationState(DEFAULT_CONVERSATION_STATE);
        setAgentTyping(false);
      }
      return;
    }

    // 如果已有相同配置的 manager，跳过
    if (managerRef.current?.getConversationId() === conversationId) {
      return;
    }

    // 清理旧的 manager
    if (managerRef.current) {
      managerRef.current.destroy();
    }

    // 创建新的 manager
    const baseUrl = wsBaseUrl || getWebSocketBaseUrl();
    const manager = createUserWebSocketManager(baseUrl, conversationId, userId);
    managerRef.current = manager;

    // 设置监听器
    manager.onStateChange((state) => {
      setConnectionState(state);
      if (state === "disconnected") {
        setConnectionId(null);
      }
    });

    manager.onMessage(handleMessage);

    manager.onError((error) => {
      console.error("[UserWS] Error:", error);
    });

    // 连接
    manager.connect();

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, conversationId, userId, wsBaseUrl]);

  // 操作方法
  const sendMessage = useCallback((content: string) => {
    managerRef.current?.send("client.user.send_message", {
      content,
      message_id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    });
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    managerRef.current?.send("client.user.typing", { is_typing: isTyping });
  }, []);

  const requestHandoff = useCallback((reason?: string) => {
    managerRef.current?.send("client.user.request_handoff", { reason: reason || "" });
  }, []);

  const markAsRead = useCallback((messageIds: string[]) => {
    managerRef.current?.send("client.user.read", { message_ids: messageIds });
  }, []);

  const reconnect = useCallback(() => {
    managerRef.current?.connect();
  }, []);

  return {
    connectionState,
    isConnected: connectionState === "connected",
    connectionId,
    conversationState,
    agentTyping,
    sendMessage,
    setTyping,
    requestHandoff,
    markAsRead,
    reconnect,
  };
}

// ============ 客服端 Hook ============

export interface UseSupportWebSocketOptions {
  conversationId: string;
  agentId: string;
  wsBaseUrl?: string;
  enabled?: boolean;
  onMessage?: (message: SupportMessage) => void;
  onStateChange?: (state: ConversationState) => void;
  onReadReceipt?: (payload: ReadReceiptPayload) => void;
  onMessageWithdrawn?: (payload: MessageWithdrawnPayload) => void;
  onMessageEdited?: (payload: MessageEditedPayload) => void;
  onMessagesDeleted?: (payload: MessagesDeletedPayload) => void;
}

export interface UseSupportWebSocketReturn {
  /** 连接状态 */
  connectionState: ConnectionState;
  /** 是否已连接 */
  isConnected: boolean;
  /** 连接 ID */
  connectionId: string | null;
  /** 会话状态 */
  conversationState: ConversationState;
  /** 用户是否正在输入 */
  userTyping: boolean;
  /** 发送消息 */
  sendMessage: (content: string, images?: ImageAttachment[]) => void;
  /** 设置输入状态 */
  setTyping: (isTyping: boolean) => void;
  /** 开始介入 */
  startHandoff: (reason?: string) => void;
  /** 结束介入 */
  endHandoff: (summary?: string) => void;
  /** 标记已读 */
  markAsRead: (messageIds: string[]) => void;
  /** 撤回消息 */
  withdrawMessage: (messageId: string, reason?: string) => void;
  /** 编辑消息 */
  editMessage: (messageId: string, newContent: string, regenerate?: boolean) => void;
  /** 手动重连 */
  reconnect: () => void;
}

export function useSupportWebSocket({
  conversationId,
  agentId,
  wsBaseUrl,
  enabled = true,
  onMessage,
  onStateChange,
  onReadReceipt,
  onMessageWithdrawn,
  onMessageEdited,
  onMessagesDeleted,
}: UseSupportWebSocketOptions): UseSupportWebSocketReturn {
  const managerRef = useRef<WebSocketManager | null>(null);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>({
    handoff_state: "ai",
    user_online: false,
    agent_online: true,
  });
  const [userTyping, setUserTyping] = useState(false);

  // 使用 ref 存储回调
  const callbacksRef = useRef({
    onMessage,
    onStateChange,
    onReadReceipt,
    onMessageWithdrawn,
    onMessageEdited,
    onMessagesDeleted,
  });
  
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onStateChange,
      onReadReceipt,
      onMessageWithdrawn,
      onMessageEdited,
      onMessagesDeleted,
    };
  }, [onMessage, onStateChange, onReadReceipt, onMessageWithdrawn, onMessageEdited, onMessagesDeleted]);

  // 消息处理器
  const handleMessage = useCallback((msg: WSMessage) => {
    const callbacks = callbacksRef.current;
    
    switch (msg.action) {
      case "system.connected": {
        const payload = msg.payload as unknown as ConnectedPayload;
        setConnectionId(payload.connection_id);
        const newState: ConversationState = {
          handoff_state: payload.handoff_state as "ai" | "pending" | "human",
          agent_online: true,
          user_online: payload.peer_online,
          peer_last_online_at: payload.peer_last_online_at ?? undefined,
          unread_count: payload.unread_count,
        };
        setConversationState(newState);
        // 同步状态到 Store
        callbacks.onStateChange?.(newState);
        break;
      }

      case "system.ack":
      case "system.error":
        if (msg.action === "system.error") {
          console.error("[AgentWS] Server error:", msg.payload);
        }
        break;

      case "server.message": {
        const payload = msg.payload as unknown as ServerMessagePayload;
        callbacks.onMessage?.({
          id: payload.message_id,
          role: payload.role,
          content: payload.content,
          created_at: payload.created_at,
          operator: payload.operator,
          images: payload.images,
          is_delivered: payload.is_delivered,
          delivered_at: payload.delivered_at,
          read_at: payload.read_at,
          read_by: payload.read_by,
        });
        break;
      }

      case "server.read_receipt": {
        const payload = msg.payload as unknown as ReadReceiptPayload;
        callbacks.onReadReceipt?.(payload);
        break;
      }

      case "server.typing": {
        const payload = msg.payload as unknown as TypingPayload;
        if (payload.role === "user") {
          setUserTyping(payload.is_typing);
        }
        break;
      }

      case "server.handoff_started": {
        const payload = msg.payload as unknown as HandoffStartedPayload;
        setConversationState((prev) => {
          const newState: ConversationState = {
            ...prev,
            handoff_state: "human",
            operator: payload.operator,
          };
          callbacks.onStateChange?.(newState);
          return newState;
        });
        break;
      }

      case "server.handoff_ended": {
        setConversationState((prev) => {
          const newState: ConversationState = {
            ...prev,
            handoff_state: "ai",
            operator: undefined,
          };
          callbacks.onStateChange?.(newState);
          return newState;
        });
        break;
      }

      case "server.user_online": {
        const payload = msg.payload as unknown as UserPresencePayload;
        setConversationState((prev) => ({
          ...prev,
          user_online: true,
          peer_last_online_at: payload.last_online_at,
        }));
        break;
      }

      case "server.user_offline": {
        const payload = msg.payload as unknown as UserPresencePayload;
        setConversationState((prev) => ({
          ...prev,
          user_online: false,
          peer_last_online_at: payload.last_online_at,
        }));
        setUserTyping(false);
        break;
      }

      case "server.message_withdrawn": {
        const payload = msg.payload as unknown as MessageWithdrawnPayload;
        callbacks.onMessageWithdrawn?.(payload);
        break;
      }

      case "server.message_edited": {
        const payload = msg.payload as unknown as MessageEditedPayload;
        callbacks.onMessageEdited?.(payload);
        break;
      }

      case "server.messages_deleted": {
        const payload = msg.payload as unknown as MessagesDeletedPayload;
        callbacks.onMessagesDeleted?.(payload);
        break;
      }
    }
  }, []);

  // 创建/销毁 manager
  useEffect(() => {
    if (!enabled || !conversationId || !agentId) {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
        setConnectionState("disconnected");
        setConnectionId(null);
      }
      return;
    }

    if (managerRef.current?.getConversationId() === conversationId) {
      return;
    }

    if (managerRef.current) {
      managerRef.current.destroy();
    }

    const baseUrl = wsBaseUrl || getWebSocketBaseUrl();
    const manager = createAgentWebSocketManager(baseUrl, conversationId, agentId);
    managerRef.current = manager;

    manager.onStateChange((state) => {
      setConnectionState(state);
      if (state === "disconnected") {
        setConnectionId(null);
      }
    });

    manager.onMessage(handleMessage);

    manager.onError((error) => {
      console.error("[AgentWS] Error:", error);
    });

    manager.connect();

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, conversationId, agentId, wsBaseUrl]);

  // 操作方法
  const sendMessage = useCallback((content: string, images?: ImageAttachment[]) => {
    const payload: Record<string, unknown> = {
      content,
      message_id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    };
    if (images && images.length > 0) {
      payload.images = images;
    }
    managerRef.current?.send("client.agent.send_message", payload);
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    managerRef.current?.send("client.agent.typing", { is_typing: isTyping });
  }, []);

  const startHandoff = useCallback((reason?: string) => {
    managerRef.current?.send("client.agent.start_handoff", { reason: reason || "" });
  }, []);

  const endHandoff = useCallback((summary?: string) => {
    managerRef.current?.send("client.agent.end_handoff", { summary: summary || "" });
  }, []);

  const markAsRead = useCallback((messageIds: string[]) => {
    managerRef.current?.send("client.agent.read", { message_ids: messageIds });
  }, []);

  const withdrawMessage = useCallback((messageId: string, reason?: string) => {
    managerRef.current?.send("client.agent.withdraw_message", {
      message_id: messageId,
      reason: reason || "",
    });
  }, []);

  const editMessage = useCallback((messageId: string, newContent: string, regenerate = true) => {
    managerRef.current?.send("client.agent.edit_message", {
      message_id: messageId,
      new_content: newContent,
      regenerate,
    });
  }, []);

  const reconnect = useCallback(() => {
    managerRef.current?.connect();
  }, []);

  return {
    connectionState,
    isConnected: connectionState === "connected",
    connectionId,
    conversationState,
    userTyping,
    sendMessage,
    setTyping,
    startHandoff,
    endHandoff,
    markAsRead,
    withdrawMessage,
    editMessage,
    reconnect,
  };
}
