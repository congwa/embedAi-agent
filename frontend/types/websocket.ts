// WebSocket 协议类型定义

export const WS_PROTOCOL_VERSION = 1;

// 错误码
export type WSErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "AUTH_EXPIRED"
  | "PERMISSION_DENIED"
  | "NOT_IN_HUMAN_MODE"
  | "INVALID_ACTION"
  | "INVALID_PAYLOAD"
  | "MISSING_FIELD"
  | "CONVERSATION_NOT_FOUND"
  | "MESSAGE_SEND_FAILED"
  | "HANDOFF_FAILED"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "CONNECTION_CLOSED";

// 角色
export type WSRole = "user" | "agent";

// Action 类型
export type WSAction =
  // System
  | "system.ping"
  | "system.pong"
  | "system.ack"
  | "system.error"
  | "system.connected"
  | "system.disconnected"
  // Client User
  | "client.user.send_message"
  | "client.user.typing"
  | "client.user.read"
  | "client.user.request_handoff"
  // Client Agent
  | "client.agent.send_message"
  | "client.agent.typing"
  | "client.agent.read"
  | "client.agent.start_handoff"
  | "client.agent.end_handoff"
  | "client.agent.transfer"
  | "client.agent.withdraw_message"
  | "client.agent.edit_message"
  // Server Push
  | "server.message"
  | "server.typing"
  | "server.read_receipt"
  | "server.handoff_started"
  | "server.handoff_ended"
  | "server.user_online"
  | "server.user_offline"
  | "server.agent_online"
  | "server.agent_offline"
  | "server.conversation_state"
  | "server.message_withdrawn"
  | "server.message_edited"
  | "server.messages_deleted";

// 基础消息结构
export interface WSMessage {
  v: number;
  id: string;
  ts: number;
  action: WSAction;
  payload: Record<string, unknown>;
  conversation_id?: string;
  reply_to?: string;
  error?: {
    code: WSErrorCode;
    message: string;
    detail?: unknown;
  };
}

// Payload 类型
export interface ConnectedPayload {
  connection_id: string;
  role: WSRole;
  conversation_id: string;
  handoff_state: string;
  peer_online: boolean;
  peer_last_online_at: string | null;
  unread_count: number;
}

export interface ServerMessagePayload {
  message_id: string;
  role: "user" | "assistant" | "human_agent" | "system";
  content: string;
  created_at: string;
  operator?: string;
  images?: Array<{
    id: string;
    url: string;
    thumbnail_url?: string;
    filename?: string;
  }>;
  is_delivered?: boolean;
  delivered_at?: string;
  read_at?: string;
  read_by?: string;
}

export interface TypingPayload {
  role: string;
  is_typing: boolean;
}

export interface HandoffStartedPayload {
  operator: string;
  reason?: string;
}

export interface HandoffEndedPayload {
  operator: string;
  summary?: string;
}

export interface UserPresencePayload {
  user_id: string;
  conversation_id: string;
  online: boolean;
  last_online_at?: string;
}

export interface AgentPresencePayload {
  operator: string;
  online: boolean;
  last_online_at?: string;
}

export interface ReadReceiptPayload {
  role: string;
  message_ids: string[];
  read_at: string;
  read_by: string;
}

export interface ConversationStatePayload {
  handoff_state: string;
  operator?: string;
}

export interface AckPayload {
  received_id: string;
  status: "ok" | "error";
}

export interface ErrorPayload {
  code: WSErrorCode;
  message: string;
  detail?: unknown;
}

// 消息撤回 Payload
export interface MessageWithdrawnPayload {
  message_id: string;
  withdrawn_by: string;
  withdrawn_at: string;
  reason?: string;
}

// 消息编辑 Payload
export interface MessageEditedPayload {
  message_id: string;
  old_content: string;
  new_content: string;
  edited_by: string;
  edited_at: string;
  deleted_message_ids: string[];
  regenerate_triggered: boolean;
}

// 消息删除 Payload
export interface MessagesDeletedPayload {
  message_ids: string[];
  reason: string;
}

// 客服端消息类型（用于展示）
export interface SupportMessage {
  id: string;
  role: "user" | "assistant" | "human_agent" | "system";
  content: string;
  created_at: string;
  operator?: string;
  images?: Array<{
    id: string;
    url: string;
    thumbnail_url?: string;
    filename?: string;
  }>;
  is_delivered?: boolean;
  delivered_at?: string;
  read_at?: string;
  read_by?: string;
  // 撤回/编辑相关
  is_withdrawn?: boolean;
  withdrawn_at?: string;
  withdrawn_by?: string;
  is_edited?: boolean;
  edited_at?: string;
  edited_by?: string;
}

// 会话状态
export interface ConversationState {
  handoff_state: "ai" | "pending" | "human";
  operator?: string;
  user_online: boolean;
  agent_online: boolean;
  peer_last_online_at?: string;
  unread_count?: number;
}
