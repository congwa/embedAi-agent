/**
 * Timeline 公共 action 函数
 */

import type { ImageAttachment } from "../core/types";
import type {
  TimelineState,
  TimelineItemBase,
  TimelineItem,
  UserMessageItem,
  GreetingItem,
  WaitingItem,
} from "./types";
import { insertItem } from "./helpers";

export function addUserMessage<T extends TimelineItemBase = TimelineItem>(
  state: TimelineState<T>,
  id: string,
  content: string,
  images?: ImageAttachment[]
): TimelineState<T> {
  const item: UserMessageItem = {
    type: "user.message",
    id,
    turnId: id,
    content,
    images,
    ts: Date.now(),
  };
  return insertItem(state, item as unknown as T);
}

export function addGreetingMessage<T extends TimelineItemBase = TimelineItem>(
  state: TimelineState<T>,
  greeting: {
    id: string;
    title?: string;
    subtitle?: string;
    body: string;
    cta?: { text: string; payload: string };
    delayMs?: number;
    channel?: string;
  }
): TimelineState<T> {
  const item: GreetingItem = {
    type: "greeting",
    id: greeting.id,
    turnId: greeting.id,
    title: greeting.title,
    subtitle: greeting.subtitle,
    body: greeting.body,
    cta: greeting.cta,
    delayMs: greeting.delayMs || 0,
    channel: greeting.channel || "web",
    ts: Date.now(),
  };
  return insertItem(state, item as unknown as T);
}

export function startAssistantTurn<T extends TimelineItemBase = TimelineItem>(
  state: TimelineState<T>,
  turnId: string
): TimelineState<T> {
  const waitingItem: WaitingItem = {
    type: "waiting",
    id: `waiting-${turnId}`,
    turnId,
    ts: Date.now(),
  };
  const newState = insertItem(state, waitingItem as unknown as T);

  return {
    ...newState,
    activeTurn: {
      turnId,
      currentLlmCallId: null,
      currentToolCallId: null,
      isStreaming: true,
    },
  };
}

export function clearTurn<T extends TimelineItemBase = TimelineItem>(
  state: TimelineState<T>,
  turnId: string
): TimelineState<T> {
  const timeline = state.timeline.filter((item) => item.turnId !== turnId);
  const indexById: Record<string, number> = {};
  timeline.forEach((item, i) => {
    indexById[item.id] = i;
  });
  return {
    ...state,
    timeline,
    indexById,
    activeTurn: {
      turnId: null,
      currentLlmCallId: null,
      currentToolCallId: null,
      isStreaming: false,
    },
  };
}

export function endTurn<T extends TimelineItemBase = TimelineItem>(
  state: TimelineState<T>
): TimelineState<T> {
  return {
    ...state,
    activeTurn: {
      ...state.activeTurn,
      isStreaming: false,
    },
  };
}
