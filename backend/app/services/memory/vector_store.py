"""记忆向量存储模块

提供独立的 Qdrant 集合用于事实记忆的向量存储与检索。
与商品向量存储（QDRANT_COLLECTION）隔离，避免相互干扰。
"""

from functools import lru_cache

from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

from app.core.config import settings
from app.core.llm import get_embeddings
from app.core.logging import get_logger

logger = get_logger("memory.vector_store")


@lru_cache
def get_memory_qdrant_client() -> QdrantClient:
    """获取记忆专用 Qdrant 客户端（复用连接配置）"""
    logger.debug(
        "连接 Qdrant（记忆集合）",
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
    )
    return QdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
    )


def ensure_memory_collection() -> None:
    """确保记忆集合存在，不存在则创建"""
    client = get_memory_qdrant_client()
    collection_name = settings.MEMORY_FACT_COLLECTION

    collections = client.get_collections().collections
    if any(c.name == collection_name for c in collections):
        logger.debug("记忆集合已存在", collection=collection_name)
        return

    logger.info(
        "创建记忆集合",
        collection=collection_name,
        dimension=settings.EMBEDDING_DIMENSION,
    )
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(
            size=settings.EMBEDDING_DIMENSION,
            distance=Distance.COSINE,
        ),
    )


@lru_cache
def get_memory_vector_store() -> QdrantVectorStore:
    """获取记忆向量存储（独立集合）

    与商品向量存储隔离，使用 MEMORY_FACT_COLLECTION 集合。
    """
    ensure_memory_collection()

    client = get_memory_qdrant_client()
    embeddings = get_embeddings()

    logger.info(
        "初始化记忆向量存储",
        collection=settings.MEMORY_FACT_COLLECTION,
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dimension=settings.EMBEDDING_DIMENSION,
    )
    return QdrantVectorStore(
        client=client,
        collection_name=settings.MEMORY_FACT_COLLECTION,
        embedding=embeddings,
    )
