"""用户 Repository"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """用户数据访问"""

    model = User

    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def create_user(self, user_id: str) -> User:
        """创建用户"""
        user = User(id=user_id)
        return await self.create(user)

    async def get_or_create(self, user_id: str) -> User:
        """获取或创建用户"""
        user = await self.get_by_id(user_id)
        if user is None:
            user = await self.create_user(user_id)
        return user
