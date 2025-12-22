"""记忆系统模块

包含：
- LangGraph Store：长期记忆基座，跨会话用户画像存储
- ProfileService：用户画像服务，从事实/图谱自动提取画像信息
- FactMemory：事实型长期记忆，LLM 抽取 + Qdrant 向量检索
- GraphMemory：图谱记忆，实体/关系结构化存储
- MemoryOrchestration：记忆编排中间件
"""

from app.services.memory.fact_memory import FactMemoryService, get_fact_memory_service
from app.services.memory.graph_memory import KnowledgeGraphManager, get_graph_manager
from app.services.memory.models import (
    Entity,
    Fact,
    KnowledgeGraph,
    MemoryAction,
    Relation,
    UserProfile,
)
from app.services.memory.profile_service import (
    ProfileService,
    ProfileUpdateResult,
    ProfileUpdateSource,
    get_profile_service,
)
from app.services.memory.store import UserProfileStore, get_user_profile_store
from app.services.memory.vector_store import (
    ensure_memory_collection,
    get_memory_qdrant_client,
    get_memory_vector_store,
)

__all__ = [
    # Models
    "Entity",
    "Fact",
    "KnowledgeGraph",
    "MemoryAction",
    "Relation",
    "UserProfile",
    # Store
    "UserProfileStore",
    "get_user_profile_store",
    # Profile Service
    "ProfileService",
    "ProfileUpdateResult",
    "ProfileUpdateSource",
    "get_profile_service",
    # Fact Memory
    "FactMemoryService",
    "get_fact_memory_service",
    # Graph Memory
    "KnowledgeGraphManager",
    "get_graph_manager",
    # Vector Store
    "get_memory_vector_store",
    "get_memory_qdrant_client",
    "ensure_memory_collection",
]
