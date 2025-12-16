"""聊天相关 Schema"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """聊天请求"""

    user_id: str = Field(..., description="用户 ID")
    conversation_id: str = Field(..., description="会话 ID")
    message: str = Field(..., min_length=1, description="用户消息")


class ChatEvent(BaseModel):
    """聊天事件（SSE）"""

    # legacy:
    # 该 Schema 是旧版协议（text/products/done/error）。新版统一协议请使用：
    # - `app.schemas.stream.StreamEvent`（对外 SSE）
    # - `app.schemas.events.StreamEventType`（事件类型枚举）
    type: Literal["text", "products", "done", "error"] = Field(..., description="事件类型")
    content: str | None = Field(None, description="文本内容")
    data: Any | None = Field(None, description="数据（商品列表等）")
    message_id: str | None = Field(None, description="消息 ID")
