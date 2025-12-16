"""LangGraph Context：在工具/中间件/节点内统一发出流式事件。

目标：让工具/中间件不关心 HTTP/SSE，只关心 `type + payload`。

用法：
- Orchestrator 在一次 chat run 开始时创建 `ChatContext(emitter=...)`
- 调用 agent 时通过 `context=ChatContext(...)` 注入（需 `context_schema=ChatContext`）
- 工具签名可接收 `ToolRuntime[ChatContext]`，然后 `runtime.context.emitter.emit(...)`
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


class DomainEmitter(Protocol):
    """业务事件发射器（不关心 SSE/HTTP，只关心 type + payload）。"""

    def emit(self, type: str, payload: Any) -> None: ...


@dataclass(frozen=True)
class ChatContext:
    """Graph run scoped context（通过 context_schema 注入）。"""

    conversation_id: str
    user_id: str
    assistant_message_id: str
    emitter: DomainEmitter


