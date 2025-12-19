"""记忆系统数据模型"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class MemoryAction(str, Enum):
    """记忆操作类型"""

    ADD = "ADD"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    NONE = "NONE"


class Fact(BaseModel):
    """事实记录"""

    id: str
    user_id: str
    content: str
    hash: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Entity(BaseModel):
    """图谱实体"""

    name: str
    entity_type: str
    observations: list[str] = Field(default_factory=list)


class Relation(BaseModel):
    """图谱关系"""

    from_entity: str
    to_entity: str
    relation_type: str


class KnowledgeGraph(BaseModel):
    """知识图谱"""

    entities: list[Entity] = Field(default_factory=list)
    relations: list[Relation] = Field(default_factory=list)


class UserProfile(BaseModel):
    """用户画像（存储在 LangGraph Store）"""

    user_id: str
    nickname: str | None = None
    tone_preference: str | None = None  # 语气偏好
    budget_min: float | None = None
    budget_max: float | None = None
    favorite_categories: list[str] = Field(default_factory=list)
    task_progress: dict[str, Any] = Field(default_factory=dict)
    feature_flags: dict[str, bool] = Field(default_factory=dict)
    custom_data: dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=datetime.now)
