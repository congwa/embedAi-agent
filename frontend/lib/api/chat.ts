// 聊天 API

import type { ChatEvent, ChatRequest } from "@/types/chat";
import { getApiBaseUrl } from "./client";

export async function* streamChat(
  request: ChatRequest
): AsyncGenerator<ChatEvent, void, unknown> {
  console.log("[api] 发起聊天请求", request);
  
  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  console.log("[api] 响应状态", response.status, response.statusText);

  if (!response.ok) {
    const error = await response.text();
    console.error("[api] 请求失败", error);
    throw new Error(error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let chunkCount = 0;

  try {
    console.log("[api] 开始读取流");
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("[api] 流读取完成, 总chunks:", chunkCount);
        break;
      }

      chunkCount++;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data) {
            try {
              const event = JSON.parse(data) as ChatEvent;
              console.log("[api] 收到事件", event.type);
              yield event;
            } catch (e) {
              console.error("[api] 解析事件失败:", e, data);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[api] 流读取错误:", error);
    throw error;
  } finally {
    reader.releaseLock();
    console.log("[api] 释放reader");
  }
}
