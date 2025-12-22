"""TODO 广播中间件

监听 state.todos 变化，通过 SSE 推送给前端。
"""

import json
from collections.abc import Awaitable, Callable
from typing import Any

from langchain.agents.middleware.types import AgentMiddleware, ModelRequest, ModelResponse

from app.core.logging import get_logger
from app.schemas.events import StreamEventType

logger = get_logger("middleware.todo_broadcast")


def _hash_todos(todos: list[dict[str, Any]] | None) -> str:
    """计算 todos 的 hash，用于变更检测"""
    if not todos:
        return ""
    try:
        return json.dumps(todos, sort_keys=True, ensure_ascii=False)
    except Exception:
        return ""


class TodoBroadcastMiddleware(AgentMiddleware):
    """TODO 广播中间件
    
    在每次模型调用后检测 state.todos 是否变化，
    若变化则通过 context.emitter 推送 SSE 事件给前端。
    """

    def __init__(self) -> None:
        super().__init__()
        self._last_todos_hash: str = ""

    async def aafter_model(
        self,
        state: dict[str, Any],
        runtime: Any,
    ) -> dict[str, Any] | None:
        """模型调用后检测 todos 变化并广播"""
        try:
            # 获取当前 todos
            todos = state.get("todos")
            if todos is None:
                return None
            
            # 计算 hash 检测变化
            current_hash = _hash_todos(todos)
            if current_hash == self._last_todos_hash:
                return None
            
            # 更新 hash
            self._last_todos_hash = current_hash
            
            # 获取 emitter
            context = getattr(runtime, "context", None)
            if context is None:
                return None
            
            emitter = getattr(context, "emitter", None)
            if emitter is None or not hasattr(emitter, "aemit"):
                return None
            
            # 广播 todos 变更
            await emitter.aemit(
                StreamEventType.ASSISTANT_TODOS.value,
                {"todos": todos},
            )
            
            logger.debug(
                "TODO 列表已广播",
                todo_count=len(todos),
                statuses=[t.get("status") for t in todos],
            )
            
        except Exception as e:
            # 广播失败不影响主流程
            logger.warning("TODO 广播失败", error=str(e))
        
        return None

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        """透传模型调用，不做修改"""
        return await handler(request)
