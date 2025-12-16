"""聊天 API"""

import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db_session
from app.core.logging import get_logger
from app.schemas.chat import ChatRequest
from app.services.chat_stream import ChatStreamOrchestrator
from app.services.agent.agent import agent_service
from app.services.conversation import ConversationService
from app.services.streaming.sse import encode_sse

router = APIRouter(prefix="/api/v1", tags=["chat"])
logger = get_logger("chat")


@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """流式聊天接口

    使用 SSE (Server-Sent Events) 返回流式响应。

    事件类型:
    - meta.start: 开始 {"type": "meta.start", "payload": {"assistant_message_id": "...", "user_message_id": "..."}}
    - assistant.delta: 文本增量 {"type": "assistant.delta", "payload": {"delta": "..."}}
    - assistant.products: 商品数据 {"type": "assistant.products", "payload": {"items": [...]}}
    - assistant.final: 完成 {"type": "assistant.final", "payload": {"content": "...", "products": [...], "reasoning": "..."}}
    - error: 错误 {"type": "error", "payload": {"message": "..."}}
    """
    conversation_service = ConversationService(db)
    
    # 保存用户消息
    user_message = await conversation_service.add_message(
        conversation_id=request.conversation_id,
        role="user",
        content=request.message,
    )
    logger.info(
        "保存用户消息",
        message_id=user_message.id,
        conversation_id=request.conversation_id,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        """生成 SSE 事件流"""
        assistant_message_id = str(uuid.uuid4())
        orchestrator = ChatStreamOrchestrator(
            conversation_service=conversation_service,
            agent_service=agent_service,
            conversation_id=request.conversation_id,
            user_id=request.user_id,
            user_message=request.message,
            user_message_id=user_message.id,
            assistant_message_id=assistant_message_id,
        )

        async for event in orchestrator.run():
            yield encode_sse(event)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
