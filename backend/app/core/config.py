"""应用配置管理"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 硅基流动配置
    SILICONFLOW_API_KEY: str = ""
    SILICONFLOW_BASE_URL: str = "https://api.siliconflow.cn/v1"
    SILICONFLOW_CHAT_MODEL: str = "Qwen/Qwen2.5-7B-Instruct"
    SILICONFLOW_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    SILICONFLOW_EMBEDDING_DIMENSION: int = 4096  # BGE-M3 硅基流动版本维度

    # Qdrant 配置
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "products"

    # 数据库配置
    DATABASE_PATH: str = "./data/app.db"
    CHECKPOINT_DB_PATH: str = "./data/checkpoints.db"

    # 文本处理配置
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100

    # 服务配置
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000"

    # 日志配置
    LOG_LEVEL: str = "DEBUG"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_MODE: str = "detailed"  # simple, detailed, json
    LOG_FILE: str = "./logs/app.log"  # 日志文件路径，留空则不记录文件
    LOG_FILE_ROTATION: str = "10 MB"  # 日志文件轮转大小
    LOG_FILE_RETENTION: str = "7 days"  # 日志文件保留时间

    @property
    def database_url(self) -> str:
        """SQLite 数据库 URL"""
        return f"sqlite+aiosqlite:///{self.DATABASE_PATH}"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS 允许的源列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    def ensure_data_dir(self) -> None:
        """确保数据目录存在"""
        Path(self.DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
        Path(self.CHECKPOINT_DB_PATH).parent.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
