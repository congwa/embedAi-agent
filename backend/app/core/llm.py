"""LLM 初始化模块"""

from functools import lru_cache

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langchain_openai import OpenAIEmbeddings

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("llm")


@lru_cache
def get_chat_model() -> BaseChatModel:
    """获取聊天模型（硅基流动）"""
    logger.info("初始化聊天模型", model=settings.SILICONFLOW_CHAT_MODEL)
    return init_chat_model(
        f"openai:{settings.SILICONFLOW_CHAT_MODEL}",
        base_url=settings.SILICONFLOW_BASE_URL,
        api_key=settings.SILICONFLOW_API_KEY,
    )


@lru_cache
def get_embeddings() -> OpenAIEmbeddings:
    """获取嵌入模型（硅基流动）"""
    logger.info(
        "初始化嵌入模型",
        model=settings.SILICONFLOW_EMBEDDING_MODEL,
        dimension=settings.SILICONFLOW_EMBEDDING_DIMENSION,
    )
    return OpenAIEmbeddings(
        model=settings.SILICONFLOW_EMBEDDING_MODEL,
        base_url=settings.SILICONFLOW_BASE_URL,
        api_key=settings.SILICONFLOW_API_KEY,
    )
