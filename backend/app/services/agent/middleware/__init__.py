"""中间件模块

本模块包含 Agent 的各种中间件实现。

使用方式：
    from app.services.agent.middleware.registry import build_middlewares
    middlewares = build_middlewares(model=model)
"""

from app.services.agent.middleware.registry import (
    MiddlewareSpec,
    build_middlewares,
)

__all__ = [
    "MiddlewareSpec",
    "build_middlewares",
]
