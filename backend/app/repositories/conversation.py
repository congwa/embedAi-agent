"""会话 Repository"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    """会话数据访问"""

    model = Conversation

    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def get_by_user_id(self, user_id: str) -> list[Conversation]:
        """获取用户的所有会话"""
        result = await self.session.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_with_messages(self, conversation_id: str) -> Conversation | None:
        """获取会话及其消息"""
        result = await self.session.execute(
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        return result.scalar_one_or_none()

    async def create_conversation(
        self,
        conversation_id: str,
        user_id: str,
        title: str = "新对话",
    ) -> Conversation:
        """创建会话"""
        conversation = Conversation(
            id=conversation_id,
            user_id=user_id,
            title=title,
        )
        return await self.create(conversation)

    async def update_title(self, conversation_id: str, title: str) -> Conversation | None:
        """更新会话标题"""
        conversation = await self.get_by_id(conversation_id)
        if conversation:
            conversation.title = title[:200]  # 截断标题
            await self.update(conversation)
        return conversation
