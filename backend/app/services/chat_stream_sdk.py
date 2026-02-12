"""聊天流编排层 - SDK v0.2.0 版本

使用 Orchestrator + AgentRunner + ContentAggregator 重构。
队列管理、内容聚合、错误处理均由 SDK 自动完成，
业务只需实现 AgentRunner 和 on_stream_end 钩子。
"""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

from langgraph_agent_kit import (
    StreamEvent,
    Orchestrator,
    OrchestratorHooks,
    StreamEndInfo,
)
from langgraph_agent_kit.core.context import ChatContext

from app.core.logging import get_logger
from app.services.conversation import ConversationService

logger = get_logger("chat_stream_sdk")


# ==================== AgentRunner 实现 ====================


class EmbedEaseAgentRunner:
    """AgentRunner 实现：委托给 AgentService.chat_emit()"""

    def __init__(self, agent_service: Any, agent_id: str | None = None) -> None:
        self._agent_service = agent_service
        self._agent_id = agent_id

    async def run(self, message: str, context: ChatContext, **kwargs: Any) -> None:
        await self._agent_service.chat_emit(
            message=message,
            conversation_id=context.conversation_id,
            user_id=context.user_id,
            context=context,
            agent_id=self._agent_id,
        )


# ==================== on_stream_end 钩子 ====================


async def _save_assistant_message(
    info: StreamEndInfo,
    conversation_service: ConversationService,
) -> None:
    """流结束钩子：保存 assistant 消息到数据库"""
    agg = info.aggregator

    products_json = None
    if agg.products is not None:
        products_json = json.dumps(agg.products, ensure_ascii=False)

    tool_calls_data = agg.tool_calls_list or None

    extra_metadata: dict[str, Any] = {}
    if agg.reasoning:
        extra_metadata["reasoning"] = agg.reasoning
    if tool_calls_data:
        extra_metadata["tool_calls_summary"] = [
            {"name": tc.get("name"), "status": tc.get("status")}
            for tc in tool_calls_data
        ]

    latency_ms = info.context.response_latency_ms

    await conversation_service.add_message(
        conversation_id=info.conversation_id,
        role="assistant",
        content=agg.full_content,
        products=products_json,
        message_id=info.assistant_message_id,
        extra_metadata=extra_metadata if extra_metadata else None,
        tool_calls_data=tool_calls_data,
        latency_ms=latency_ms,
    )
    logger.debug(
        "已保存完整 assistant message (SDK v0.2)",
        message_id=info.assistant_message_id,
        content_length=len(agg.full_content),
        tool_call_count=len(tool_calls_data) if tool_calls_data else 0,
    )


# ==================== ChatStreamOrchestratorSDK ====================


class ChatStreamOrchestratorSDK:
    """SDK v0.2.0 版本的聊天流编排器

    内部使用 Orchestrator 自动管理：
    - 事件队列（QueueDomainEmitter + asyncio.Queue）
    - 内容聚合（ContentAggregator: full_content, reasoning, tool_calls, products）
    - meta.start / error 事件自动发送
    - on_stream_end 钩子落库

    与 Legacy 版本保持完全相同的构造函数签名（向后兼容）。
    """

    def __init__(
        self,
        *,
        conversation_service: ConversationService,
        agent_service: Any,
        conversation_id: str,
        user_id: str,
        user_message: str,
        user_message_id: str,
        assistant_message_id: str,
        agent_id: str | None = None,
        images: list[Any] | None = None,
        db: Any = None,
    ) -> None:
        self._conversation_id = conversation_id
        self._user_id = user_id
        self._user_message = user_message
        self._user_message_id = user_message_id
        self._assistant_message_id = assistant_message_id
        self._db = db

        # 构建 Orchestrator
        runner = EmbedEaseAgentRunner(agent_service, agent_id=agent_id)

        async def on_stream_end(info: StreamEndInfo) -> None:
            await _save_assistant_message(info, conversation_service)

        async def on_error(e: Exception, conv_id: str) -> None:
            logger.exception(
                "聊天流编排失败 (SDK v0.2)",
                conversation_id=conv_id,
                error=str(e),
            )

        self._orchestrator = Orchestrator(
            agent_runner=runner,
            hooks=OrchestratorHooks(
                on_stream_end=on_stream_end,
                on_error=on_error,
            ),
        )

    async def run(self) -> AsyncGenerator[StreamEvent, None]:
        """运行编排流程（与旧版本 API 兼容）"""
        async for event in self._orchestrator.run(
            message=self._user_message,
            conversation_id=self._conversation_id,
            user_id=self._user_id,
            assistant_message_id=self._assistant_message_id,
            user_message_id=self._user_message_id,
            db=self._db,
        ):
            yield event
