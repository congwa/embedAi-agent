"""聊天 API"""

import json
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db_session
from app.core.logging import get_logger
from app.schemas.chat import ChatRequest
from app.services.agent.agent import agent_service
from app.services.conversation import ConversationService

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
    - text: 文本内容 {"type": "text", "content": "..."}
    - products: 商品数据 {"type": "products", "data": [...]}
    - done: 完成 {"type": "done", "message_id": "..."}
    - error: 错误 {"type": "error", "content": "..."}
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
        full_content = ""
        products_json = None
        
        try:
            async for event in agent_service.chat(
                message=request.message,
                conversation_id=request.conversation_id,
                user_id=request.user_id,
            ):
                event_type = event.get("type")
                
                if event_type == "text":
                    content = event.get("content", "")
                    full_content += content
                    data = json.dumps({"type": "text", "content": content}, ensure_ascii=False)
                    yield f"data: {data}\n\n"
                
                elif event_type == "products":
                    products_data = event.get("data")
                    if products_data:
                        products_json = json.dumps(products_data, ensure_ascii=False)
                        data = json.dumps({"type": "products", "data": products_data}, ensure_ascii=False)
                        yield f"data: {data}\n\n"
                
                elif event_type == "done":
                    # 保存助手消息
                    message_id = str(uuid.uuid4())
                    await conversation_service.add_message(
                        conversation_id=request.conversation_id,
                        role="assistant",
                        content=full_content,
                        products=products_json,
                    )
                    
                    logger.info(
                        "保存助手消息",
                        message_id=message_id,
                        conversation_id=request.conversation_id,
                        content_length=len(full_content),
                    )
                    
                    data = json.dumps({"type": "done", "message_id": message_id}, ensure_ascii=False)
                    yield f"data: {data}\n\n"
        
        except Exception as e:
            logger.exception(
                "聊天错误",
                conversation_id=request.conversation_id,
                error=str(e),
            )
            data = json.dumps({"type": "error", "content": str(e)}, ensure_ascii=False)
            yield f"data: {data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
