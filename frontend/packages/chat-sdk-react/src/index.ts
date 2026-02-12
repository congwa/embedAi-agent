/**
 * @embedease/chat-sdk-react
 *
 * React Hooks for Chat SDK
 */

// Hooks
export { useTimeline, type UseTimelineOptions, type UseTimelineReturn } from "./use-timeline";
export { useChat, type UseChatOptions, type UseChatReturn } from "./use-chat";
export { useWebSocket, type UseWebSocketOptions, type UseWebSocketReturn } from "./use-websocket";

// Zustand Store Factory
export {
  createChatStoreSlice,
  type CreateChatStoreOptions,
  type ChatStoreState,
  type ChatStoreApi,
  type StreamEndResult,
} from "./create-chat-store";

// Re-export core types from SDK
export {
  type TimelineState,
  type TimelineItem,
  type TimelineItemBase,
  type ChatEvent,
  type ChatRequest,
  type ImageAttachment,
  type HistoryMessage,
  type ConnectionState,
  type WSMessage,
} from "@embedease/chat-sdk";

// Re-export reducer composition from SDK
export {
  composeReducers,
  type CustomReducer,
  insertItem,
  updateItemById,
  removeWaitingItem,
} from "@embedease/chat-sdk";
