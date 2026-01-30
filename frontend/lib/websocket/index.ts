/**
 * WebSocket 模块导出
 */

export {
  WebSocketManager,
  createUserWebSocketManager,
  createAgentWebSocketManager,
  type ConnectionState,
  type WSMessage,
  type WebSocketConfig,
  type MessageHandler,
  type StateChangeHandler,
  type ErrorHandler,
} from "./WebSocketManager";
