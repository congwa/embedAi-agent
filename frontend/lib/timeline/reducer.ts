/**
 * Timeline reducer 函数
 *
 * 基于 SDK v0.2.0 composeReducers 架构：
 * - 业务扩展事件由 businessReducer 处理（support 扩展、assistant.final 推理转内容）
 * - 基础事件委托给 SDK 内置 timelineReducer
 */

import {
  composeReducers as sdkComposeReducers,
  type CustomReducer as SDKCustomReducer,
} from "@embedease/chat-sdk";
import type { ChatEvent } from "@/types/chat";
import type {
  TimelineState,
  LLMCallClusterItem,
  FinalItem,
  SupportEventItem,
  ReasoningSubItem,
  ContentSubItem,
} from "./types";
import {
  insertItem,
  updateItemById,
} from "./helpers";


// ==================== 业务扩展：support.* 事件 ====================


/** 处理 support.* 事件（不依赖 turnId） */
function handleSupportEvent(
  state: TimelineState,
  event: ChatEvent,
  turnId: string,
  now: number
): TimelineState {
  switch (event.type) {
    case "support.handoff_started":
    case "support.handoff_ended":
    case "support.human_message":
    case "support.human_mode":
    case "support.connected": {
      const eventType = event.type.replace("support.", "") as SupportEventItem["eventType"];
      const payload = event.payload as {
        message?: string;
        content?: string;
        operator?: string;
        message_id?: string;
      };
      const item: SupportEventItem = {
        type: "support.event",
        id: `support:${event.seq || crypto.randomUUID()}`,
        turnId,
        eventType,
        message: payload?.message,
        content: payload?.content,
        operator: payload?.operator,
        messageId: payload?.message_id,
        ts: now,
      };
      return insertItem(state, item);
    }

    case "support.ping":
      return state;

    case "support.message_withdrawn": {
      const payload = event.payload as {
        message_id: string;
        withdrawn_by: string;
        withdrawn_at: string;
      };
      const msgIndex = state.indexById[payload.message_id];
      if (msgIndex !== undefined) {
        const timeline = [...state.timeline];
        const item = timeline[msgIndex];
        if (item.type === "user.message") {
          timeline[msgIndex] = {
            ...item,
            isWithdrawn: true,
            withdrawnAt: payload.withdrawn_at,
            withdrawnBy: payload.withdrawn_by,
          };
          return { ...state, timeline };
        }
      }
      return state;
    }

    case "support.message_edited": {
      const payload = event.payload as {
        message_id: string;
        new_content: string;
        edited_by: string;
        edited_at: string;
        deleted_message_ids?: string[];
      };
      let newState = state;
      const msgIndex = state.indexById[payload.message_id];
      if (msgIndex !== undefined) {
        const timeline = [...newState.timeline];
        const item = timeline[msgIndex];
        if (item.type === "user.message") {
          timeline[msgIndex] = {
            ...item,
            content: payload.new_content,
            isEdited: true,
            editedAt: payload.edited_at,
            editedBy: payload.edited_by,
          };
          newState = { ...newState, timeline };
        }
      }
      if (payload.deleted_message_ids && payload.deleted_message_ids.length > 0) {
        const deletedSet = new Set(payload.deleted_message_ids);
        const timeline = newState.timeline.filter((item) => !deletedSet.has(item.id));
        const indexById: Record<string, number> = {};
        timeline.forEach((item, i) => {
          indexById[item.id] = i;
        });
        newState = { ...newState, timeline, indexById };
      }
      return newState;
    }

    case "support.messages_deleted": {
      const payload = event.payload as { message_ids: string[] };
      if (!payload.message_ids || payload.message_ids.length === 0) return state;
      const deletedSet = new Set(payload.message_ids);
      const timeline = state.timeline.filter((item) => !deletedSet.has(item.id));
      const indexById: Record<string, number> = {};
      timeline.forEach((item, i) => {
        indexById[item.id] = i;
      });
      return { ...state, timeline, indexById };
    }

    default:
      return state;
  }
}


// ==================== 业务扩展：assistant.final 推理转内容修复 ====================


/**
 * 处理 assistant.final 事件（覆盖 SDK 默认行为）
 *
 * 额外逻辑：如果最后一个 LLM cluster 只有 reasoning 没有 content，
 * 把 reasoning 的内容作为 content 添加（硅基流动模型修复）
 */
function handleAssistantFinal(
  state: TimelineState,
  event: ChatEvent,
  turnId: string,
  now: number
): TimelineState {
  const payload = event.payload as { content?: string; reasoning?: string };

  console.log("[reducer] assistant.final received:", {
    content: payload.content,
    reasoningLength: payload.reasoning?.length,
    reasoningPreview: payload.reasoning?.slice(0, 100),
  });

  let newState = state;
  for (const item of state.timeline) {
    if (item.type === "llm.call.cluster" && item.turnId === turnId) {
      newState = updateItemById(newState, item.id, (cluster) => {
        if (cluster.type !== "llm.call.cluster") return cluster;
        const children = cluster.children.map((child) =>
          child.type === "reasoning" && child.isOpen ? { ...child, isOpen: false } : child
        );
        return { ...cluster, children };
      });
    }
  }

  // 检查最后一个 LLM cluster 是否只有 reasoning 没有 content
  const llmClusters = newState.timeline.filter(
    (item): item is LLMCallClusterItem =>
      item.type === "llm.call.cluster" && item.turnId === turnId
  );

  if (llmClusters.length > 0) {
    const lastCluster = llmClusters[llmClusters.length - 1];
    const hasContent = lastCluster.children.some((child) => child.type === "content");
    const reasoningItems = lastCluster.children.filter(
      (child): child is ReasoningSubItem => child.type === "reasoning"
    );

    if (!hasContent && reasoningItems.length > 0) {
      const reasoningText = reasoningItems.map((r) => r.text).join("");
      console.log("[reducer] Converting reasoning to content:", reasoningText.slice(0, 100));

      const contentSubItem: ContentSubItem = {
        type: "content",
        id: crypto.randomUUID(),
        text: reasoningText,
        ts: now,
      };

      newState = updateItemById(newState, lastCluster.id, (cluster) => {
        if (cluster.type !== "llm.call.cluster") return cluster;
        const newChildren = cluster.children.filter((child) => child.type !== "reasoning");
        newChildren.push(contentSubItem);
        return {
          ...cluster,
          children: newChildren,
          childIndexById: {
            ...Object.fromEntries(
              newChildren.map((child, idx) => [child.id, idx])
            ),
          },
        };
      });
    }
  }

  const finalItem: FinalItem = {
    type: "final",
    id: `final:${event.seq}`,
    turnId,
    content: payload.content,
    ts: now,
  };
  newState = insertItem(newState, finalItem);

  return {
    ...newState,
    activeTurn: { ...newState.activeTurn, isStreaming: false },
  };
}


// ==================== 组合 Reducer ====================


/**
 * 业务 reducer：处理项目特有的扩展事件
 *
 * 符合 SDK CustomReducer 协议：
 * - 返回 TimelineState 表示已处理
 * - 返回 null 表示未处理，交给 SDK 内置 reducer 兜底
 *
 * 处理：
 * - support.* 扩展事件（消息撤回/编辑/删除等）
 * - assistant.final 推理转内容修复（硅基流动模型）
 */
const businessReducer: SDKCustomReducer = (state, event) => {
  const localState = state as unknown as TimelineState;
  const chatEvent = event as ChatEvent;
  const turnId = localState.activeTurn.turnId;
  const now = Date.now();

  // support.* 事件不依赖 turnId，始终由业务 reducer 处理
  if (chatEvent.type.startsWith("support.")) {
    return handleSupportEvent(localState, chatEvent, turnId || `ws-${now}`, now) as unknown as ReturnType<SDKCustomReducer>;
  }

  // assistant.final 覆盖 SDK 行为（需要 turnId）
  if (chatEvent.type === "assistant.final" && turnId) {
    return handleAssistantFinal(localState, chatEvent, turnId, now) as unknown as ReturnType<SDKCustomReducer>;
  }

  // 其他事件不处理，交给 SDK 内置 reducer
  return null;
};


/**
 * 组合后的 Timeline reducer
 *
 * 使用 SDK composeReducers：businessReducer → SDK 内置 timelineReducer
 * - businessReducer 处理项目特有事件，返回 null 表示未处理
 * - SDK timelineReducer 处理所有基础事件（meta.start, llm.call.*, tool.*, 等）
 */
const _composedReducer = sdkComposeReducers(businessReducer);

export function timelineReducer(state: TimelineState, event: ChatEvent): TimelineState {
  return _composedReducer(
    state as Parameters<typeof _composedReducer>[0],
    event as Parameters<typeof _composedReducer>[1]
  ) as unknown as TimelineState;
}
