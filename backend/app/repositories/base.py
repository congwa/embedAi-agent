"""基础 Repository"""

from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """基础 CRUD Repository"""

    model: type[ModelT]

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, id: str) -> ModelT | None:
        """根据 ID 获取"""
        return await self.session.get(self.model, id)

    async def get_all(self) -> list[ModelT]:
        """获取所有记录"""
        result = await self.session.execute(select(self.model))
        return list(result.scalars().all())

    async def create(self, obj: ModelT) -> ModelT:
        """创建记录"""
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: ModelT) -> ModelT:
        """更新记录"""
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: ModelT) -> None:
        """删除记录"""
        await self.session.delete(obj)
        await self.session.flush()
