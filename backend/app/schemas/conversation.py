"""会话相关 Schema"""

from datetime import datetime

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    """创建会话请求"""

    user_id: str = Field(..., description="用户 ID")


class ConversationResponse(BaseModel):
    """会话响应"""

    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    handoff_state: str | None = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """消息响应"""

    id: str
    role: str
    content: str
    products: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationWithMessages(ConversationResponse):
    """带消息的会话响应"""

    messages: list[MessageResponse] = []
