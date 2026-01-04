"""WebSocket 消息处理器

导入此模块会自动注册所有 handler 到 ws_router
"""

from app.services.websocket.handlers import user
from app.services.websocket.handlers import agent
from app.services.websocket.handlers import system

__all__ = ["user", "agent", "system"]
