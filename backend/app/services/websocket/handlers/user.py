"""用户端消息处理器"""

from typing import Any

from app.core.database import get_db_context
from app.core.logging import get_logger
from app.models.conversation import HandoffState
from app.schemas.websocket import WSAction, WSRole
from app.services.websocket.manager import WSConnection, ws_manager
from app.services.websocket.router import ws_router
from app.services.websocket.handlers.base import build_server_message
from app.services.support.handoff import HandoffService
from app.services.conversation import ConversationService

logger = get_logger("websocket.handlers.user")


@ws_router.handler(WSAction.CLIENT_USER_SEND_MESSAGE)
async def handle_user_send_message(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理用户发送消息"""
    content = payload["content"]
    client_message_id = payload.get("message_id")
    
    async with get_db_context() as session:
        conversation_service = ConversationService(session)
        handoff_service = HandoffService(session)
        
        # 检查 handoff 状态
        handoff_state = await handoff_service.get_handoff_state(conn.conversation_id)
        
        if handoff_state == HandoffState.HUMAN.value:
            # 人工模式：保存消息并转发给客服
            message = await conversation_service.add_message(
                conversation_id=conn.conversation_id,
                role="user",
                content=content,
                message_id=client_message_id,
            )
            
            # 推送给客服端
            server_msg = build_server_message(
                action=WSAction.SERVER_MESSAGE,
                payload={
                    "message_id": message.id,
                    "role": "user",
                    "content": content,
                    "created_at": message.created_at.isoformat(),
                },
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.AGENT, server_msg)
            
            logger.info(
                "用户消息已转发给客服",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                message_id=message.id,
            )
            
        else:
            # AI 模式：保存消息，触发通知
            message = await conversation_service.add_message(
                conversation_id=conn.conversation_id,
                role="user",
                content=content,
                message_id=client_message_id,
            )
            
            # 触发通知（异步，不阻塞）
            try:
                await handoff_service.notify_new_message(
                    conversation_id=conn.conversation_id,
                    user_id=conn.identity,
                    message_preview=content[:200],
                )
            except Exception as e:
                logger.warning("通知发送失败", error=str(e))
            
            logger.info(
                "用户消息已保存（AI模式）",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                message_id=message.id,
            )


@ws_router.handler(WSAction.CLIENT_USER_TYPING)
async def handle_user_typing(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理用户输入状态"""
    server_msg = build_server_message(
        action=WSAction.SERVER_TYPING,
        payload={"role": "user", "is_typing": payload["is_typing"]},
        conversation_id=conn.conversation_id,
    )
    await ws_manager.send_to_role(conn.conversation_id, WSRole.AGENT, server_msg)


@ws_router.handler(WSAction.CLIENT_USER_READ)
async def handle_user_read(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理用户已读回执"""
    server_msg = build_server_message(
        action=WSAction.SERVER_READ_RECEIPT,
        payload={"role": "user", "message_ids": payload["message_ids"]},
        conversation_id=conn.conversation_id,
    )
    await ws_manager.send_to_role(conn.conversation_id, WSRole.AGENT, server_msg)


@ws_router.handler(WSAction.CLIENT_USER_REQUEST_HANDOFF)
async def handle_user_request_handoff(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理用户请求人工客服"""
    reason = payload.get("reason", "用户主动请求")
    
    # 发送通知给客服
    try:
        from app.services.support.notification.dispatcher import notification_dispatcher
        await notification_dispatcher.notify_handoff_request(
            conversation_id=conn.conversation_id,
            user_id=conn.identity,
            reason=reason,
        )
    except Exception as e:
        logger.warning("人工客服请求通知发送失败", error=str(e))
    
    logger.info(
        "用户请求人工客服",
        conn_id=conn.id,
        conversation_id=conn.conversation_id,
        reason=reason,
    )
