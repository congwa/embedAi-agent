"""客服端消息处理器"""

from typing import Any

from app.core.database import get_db_context
from app.core.logging import get_logger
from app.schemas.websocket import WSAction, WSRole
from app.services.websocket.manager import WSConnection, ws_manager
from app.services.websocket.router import ws_router
from app.services.websocket.handlers.base import build_server_message
from app.services.support.handoff import HandoffService

logger = get_logger("websocket.handlers.agent")


@ws_router.handler(WSAction.CLIENT_AGENT_SEND_MESSAGE)
async def handle_agent_send_message(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服发送消息"""
    content = payload["content"]
    
    async with get_db_context() as session:
        handoff_service = HandoffService(session)
        
        # 添加人工消息
        message = await handoff_service.add_human_message(
            conversation_id=conn.conversation_id,
            content=content,
            operator=conn.identity,
        )
        
        if message:
            # 推送给用户端
            server_msg = build_server_message(
                action=WSAction.SERVER_MESSAGE,
                payload={
                    "message_id": message.id,
                    "role": "human_agent",
                    "content": content,
                    "created_at": message.created_at.isoformat(),
                    "operator": conn.identity,
                },
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)
            
            logger.info(
                "客服消息已发送",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                message_id=message.id,
            )
        else:
            logger.warning(
                "客服消息发送失败：会话不在人工模式",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
            )


@ws_router.handler(WSAction.CLIENT_AGENT_TYPING)
async def handle_agent_typing(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服输入状态"""
    server_msg = build_server_message(
        action=WSAction.SERVER_TYPING,
        payload={"role": "agent", "is_typing": payload["is_typing"]},
        conversation_id=conn.conversation_id,
    )
    await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)


@ws_router.handler(WSAction.CLIENT_AGENT_READ)
async def handle_agent_read(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服已读回执"""
    server_msg = build_server_message(
        action=WSAction.SERVER_READ_RECEIPT,
        payload={"role": "agent", "message_ids": payload["message_ids"]},
        conversation_id=conn.conversation_id,
    )
    await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)


@ws_router.handler(WSAction.CLIENT_AGENT_START_HANDOFF)
async def handle_agent_start_handoff(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服主动介入"""
    reason = payload.get("reason", "")
    
    async with get_db_context() as session:
        handoff_service = HandoffService(session)
        result = await handoff_service.start_handoff(
            conn.conversation_id,
            operator=conn.identity,
            reason=reason,
        )
        
        if result.get("success"):
            # 通知用户端
            server_msg = build_server_message(
                action=WSAction.SERVER_HANDOFF_STARTED,
                payload={"operator": conn.identity, "reason": reason},
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)
            
            # 通知其他客服端
            state_msg = build_server_message(
                action=WSAction.SERVER_CONVERSATION_STATE,
                payload={"handoff_state": "human", "operator": conn.identity},
                conversation_id=conn.conversation_id,
            )
            await ws_manager.broadcast_to_conversation(
                conn.conversation_id,
                state_msg,
                exclude_conn_id=conn.id,
            )
            
            logger.info(
                "客服介入成功",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                operator=conn.identity,
            )
        else:
            logger.warning(
                "客服介入失败",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                error=result.get("error"),
            )


@ws_router.handler(WSAction.CLIENT_AGENT_END_HANDOFF)
async def handle_agent_end_handoff(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服结束介入"""
    summary = payload.get("summary", "")
    
    async with get_db_context() as session:
        handoff_service = HandoffService(session)
        result = await handoff_service.end_handoff(
            conn.conversation_id,
            operator=conn.identity,
            summary=summary,
        )
        
        if result.get("success"):
            # 通知用户端
            server_msg = build_server_message(
                action=WSAction.SERVER_HANDOFF_ENDED,
                payload={"operator": conn.identity, "summary": summary},
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)
            
            # 通知其他客服端
            state_msg = build_server_message(
                action=WSAction.SERVER_CONVERSATION_STATE,
                payload={"handoff_state": "ai", "operator": None},
                conversation_id=conn.conversation_id,
            )
            await ws_manager.broadcast_to_conversation(
                conn.conversation_id,
                state_msg,
                exclude_conn_id=conn.id,
            )
            
            logger.info(
                "客服介入结束",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                operator=conn.identity,
            )
        else:
            logger.warning(
                "结束介入失败",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                error=result.get("error"),
            )


@ws_router.handler(WSAction.CLIENT_AGENT_TRANSFER)
async def handle_agent_transfer(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服转接"""
    target_agent_id = payload["target_agent_id"]
    reason = payload.get("reason", "")
    
    async with get_db_context() as session:
        handoff_service = HandoffService(session)
        
        # 更新介入客服
        result = await handoff_service.start_handoff(
            conn.conversation_id,
            operator=target_agent_id,
            reason=f"转接自 {conn.identity}: {reason}",
        )
        
        if result.get("success"):
            # 通知用户端
            server_msg = build_server_message(
                action=WSAction.SERVER_HANDOFF_STARTED,
                payload={
                    "operator": target_agent_id,
                    "reason": f"客服转接: {reason}",
                },
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)
            
            logger.info(
                "客服转接成功",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                from_agent=conn.identity,
                to_agent=target_agent_id,
            )
