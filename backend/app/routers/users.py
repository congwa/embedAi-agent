"""用户 API"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db_session
from app.services.user import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class CreateUserResponse(BaseModel):
    """创建用户响应"""

    user_id: str


class UserResponse(BaseModel):
    """用户响应"""

    id: str
    exists: bool


@router.post("", response_model=CreateUserResponse)
async def create_user(
    db: AsyncSession = Depends(get_db_session),
):
    """创建匿名用户"""
    user_id = str(uuid.uuid4())
    service = UserService(db)
    await service.get_or_create(user_id)
    return CreateUserResponse(user_id=user_id)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """获取用户信息"""
    service = UserService(db)
    user = await service.get_user(user_id)
    return UserResponse(id=user_id, exists=user is not None)
