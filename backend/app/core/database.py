"""数据库连接管理"""

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("database")

# 创建异步引擎
engine = create_async_engine(
    settings.database_url,
    connect_args={"timeout": 30, "check_same_thread": False},
    echo=False,
    future=True,
)

# 创建异步会话工厂
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话（用于 FastAPI 依赖注入）"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except asyncio.CancelledError:
            # 用户中断 SSE/请求取消时会触发 CancelledError。
            # 此时连接/事务可能已被关闭，commit/rollback 可能再次抛错；这里静默清理即可。
            try:
                await session.rollback()
            except Exception:
                pass
            raise
        except Exception:
            try:
                await session.rollback()
            except Exception:
                pass
            raise


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话（上下文管理器）"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except asyncio.CancelledError:
            try:
                await session.rollback()
            except Exception:
                pass
            raise
        except Exception:
            try:
                await session.rollback()
            except Exception:
                pass
            raise


async def init_db() -> None:
    """初始化数据库（创建表）"""
    from app.models.base import Base

    settings.ensure_data_dir()
    async with engine.begin() as conn:
        # 先切到 WAL，允许并发读写
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        # 再创建表
        await conn.run_sync(Base.metadata.create_all)
    logger.info("数据库表初始化完成", path=settings.DATABASE_PATH)
