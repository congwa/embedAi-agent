"""客服端消息处理器"""

from typing import Any

from app.core.dependencies import get_services
from app.core.logging import get_logger
from app.schemas.websocket import WSAction, WSRole
from app.services.websocket.handlers.base import build_server_message
from app.services.websocket.manager import WSConnection, ws_manager
from app.services.websocket.router import ws_router

logger = get_logger("websocket.handlers.agent")


@ws_router.handler(WSAction.CLIENT_AGENT_SEND_MESSAGE)
async def handle_agent_send_message(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服发送消息（支持图片）"""
    from datetime import datetime

    content = payload.get("content", "")
    images = payload.get("images")  # 图片列表

    # 验证：必须有内容或图片
    if not content.strip() and not images:
        logger.warning(
            "客服消息发送失败：消息内容和图片不能同时为空",
            conn_id=conn.id,
            conversation_id=conn.conversation_id,
        )
        return

    async with get_services() as services:
        # 添加人工消息（支持图片）
        message = await services.handoff.add_human_message(
            conversation_id=conn.conversation_id,
            content=content,
            operator=conn.identity,
            images=images,
        )

        if message:
            # 通过 WebSocket 发送给用户
            ws_payload: dict[str, Any] = {
                "message_id": message.id,
                "role": "human_agent",
                "content": content,
                "created_at": message.created_at.isoformat(),
                "operator": conn.identity,
                "is_delivered": True,
                "delivered_at": datetime.now().isoformat(),
            }
            if images:
                ws_payload["images"] = images

            server_msg = build_server_message(
                action=WSAction.SERVER_MESSAGE,
                payload=ws_payload,
                conversation_id=conn.conversation_id,
            )
            ws_sent = await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)

            # 如果成功送达，更新消息状态
            if ws_sent > 0:
                await services.message_repo.mark_as_delivered([message.id])
                logger.info(
                    "客服消息已送达用户",
                    conn_id=conn.id,
                    conversation_id=conn.conversation_id,
                    message_id=message.id,
                    ws_sent=ws_sent,
                    has_images=bool(images),
                )
            else:
                # 消息未送达（用户离线），等用户上线时推送
                logger.info(
                    "客服消息已保存（用户离线，等待送达）",
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
    message_ids = payload["message_ids"]

    # 更新数据库已读状态
    async with get_services() as services:
        count, read_at = await services.message_repo.mark_as_read(message_ids, conn.identity)

    # 推送已读回执给用户端（包含已读时间）
    server_msg = build_server_message(
        action=WSAction.SERVER_READ_RECEIPT,
        payload={
            "role": "agent",
            "message_ids": message_ids,
            "read_at": read_at.isoformat(),
            "read_by": conn.identity,
        },
        conversation_id=conn.conversation_id,
    )
    await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)

    logger.info(
        "客服已读回执",
        conn_id=conn.id,
        conversation_id=conn.conversation_id,
        message_count=count,
    )


@ws_router.handler(WSAction.CLIENT_AGENT_START_HANDOFF)
async def handle_agent_start_handoff(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服主动介入"""
    reason = payload.get("reason", "")

    async with get_services() as services:
        result = await services.handoff.start_handoff(
            conn.conversation_id,
            operator=conn.identity,
            reason=reason,
        )

        success = result.get("success")
        error = result.get("error")
        # 幂等处理：如果会话已处于人工模式，则视为成功
        if not success and error == "会话已在人工模式":
            success = True
            logger.info(
                "客服重复介入请求，忽略",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                operator=conn.identity,
            )
        if success:
            operator = conn.identity
            # 通知用户端
            server_msg = build_server_message(
                action=WSAction.SERVER_HANDOFF_STARTED,
                payload={"operator": operator, "reason": reason},
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, server_msg)

            # 通知其他客服端
            state_msg = build_server_message(
                action=WSAction.SERVER_CONVERSATION_STATE,
                payload={"handoff_state": "human", "operator": operator},
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
                operator=operator,
            )
        else:
            logger.warning(
                "客服介入失败",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                error=error,
            )


@ws_router.handler(WSAction.CLIENT_AGENT_END_HANDOFF)
async def handle_agent_end_handoff(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服结束介入"""
    summary = payload.get("summary", "")

    async with get_services() as services:
        result = await services.handoff.end_handoff(
            conn.conversation_id,
            operator=conn.identity,
            summary=summary,
        )

        success = result.get("success")
        error = result.get("error")
        # 幂等处理：如果会话已是 AI 模式，则视为成功
        if not success and error == "会话未在人工模式":
            success = True
            logger.info(
                "客服重复结束请求，忽略",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                operator=conn.identity,
            )
        if success:
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
                error=error,
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

    async with get_services() as services:
        # 更新介入客服
        result = await services.handoff.start_handoff(
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


@ws_router.handler(WSAction.CLIENT_AGENT_WITHDRAW_MESSAGE)
async def handle_agent_withdraw_message(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服撤回消息"""
    from datetime import datetime, timedelta

    message_id = payload.get("message_id")
    reason = payload.get("reason", "")

    if not message_id:
        logger.warning(
            "撤回消息失败：缺少 message_id",
            conn_id=conn.id,
            conversation_id=conn.conversation_id,
        )
        return

    async with get_services() as services:
        # 获取消息
        message = await services.message_repo.get_by_id(message_id)
        if not message:
            logger.warning(
                "撤回消息失败：消息不存在",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 验证消息属于当前会话
        if message.conversation_id != conn.conversation_id:
            logger.warning(
                "撤回消息失败：消息不属于当前会话",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 检查是否已撤回
        if message.is_withdrawn:
            logger.info(
                "消息已被撤回，忽略重复请求",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 检查时间限制（默认 5 分钟）
        time_limit_minutes = 5
        if datetime.now() - message.created_at > timedelta(minutes=time_limit_minutes):
            logger.warning(
                "撤回消息失败：已超过时间限制",
                conn_id=conn.id,
                message_id=message_id,
                time_limit_minutes=time_limit_minutes,
            )
            # 可以通过 WebSocket 返回错误给客服端
            return

        # 执行撤回
        updated_message = await services.message_repo.withdraw_message(
            message_id=message_id,
            operator=conn.identity,
        )

        if updated_message:
            now = datetime.now()
            withdrawn_payload = {
                "message_id": message_id,
                "withdrawn_by": conn.identity,
                "withdrawn_at": now.isoformat(),
                "reason": reason,
            }

            # 通知用户端
            user_msg = build_server_message(
                action=WSAction.SERVER_MESSAGE_WITHDRAWN,
                payload=withdrawn_payload,
                conversation_id=conn.conversation_id,
            )
            ws_sent = await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, user_msg)

            # 通知其他客服端
            await ws_manager.broadcast_to_conversation(
                conn.conversation_id,
                user_msg,
                exclude_conn_id=conn.id,
            )

            logger.info(
                "消息撤回成功",
                conn_id=conn.id,
                conversation_id=conn.conversation_id,
                message_id=message_id,
                operator=conn.identity,
                ws_sent=ws_sent,
            )


@ws_router.handler(WSAction.CLIENT_AGENT_EDIT_MESSAGE)
async def handle_agent_edit_message(
    conn: WSConnection,
    action: str,
    payload: dict[str, Any],
) -> None:
    """处理客服编辑消息"""
    from datetime import datetime, timedelta

    message_id = payload.get("message_id")
    new_content = payload.get("new_content", "").strip()
    regenerate = payload.get("regenerate", True)

    if not message_id or not new_content:
        logger.warning(
            "编辑消息失败：缺少 message_id 或 new_content",
            conn_id=conn.id,
            conversation_id=conn.conversation_id,
        )
        return

    async with get_services() as services:
        # 获取消息
        message = await services.message_repo.get_by_id(message_id)
        if not message:
            logger.warning(
                "编辑消息失败：消息不存在",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 验证消息属于当前会话
        if message.conversation_id != conn.conversation_id:
            logger.warning(
                "编辑消息失败：消息不属于当前会话",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 检查是否已撤回
        if message.is_withdrawn:
            logger.warning(
                "编辑消息失败：消息已被撤回",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 检查时间限制（默认 5 分钟）
        time_limit_minutes = 5
        if datetime.now() - message.created_at > timedelta(minutes=time_limit_minutes):
            logger.warning(
                "编辑消息失败：已超过时间限制",
                conn_id=conn.id,
                message_id=message_id,
                time_limit_minutes=time_limit_minutes,
            )
            return

        old_content = message.content

        # 执行编辑
        updated_message = await services.message_repo.edit_message(
            message_id=message_id,
            new_content=new_content,
            operator=conn.identity,
        )

        if not updated_message:
            logger.warning(
                "编辑消息失败：更新失败",
                conn_id=conn.id,
                message_id=message_id,
            )
            return

        # 如果需要重新生成，删除后续的 AI 回复
        deleted_message_ids: list[str] = []
        if regenerate and message.role == "user":
            subsequent_messages = await services.message_repo.get_messages_after(
                conversation_id=conn.conversation_id,
                after_message_id=message_id,
            )
            # 只删除紧随其后的 assistant 消息
            for msg in subsequent_messages:
                if msg.role == "assistant":
                    deleted_message_ids.append(msg.id)
                else:
                    break  # 遇到非 assistant 消息就停止

            if deleted_message_ids:
                await services.message_repo.delete_messages(deleted_message_ids)

        now = datetime.now()
        edited_payload = {
            "message_id": message_id,
            "old_content": old_content,
            "new_content": new_content,
            "edited_by": conn.identity,
            "edited_at": now.isoformat(),
            "deleted_message_ids": deleted_message_ids,
            "regenerate_triggered": regenerate and len(deleted_message_ids) > 0,
        }

        # 通知用户端
        user_msg = build_server_message(
            action=WSAction.SERVER_MESSAGE_EDITED,
            payload=edited_payload,
            conversation_id=conn.conversation_id,
        )
        ws_sent = await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, user_msg)

        # 如果有删除的消息，额外通知
        if deleted_message_ids:
            deleted_msg = build_server_message(
                action=WSAction.SERVER_MESSAGES_DELETED,
                payload={
                    "message_ids": deleted_message_ids,
                    "reason": "edit_regenerate",
                },
                conversation_id=conn.conversation_id,
            )
            await ws_manager.send_to_role(conn.conversation_id, WSRole.USER, deleted_msg)

        # 通知其他客服端
        await ws_manager.broadcast_to_conversation(
            conn.conversation_id,
            user_msg,
            exclude_conn_id=conn.id,
        )

        logger.info(
            "消息编辑成功",
            conn_id=conn.id,
            conversation_id=conn.conversation_id,
            message_id=message_id,
            operator=conn.identity,
            deleted_count=len(deleted_message_ids),
            regenerate=regenerate,
            ws_sent=ws_sent,
        )
