// 聊天 API

import type { ChatEvent, ChatRequest } from "@/types/chat";
import { getApiBaseUrl } from "./client";

export async function* streamChat(
  request: ChatRequest
): AsyncGenerator<ChatEvent, void, unknown> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data) {
            try {
              const event = JSON.parse(data) as ChatEvent;
              yield event;
            } catch (e) {
              console.error("解析事件失败:", e, data);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
