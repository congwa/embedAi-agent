"""消息 Repository"""

from sqlalchemy import select
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
    ) -> Message:
        """创建消息"""
        message = Message(
            id=message_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            products=products,
        )
        return await self.create(message)
