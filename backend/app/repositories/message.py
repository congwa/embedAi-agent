"""消息 Repository"""

from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    """消息数据访问"""

    model = Message

    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def get_by_conversation_id(self, conversation_id: str) -> list[Message]:
        """获取会话的所有消息"""
        result = await self.session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        return list(result.scalars().all())

    async def create_message(
        self,
        message_id: str,
        conversation_id: str,
        role: str,
        content: str,
        products: str | None = None,
        is_delivered: bool = False,
    ) -> Message:
        """创建消息"""
        message = Message(
            id=message_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            products=products,
            is_delivered=is_delivered,
            delivered_at=datetime.now() if is_delivered else None,
        )
        return await self.create(message)

    async def get_undelivered_messages(
        self,
        conversation_id: str,
        target_role: str,
    ) -> list[Message]:
        """获取未送达给目标角色的消息
        
        Args:
            conversation_id: 会话 ID
            target_role: 目标角色 ("user" 获取发给用户的未送达消息, "agent" 获取发给客服的未送达消息)
        """
        # 发给用户的消息: role in (assistant, human_agent, system)
        # 发给客服的消息: role = user
        if target_role == "user":
            role_filter = Message.role.in_(["assistant", "human_agent", "system"])
        else:
            role_filter = Message.role == "user"
        
        result = await self.session.execute(
            select(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.is_delivered == False,
                    role_filter,
                )
            )
            .order_by(Message.created_at)
        )
        return list(result.scalars().all())

    async def mark_as_delivered(
        self,
        message_ids: list[str],
    ) -> int:
        """标记消息为已送达"""
        now = datetime.now()
        count = 0
        for msg_id in message_ids:
            message = await self.get_by_id(msg_id)
            if message and not message.is_delivered:
                message.is_delivered = True
                message.delivered_at = now
                await self.update(message)
                count += 1
        return count

    async def mark_as_read(
        self,
        message_ids: list[str],
        read_by: str,
    ) -> tuple[int, datetime]:
        """标记消息为已读
        
        Returns:
            (更新数量, 已读时间)
        """
        now = datetime.now()
        count = 0
        for msg_id in message_ids:
            message = await self.get_by_id(msg_id)
            if message and message.read_at is None:
                message.read_at = now
                message.read_by = read_by
                await self.update(message)
                count += 1
        return count, now

    async def get_unread_count(
        self,
        conversation_id: str,
        target_role: str,
    ) -> int:
        """获取未读消息数量
        
        Args:
            target_role: 目标角色，统计发给该角色的未读消息数
        """
        if target_role == "user":
            role_filter = Message.role.in_(["assistant", "human_agent", "system"])
        else:
            role_filter = Message.role == "user"
        
        result = await self.session.execute(
            select(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.read_at == None,
                    role_filter,
                )
            )
        )
        return len(list(result.scalars().all()))
