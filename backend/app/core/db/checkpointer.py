"""LangGraph Checkpointer Provider

使用 Provider 模式管理 LangGraph Checkpointer，支持 SQLite 和 PostgreSQL
"""

import asyncio
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

import aiosqlite
from langgraph.checkpoint.base import BaseCheckpointSaver

from app.core.config import settings
from app.core.logging import get_logger

if TYPE_CHECKING:
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

logger = get_logger("db.checkpointer")


# ========== Checkpointer Provider 抽象层 ==========

class CheckpointProvider(ABC):
    """Checkpointer 提供者抽象基类"""

    @property
    @abstractmethod
    def backend_name(self) -> str:
        """返回后端名称: sqlite, postgres"""

    @abstractmethod
    async def get_checkpointer(self) -> BaseCheckpointSaver:
        """获取 Checkpointer 实例"""

    @abstractmethod
    async def close(self) -> None:
        """关闭连接"""


class SQLiteCheckpointProvider(CheckpointProvider):
    """SQLite Checkpointer 提供者
    
    防死锁优化：
    - WAL 模式：允许读写并发
    - synchronous=NORMAL：在 WAL 模式下安全且高性能
    - busy_timeout=30s：等待锁释放而非立即失败
    """

    def __init__(self, db_path: str):
        self._db_path = db_path
        self._conn: aiosqlite.Connection | None = None
        self._checkpointer: "AsyncSqliteSaver | None" = None
        self._lock = asyncio.Lock()

    @property
    def backend_name(self) -> str:
        return "sqlite"

    async def get_checkpointer(self) -> BaseCheckpointSaver:
        """ 获取 Checkpointer 实例（延迟初始化）"""
        async with self._lock:
            if self._checkpointer is not None:
                return self._checkpointer

            from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

            settings.ensure_data_dir()
            self._conn = await aiosqlite.connect(
                self._db_path,
                isolation_level=None,
            )

            # 设置 PRAGMA 优化
            await self._conn.execute("PRAGMA journal_mode=WAL")
            await self._conn.execute("PRAGMA synchronous=NORMAL")
            await self._conn.execute("PRAGMA busy_timeout=30000")

            # 添加 is_alive 方法（兼容性）
            if not hasattr(self._conn, "is_alive"):
                import types

                def is_alive(conn) -> bool:  # noqa: ARG001
                    return True

                self._conn.is_alive = types.MethodType(is_alive, self._conn)

            self._checkpointer = AsyncSqliteSaver(self._conn)
            await self._checkpointer.setup()
            logger.info("SQLite Checkpointer 初始化完成（WAL 模式）")
            return self._checkpointer

    async def close(self) -> None:
        """关闭连接"""
        if self._conn:
            try:
                await self._conn.close()
            except Exception:
                pass
            self._conn = None
        self._checkpointer = None
        logger.info("SQLite Checkpointer 连接已关闭")


class PostgresCheckpointProvider(CheckpointProvider):
    """PostgreSQL Checkpointer 提供者"""

    def __init__(self, conn_string: str, pool_size: int = 5):
        self._conn_string = conn_string
        self._pool_size = pool_size
        self._pool = None
        self._checkpointer: "AsyncPostgresSaver | None" = None
        self._lock = asyncio.Lock()

    @property
    def backend_name(self) -> str:
        return "postgres"

    async def get_checkpointer(self) -> BaseCheckpointSaver:
        """获取 Checkpointer 实例（延迟初始化）"""
        async with self._lock:
            if self._checkpointer is not None:
                return self._checkpointer

            from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
            from psycopg_pool import AsyncConnectionPool

            self._pool = AsyncConnectionPool(
                conninfo=self._conn_string,
                min_size=1,
                max_size=self._pool_size,
                open=False,
            )
            await self._pool.open()

            self._checkpointer = AsyncPostgresSaver(self._pool)
            await self._checkpointer.setup()
            logger.info("PostgreSQL Checkpointer 初始化完成")
            return self._checkpointer

    async def close(self) -> None:
        """关闭连接"""
        if self._pool:
            try:
                await self._pool.close()
            except Exception:
                pass
            self._pool = None
        self._checkpointer = None
        logger.info("PostgreSQL Checkpointer 连接已关闭")


# ========== 单例管理 ==========
_checkpoint_provider: CheckpointProvider | None = None


def get_checkpoint_provider() -> CheckpointProvider:
    """获取 Checkpoint Provider（单例）
    
    根据 DATABASE_BACKEND 配置自动选择 SQLite 或 PostgreSQL
    """
    global _checkpoint_provider
    if _checkpoint_provider is None:
        backend = settings.DATABASE_BACKEND
        if backend == "sqlite":
            _checkpoint_provider = SQLiteCheckpointProvider(settings.CHECKPOINT_DB_PATH)
            logger.info(
                "Checkpoint Provider 初始化",
                backend="sqlite",
                path=settings.CHECKPOINT_DB_PATH,
            )
        elif backend == "postgres":
            _checkpoint_provider = PostgresCheckpointProvider(
                settings.checkpoint_connection_string,
                pool_size=settings.DATABASE_POOL_SIZE,
            )
            logger.info(
                "Checkpoint Provider 初始化",
                backend="postgres",
                host=settings.POSTGRES_HOST,
            )
        else:
            msg = f"不支持的数据库后端: {backend}"
            raise ValueError(msg)
    return _checkpoint_provider


async def close_checkpoint_provider() -> None:
    """关闭 Checkpoint Provider"""
    global _checkpoint_provider
    if _checkpoint_provider is not None:
        await _checkpoint_provider.close()
        _checkpoint_provider = None


async def get_checkpointer() -> BaseCheckpointSaver:
    """获取 Checkpointer 实例（便捷函数）"""
    return await get_checkpoint_provider().get_checkpointer()


async def close_checkpointer() -> None:
    """关闭 Checkpointer 连接（兼容旧接口）"""
    await close_checkpoint_provider()
