"""爬虫配置服务 - 管理运行时启用状态

提供爬虫模块的动态启用/禁用功能，状态存储在数据库中。
优先级：数据库状态 > 环境变量默认值
"""

import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.app_metadata import AppMetadata

logger = get_logger("crawler.config")

# 元数据 Key 常量
CRAWLER_ENABLED_KEY = "crawler.enabled"
CRAWLER_CONFIG_KEY = "crawler.config"


class CrawlerConfigService:
    """爬虫配置服务
    
    管理爬虫模块的运行时配置，包括：
    - 启用/禁用状态
    - 爬虫专用模型配置
    - 爬取限制配置
    """

    async def is_enabled(self, session: AsyncSession) -> bool:
        """获取爬虫启用状态
        
        优先级：数据库 > 环境变量
        
        Args:
            session: 数据库会话（主数据库 app.db）
            
        Returns:
            是否启用
        """
        result = await session.execute(
            select(AppMetadata).where(AppMetadata.key == CRAWLER_ENABLED_KEY)
        )
        metadata = result.scalar_one_or_none()
        
        if metadata is not None:
            # 数据库有记录，使用数据库值
            return metadata.value.lower() == "true"
        
        # 数据库无记录，使用环境变量默认值
        return settings.CRAWLER_ENABLED

    async def is_enabled_with_init(self, session: AsyncSession) -> bool:
        """获取爬虫启用状态，首次时从环境变量初始化
        
        用于应用启动时，确保数据库中有初始值。
        
        Args:
            session: 数据库会话
            
        Returns:
            是否启用
        """
        result = await session.execute(
            select(AppMetadata).where(AppMetadata.key == CRAWLER_ENABLED_KEY)
        )
        metadata = result.scalar_one_or_none()
        
        if metadata is None:
            # 首次启动，从环境变量初始化
            enabled = settings.CRAWLER_ENABLED
            await self.set_enabled(session, enabled, skip_commit=True)
            logger.info("爬虫启用状态初始化", enabled=enabled, source="env")
            return enabled
        
        return metadata.value.lower() == "true"

    async def set_enabled(
        self, 
        session: AsyncSession, 
        enabled: bool,
        skip_commit: bool = False,
    ) -> None:
        """设置爬虫启用状态
        
        Args:
            session: 数据库会话
            enabled: 是否启用
            skip_commit: 是否跳过提交（用于批量操作）
        """
        result = await session.execute(
            select(AppMetadata).where(AppMetadata.key == CRAWLER_ENABLED_KEY)
        )
        metadata = result.scalar_one_or_none()
        
        value = "true" if enabled else "false"
        
        if metadata is None:
            # 新建
            metadata = AppMetadata(
                key=CRAWLER_ENABLED_KEY,
                value=value,
            )
            session.add(metadata)
        else:
            # 更新
            metadata.value = value
            metadata.updated_at = datetime.now()
        
        if not skip_commit:
            await session.commit()
        
        logger.info("爬虫启用状态已更新", enabled=enabled)

    async def get_config(self, session: AsyncSession) -> dict:
        """获取完整爬虫配置
        
        Returns:
            {
                "enabled": bool,
                "model": str | None,
                "provider": str | None,
                "max_depth": int,
                "max_pages": int,
                "default_delay": float,
                "headless": bool,
            }
        """
        enabled = await self.is_enabled(session)
        
        # 从数据库获取自定义配置
        result = await session.execute(
            select(AppMetadata).where(AppMetadata.key == CRAWLER_CONFIG_KEY)
        )
        metadata = result.scalar_one_or_none()
        
        custom_config = {}
        if metadata:
            try:
                custom_config = json.loads(metadata.value)
            except json.JSONDecodeError:
                logger.warning("爬虫配置 JSON 解析失败")
        
        return {
            "enabled": enabled,
            "model": custom_config.get("model") or settings.CRAWLER_MODEL or settings.LLM_CHAT_MODEL,
            "provider": custom_config.get("provider") or settings.CRAWLER_PROVIDER or settings.LLM_PROVIDER,
            "max_depth": custom_config.get("max_depth") or settings.CRAWLER_DEFAULT_MAX_DEPTH,
            "max_pages": custom_config.get("max_pages") or settings.CRAWLER_DEFAULT_MAX_PAGES,
            "default_delay": custom_config.get("default_delay") or settings.CRAWLER_DEFAULT_DELAY,
            "headless": settings.CRAWLER_HEADLESS,
            "run_on_start": settings.CRAWLER_RUN_ON_START,
        }

    async def update_config(
        self,
        session: AsyncSession,
        config: dict,
    ) -> dict:
        """更新爬虫配置
        
        Args:
            session: 数据库会话
            config: 配置字典（仅包含要更新的字段）
            
        Returns:
            更新后的完整配置
        """
        # 获取现有配置
        result = await session.execute(
            select(AppMetadata).where(AppMetadata.key == CRAWLER_CONFIG_KEY)
        )
        metadata = result.scalar_one_or_none()
        
        existing_config = {}
        if metadata:
            try:
                existing_config = json.loads(metadata.value)
            except json.JSONDecodeError:
                pass
        
        # 合并配置
        existing_config.update(config)
        value = json.dumps(existing_config, ensure_ascii=False)
        
        if metadata is None:
            metadata = AppMetadata(
                key=CRAWLER_CONFIG_KEY,
                value=value,
            )
            session.add(metadata)
        else:
            metadata.value = value
            metadata.updated_at = datetime.now()
        
        await session.commit()
        logger.info("爬虫配置已更新", config=config)
        
        return await self.get_config(session)


# 单例实例
crawler_config_service = CrawlerConfigService()
