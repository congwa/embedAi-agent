"""用户 API"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
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


# ============ 用户画像 API ============


class UserProfileResponse(BaseModel):
    """用户画像响应"""

    user_id: str
    nickname: str | None = None
    tone_preference: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    favorite_categories: list[str] = Field(default_factory=list)
    task_progress: dict[str, Any] = Field(default_factory=dict)
    feature_flags: dict[str, bool] = Field(default_factory=dict)
    custom_data: dict[str, Any] = Field(default_factory=dict)
    updated_at: str | None = None


class UpdateProfileRequest(BaseModel):
    """更新画像请求"""

    nickname: str | None = None
    tone_preference: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    favorite_categories: list[str] | None = None
    feature_flags: dict[str, bool] | None = None
    custom_data: dict[str, Any] | None = None


class UpdateProfileResponse(BaseModel):
    """更新画像响应"""

    success: bool
    updated_fields: list[str] = Field(default_factory=list)
    message: str | None = None


@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    """获取用户画像"""
    from app.services.memory.profile_service import get_profile_service

    profile_service = await get_profile_service()
    profile = await profile_service.get_profile(user_id)

    if profile is None:
        return UserProfileResponse(user_id=user_id)

    return UserProfileResponse(
        user_id=user_id,
        nickname=profile.get("nickname"),
        tone_preference=profile.get("tone_preference"),
        budget_min=profile.get("budget_min"),
        budget_max=profile.get("budget_max"),
        favorite_categories=profile.get("favorite_categories", []),
        task_progress=profile.get("task_progress", {}),
        feature_flags=profile.get("feature_flags", {}),
        custom_data=profile.get("custom_data", {}),
        updated_at=profile.get("updated_at"),
    )


@router.post("/{user_id}/profile", response_model=UpdateProfileResponse)
async def update_user_profile(user_id: str, request: UpdateProfileRequest):
    """更新用户画像（用户显式设置）"""
    from app.services.memory.profile_service import (
        ProfileUpdateSource,
        get_profile_service,
    )

    profile_service = await get_profile_service()

    # 构建更新字典，只包含非空字段
    updates: dict[str, Any] = {}
    if request.nickname is not None:
        updates["nickname"] = request.nickname
    if request.tone_preference is not None:
        updates["tone_preference"] = request.tone_preference
    if request.budget_min is not None:
        updates["budget_min"] = request.budget_min
    if request.budget_max is not None:
        updates["budget_max"] = request.budget_max
    if request.favorite_categories is not None:
        updates["favorite_categories"] = request.favorite_categories
    if request.feature_flags is not None:
        updates["feature_flags"] = request.feature_flags
    if request.custom_data is not None:
        updates["custom_data"] = request.custom_data

    if not updates:
        return UpdateProfileResponse(
            success=True, updated_fields=[], message="无更新内容"
        )

    result = await profile_service.update_profile(
        user_id, updates, source=ProfileUpdateSource.USER_INPUT
    )

    if not result.success:
        raise HTTPException(status_code=500, detail=result.error)

    return UpdateProfileResponse(
        success=True,
        updated_fields=result.updated_fields,
        message=f"已更新 {len(result.updated_fields)} 个字段",
    )


@router.delete("/{user_id}/profile", response_model=UpdateProfileResponse)
async def delete_user_profile(user_id: str):
    """删除用户画像"""
    from app.services.memory.profile_service import get_profile_service

    profile_service = await get_profile_service()
    deleted = await profile_service.delete_profile(user_id)

    return UpdateProfileResponse(
        success=deleted,
        updated_fields=[],
        message="画像已删除" if deleted else "画像不存在",
    )
