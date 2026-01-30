"""客服支持 API

提供：
- 客服介入/结束 API
- 人工消息发送 API
- 会话状态查询 API
- 客服端 SSE 连接
"""

import json
import time
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db_session
from app.core.logging import get_logger
from app.schemas.support import (
    ConversationListItem,
    ConversationListResponse,
    ConversationStateResponse,
    HandoffEndRequest,
    HandoffResponse,
    HandoffStartRequest,
    HumanMessageRequest,
    HumanMessageResponse,
    SupportStatsResponse,
)
from app.schemas.websocket import WSAction, WSRole
from app.services.support.handoff import HandoffService
from app.services.support.heat_score import get_conversations_with_heat, get_support_stats
from app.services.websocket.handlers.base import build_server_message
from app.services.websocket.manager import ws_manager

router = APIRouter(prefix="/api/v1/support", tags=["support"])
logger = get_logger("router.support")


@router.post("/handoff/{conversation_id}", response_model=HandoffResponse)
async def start_handoff(
    conversation_id: str,
    request: HandoffStartRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """开始客服介入
    
    将会话切换到人工客服模式，后续用户消息将不再触发 RAG。
    """
    service = HandoffService(db)
    result = await service.start_handoff(
        conversation_id,
        operator=request.operator,
        reason=request.reason,
    )

    if result.get("success"):
        # 通过 WebSocket 推送给用户
        ws_msg = build_server_message(
            action=WSAction.SERVER_HANDOFF_STARTED,
            payload={
                "operator": request.operator,
                "reason": request.reason,
                "message": "客服已上线，正在为您服务",
            },
            conversation_id=conversation_id,
        )
        ws_sent = await ws_manager.send_to_role(conversation_id, WSRole.USER, ws_msg)

        logger.info(
            "客服介入通知已发送",
            conversation_id=conversation_id,
            operator=request.operator,
            ws_sent=ws_sent,
        )

    return HandoffResponse(**result)


@router.post("/handoff/{conversation_id}/close", response_model=HandoffResponse)
async def end_handoff(
    conversation_id: str,
    request: HandoffEndRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """结束客服介入
    
    将会话切换回 AI 模式。
    """
    service = HandoffService(db)
    result = await service.end_handoff(
        conversation_id,
        operator=request.operator,
        summary=request.summary,
    )

    if result.get("success"):
        # 通过 WebSocket 推送给用户
        ws_msg = build_server_message(
            action=WSAction.SERVER_HANDOFF_ENDED,
            payload={
                "operator": request.operator,
                "summary": request.summary,
                "message": "人工客服已结束服务，您可以继续与智能助手对话",
            },
            conversation_id=conversation_id,
        )
        ws_sent = await ws_manager.send_to_role(conversation_id, WSRole.USER, ws_msg)

        logger.info(
            "客服结束通知已发送",
            conversation_id=conversation_id,
            operator=request.operator,
            ws_sent=ws_sent,
        )

    return HandoffResponse(**result)


@router.get("/handoff/{conversation_id}", response_model=ConversationStateResponse)
async def get_handoff_state(
    conversation_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """获取会话的客服介入状态"""
    service = HandoffService(db)
    conversation = await service.get_conversation(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="会话不存在")

    return ConversationStateResponse(
        conversation_id=conversation.id,
        handoff_state=conversation.handoff_state,
        handoff_operator=conversation.handoff_operator,
        handoff_reason=conversation.handoff_reason,
        handoff_at=conversation.handoff_at.isoformat() if conversation.handoff_at else None,
        last_notification_at=(
            conversation.last_notification_at.isoformat()
            if conversation.last_notification_at
            else None
        ),
    )


@router.post("/message/{conversation_id}", response_model=HumanMessageResponse)
async def send_human_message(
    conversation_id: str,
    request: HumanMessageRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """客服发送消息
    
    仅当会话处于人工模式时有效。支持发送图片。
    """
    # 验证：必须有内容或图片
    if not request.content.strip() and not request.has_images:
        return HumanMessageResponse(
            success=False,
            error="发送失败：消息内容和图片不能同时为空",
        )

    service = HandoffService(db)
    
    # 准备图片数据
    images_data = None
    if request.has_images:
        images_data = [img.model_dump() for img in request.images]  # type: ignore
    
    message = await service.add_human_message(
        conversation_id,
        content=request.content,
        operator=request.operator,
        images=images_data,
    )

    if not message:
        return HumanMessageResponse(
            success=False,
            error="发送失败：会话不存在或未在人工模式",
        )

    # 通过 WebSocket 发送给用户
    from datetime import datetime
    ws_payload = {
        "message_id": message.id,
        "role": "human_agent",
        "content": message.content,
        "created_at": message.created_at.isoformat(),
        "operator": request.operator,
        "is_delivered": True,
        "delivered_at": datetime.now().isoformat(),
    }
    if images_data:
        ws_payload["images"] = images_data

    ws_msg = build_server_message(
        action=WSAction.SERVER_MESSAGE,
        payload=ws_payload,
        conversation_id=conversation_id,
    )
    await ws_manager.send_to_role(conversation_id, WSRole.USER, ws_msg)

    return HumanMessageResponse(
        success=True,
        message_id=message.id,
        conversation_id=conversation_id,
        created_at=message.created_at.isoformat(),
    )


@router.get("/conversations")
async def list_conversations(
    state: str | None = None,
    sort_by: str = "heat",  # heat | time
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session),
):
    """获取会话列表（支持热度排序）
    
    Args:
        state: 筛选状态（ai/pending/human），留空返回全部
        sort_by: 排序方式 - heat(热度优先) 或 time(时间优先)
        limit: 分页大小
        offset: 分页偏移
    """
    start = time.perf_counter()
    logger.debug(f"API /conversations: 开始 state={state}, sort_by={sort_by}, limit={limit}, offset={offset}")
    
    items_data, total = await get_conversations_with_heat(
        db,
        state=state,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    logger.debug(f"API /conversations: get_conversations_with_heat 完成，耗时 {(time.perf_counter() - start) * 1000:.2f}ms")

    items = [
        ConversationListItem(
            id=c["id"],
            user_id=c["user_id"],
            title=c["title"],
            handoff_state=c["handoff_state"],
            handoff_operator=c["handoff_operator"],
            user_online=c["user_online"],
            updated_at=c["updated_at"],
            created_at=c["created_at"],
            heat_score=c["heat_score"],
            unread_count=c["unread_count"],
        )
        for c in items_data
    ]

    response = ConversationListResponse(
        items=items,
        total=total,
        offset=offset,
        limit=limit,
    )
    logger.debug(f"API /conversations: 全部完成，总耗时 {(time.perf_counter() - start) * 1000:.2f}ms")
    return response


@router.get("/stats", response_model=SupportStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db_session),
):
    """获取客服统计数据（用于红点提醒）
    
    Returns:
        pending_count: 等待接入数
        human_count: 人工服务中数
        total_unread: 总未读消息数
        high_heat_count: 高热会话数
    """
    start = time.perf_counter()
    logger.debug("API /stats: 开始")
    
    stats = await get_support_stats(db)
    
    logger.debug(f"API /stats: 全部完成，总耗时 {(time.perf_counter() - start) * 1000:.2f}ms")
    return SupportStatsResponse(**stats)


@router.get("/connections/{conversation_id}")
async def get_connections(conversation_id: str):
    """获取会话的 WebSocket 连接数统计"""
    conns = ws_manager.get_connections_by_conversation(conversation_id)
    user_count = sum(1 for c in conns if c.role.value == "user")
    agent_count = sum(1 for c in conns if c.role.value == "agent")
    return {"user": user_count, "agent": agent_count, "total": len(conns)}
