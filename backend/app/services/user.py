"""用户服务"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.user import UserRepository


class UserService:
    """用户服务"""

    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)

    async def get_or_create(self, user_id: str) -> User:
        """获取或创建用户"""
        return await self.repo.get_or_create(user_id)

    async def get_user(self, user_id: str) -> User | None:
        """获取用户"""
        return await self.repo.get_by_id(user_id)
