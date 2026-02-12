/**
 * Reducer 组合器
 *
 * 支持用户注册自定义 reducer 来处理业务特定的事件类型，
 * 未被任何自定义 reducer 处理的事件会自动交给 SDK 内置 reducer。
 *
 * @example
 * ```typescript
 * import { composeReducers, insertItem, type CustomReducer } from "@embedease/chat-sdk";
 *
 * const businessReducer: CustomReducer<MyTimelineItem> = (state, event) => {
 *   const evt = event as Record<string, unknown>;
 *   switch (evt.type as string) {
 *     case "intent.extracted":
 *       return insertItem(state, { type: "intent.extracted", ... } as MyTimelineItem);
 *     default:
 *       return null; // 未处理，交给下一个 reducer
 *   }
 * };
 *
 * export const myReducer = composeReducers<MyTimelineItem>(businessReducer);
 * ```
 */

import type { ChatEvent } from "../core/events";
import type { TimelineItemBase, TimelineItem, TimelineState } from "./types";
import { timelineReducer as builtinReducer } from "./reducer";

/**
 * 自定义 Reducer 类型
 *
 * - 返回 TimelineState 表示已处理
 * - 返回 null/undefined 表示未处理，交给下一个 reducer
 */
export type CustomReducer<T extends TimelineItemBase = TimelineItem> = (
  state: TimelineState<T>,
  event: ChatEvent | Record<string, unknown>
) => TimelineState<T> | null | undefined;

/**
 * 组合多个 reducer：按顺序尝试用户 reducer，未处理的交给 SDK 内置 reducer
 *
 * @param customReducers - 自定义 reducer 列表（按优先级排列）
 * @returns 组合后的 reducer 函数
 */
export function composeReducers<T extends TimelineItemBase = TimelineItem>(
  ...customReducers: CustomReducer<T>[]
): (state: TimelineState<T>, event: ChatEvent | Record<string, unknown>) => TimelineState<T> {
  return (state: TimelineState<T>, event: ChatEvent | Record<string, unknown>): TimelineState<T> => {
    for (const reducer of customReducers) {
      const result = reducer(state, event);
      if (result !== null && result !== undefined) {
        return result;
      }
    }
    return builtinReducer(
      state as TimelineState,
      event as ChatEvent
    ) as unknown as TimelineState<T>;
  };
}
