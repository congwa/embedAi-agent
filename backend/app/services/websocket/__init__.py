"""WebSocket 模块

提供用户与客服之间的实时双向通讯能力。

目录结构：
- manager.py: 连接管理器
- router.py: 消息路由器
- heartbeat.py: 心跳管理
- handlers/: 消息处理器

使用方式：
    from app.services.websocket import ws_manager, ws_router
    
    # 在 main.py 中注册路由
    from app.routers import ws
    app.include_router(ws.router)
"""

from app.services.websocket.manager import ws_manager, ConnectionManager, WSConnection
from app.services.websocket.router import ws_router, MessageRouter
from app.services.websocket.heartbeat import heartbeat_manager, HeartbeatManager

__all__ = [
    "ws_manager",
    "ws_router",
    "heartbeat_manager",
    "ConnectionManager",
    "WSConnection",
    "MessageRouter",
    "HeartbeatManager",
]
