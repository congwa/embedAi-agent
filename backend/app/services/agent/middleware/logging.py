"""日志中间件

负责记录每次 LLM 调用的完整输入输出。
这是最外层的中间件，包裹所有其他中间件。
"""

import time
from collections.abc import Awaitable, Callable
from typing import Any

from langchain.agents.middleware.types import AgentMiddleware, ModelRequest, ModelResponse
from langchain_core.messages import BaseMessage

from app.core.logging import get_logger
from app.schemas.events import StreamEventType

logger = get_logger("middleware.llm")


def _serialize_message(msg: BaseMessage) -> dict[str, Any]:
    """序列化消息用于日志"""
    return {
        "type": type(msg).__name__,
        "content": str(msg.content)[:500] if msg.content else None,
        "tool_calls": getattr(msg, "tool_calls", None),
    }


def _serialize_messages(messages: list) -> list[dict[str, Any]]:
    """序列化消息列表"""
    return [_serialize_message(m) for m in messages if isinstance(m, BaseMessage)]


class LoggingMiddleware(AgentMiddleware):
    """日志中间件

    记录每次 LLM 调用的：
    - 系统提示词
    - 输入消息
    - 工具列表
    - 响应格式
    - 输出消息
    - 结构化响应
    - 调用耗时
    """

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        """记录 LLM 调用的输入输出"""
        start_time = time.time()
        emitter = _try_get_emitter(request)
        if emitter:
            emitter.emit(
                StreamEventType.LLM_CALL_START.value,
                {
                    "message_count": len(request.messages),
                },
            )

        # 序列化输入
        input_data = {
            "system_message": (
                str(request.system_message.content)[:500]
                if request.system_message
                else None
            ),
            "messages": _serialize_messages(request.messages),
            "message_count": len(request.messages),
            "tools": [
                t.name if hasattr(t, "name") else str(t)[:50]
                for t in request.tools
            ],
            "response_format": (
                str(request.response_format)[:100]
                if request.response_format
                else None
            ),
        }

        logger.info("LLM 调用开始", llm_input=input_data)

        try:
            response = await handler(request)
            elapsed_ms = int((time.time() - start_time) * 1000)

            # 序列化输出
            output_data = {
                "messages": _serialize_messages(response.result),
                "message_count": len(response.result),
                "has_structured_response": response.structured_response is not None,
                "structured_response": (
                    self._serialize_structured(response.structured_response)
                    if response.structured_response
                    else None
                ),
                "elapsed_ms": elapsed_ms,
            }

            logger.info("LLM 调用完成", llm_output=output_data)
            if emitter:
                emitter.emit(
                    StreamEventType.LLM_CALL_END.value,
                    {
                        "elapsed_ms": elapsed_ms,
                        "message_count": len(response.result),
                    },
                )
            return response

        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(
                "LLM 调用失败",
                error=str(e),
                error_type=type(e).__name__,
                elapsed_ms=elapsed_ms,
                exc_info=True,
            )
            if emitter:
                emitter.emit(
                    StreamEventType.LLM_CALL_END.value,
                    {
                        "elapsed_ms": elapsed_ms,
                        "error": str(e),
                    },
                )
            raise

    def _serialize_structured(self, obj: Any) -> dict[str, Any] | str:
        """序列化结构化响应"""
        if hasattr(obj, "model_dump"):
            data = obj.model_dump()
            # 截断长文本
            for key, value in data.items():
                if isinstance(value, str) and len(value) > 500:
                    data[key] = value[:500] + "..."
            return data
        return str(obj)[:500]


def _try_get_emitter(request: Any):
    """尽量从 request 中取出 ChatContext.emitter（避免强依赖具体实现字段）。"""

    # 约定：orchestrator 将 chat_context 放入 config/metadata 之类的字段中
    for attr in ("config", "metadata"):
        container = getattr(request, attr, None)
        if isinstance(container, dict):
            chat_context = container.get("chat_context") or container.get("metadata", {}).get("chat_context")
            emitter = getattr(chat_context, "emitter", None)
            if emitter and hasattr(emitter, "emit"):
                return emitter
    return None
