"""爬虫数据库连接管理

使用 Provider 模式管理爬虫数据库连接，与主应用数据库分离，避免：
1. 爬虫长事务阻塞用户查询
2. 死锁风险
3. 数据库文件过大

写入 Product 时使用独立的短事务连接主数据库，快速写入后立即释放。

注意：PostgreSQL 模式下，爬虫数据使用同一数据库，通过表名区分。
"""

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db.provider import (
    DatabaseProvider,
    PostgresProvider,
    SQLiteProvider,
)
from app.core.logging import get_logger

logger = get_logger("crawler.database")

# ========== 爬虫数据库 Provider（单例）==========
_crawler_provider: DatabaseProvider | None = None


def get_crawler_provider() -> DatabaseProvider:
    """获取爬虫数据库 Provider（单例）
    
    根据 DATABASE_BACKEND 配置自动选择 SQLite 或 PostgreSQL
    """
    global _crawler_provider
    if _crawler_provider is None:
        backend = settings.DATABASE_BACKEND
        if backend == "sqlite":
            _crawler_provider = SQLiteProvider(settings.crawler_database_url)
            logger.info(
                "爬虫数据库 Provider 初始化",
                backend="sqlite",
                path=settings.CRAWLER_DATABASE_PATH,
            )
        elif backend == "postgres":
            _crawler_provider = PostgresProvider(
                settings.crawler_database_url,
                pool_size=settings.DATABASE_POOL_SIZE,
                max_overflow=settings.DATABASE_POOL_MAX_OVERFLOW,
                pool_timeout=settings.DATABASE_POOL_TIMEOUT,
            )
            logger.info(
                "爬虫数据库 Provider 初始化",
                backend="postgres",
                host=settings.POSTGRES_HOST,
            )
        else:
            msg = f"不支持的数据库后端: {backend}"
            raise ValueError(msg)
    return _crawler_provider


async def close_crawler_provider() -> None:
    """关闭爬虫数据库 Provider"""
    global _crawler_provider
    if _crawler_provider is not None:
        await _crawler_provider.close()
        _crawler_provider = None


@asynccontextmanager
async def get_crawler_db() -> AsyncGenerator[AsyncSession, None]:
    """获取爬虫数据库会话（上下文管理器）

    用于爬虫相关的数据操作（CrawlSite, CrawlTask, CrawlPage）
    """
    session_factory = get_crawler_provider().session_factory
    async with session_factory() as session:
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


async def get_crawler_db_dep() -> AsyncGenerator[AsyncSession, None]:
    """获取爬虫数据库会话（用于 FastAPI 依赖注入）

    用于爬虫相关的数据操作（CrawlSite, CrawlTask, CrawlPage）
    """
    session_factory = get_crawler_provider().session_factory
    async with session_factory() as session:
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


async def init_crawler_db() -> None:
    """初始化爬虫数据库（创建表）"""
    from app.models.crawler import CrawlerBase

    settings.ensure_data_dir()
    provider = get_crawler_provider()
    await provider.init_db(CrawlerBase)
