"""FAQ 服务

提供 FAQ 条目的 upsert、自动合并、索引等功能。
"""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.agent import Agent, FAQEntry, KnowledgeConfig
from app.services.agent.core.service import agent_service
from app.services.knowledge.faq_retriever import FAQRetriever

logger = get_logger("knowledge.faq_service")

# ========== 配置常量 ==========

# FAQ 合并相似度阈值（0-1，分数越高越相似）
FAQ_MERGE_THRESHOLD: float = 0.85

# 合并搜索的 top_k
FAQ_MERGE_TOP_K: int = 5

# 是否启用自动合并
FAQ_AUTO_MERGE_ENABLED: bool = True


class FAQMergeResult:
    """FAQ 合并结果"""

    def __init__(
        self,
        entry: FAQEntry,
        merged: bool = False,
        target_id: str | None = None,
        similarity_score: float | None = None,
    ):
        self.entry = entry
        self.merged = merged
        self.target_id = target_id
        self.similarity_score = similarity_score


def _merge_tags(existing_tags: list[str] | None, new_tags: list[str] | None) -> list[str] | None:
    """合并标签列表，去重"""
    if not existing_tags and not new_tags:
        return None
    tags_set = set(existing_tags or []) | set(new_tags or [])
    return list(tags_set) if tags_set else None


def _merge_source(existing_source: str | None, new_source: str | None) -> str | None:
    """合并来源字段，追加新来源"""
    if not new_source:
        return existing_source
    if not existing_source:
        return new_source
    # 如果来源不同，追加新来源
    if new_source not in existing_source:
        return f"{existing_source};{new_source}"
    return existing_source


async def find_similar_faq(
    question: str,
    agent_id: str | None,
    top_k: int = FAQ_MERGE_TOP_K,
    threshold: float = FAQ_MERGE_THRESHOLD,
) -> list[dict[str, Any]]:
    """查找相似的 FAQ 条目

    Args:
        question: 问题文本
        agent_id: Agent ID（用于隔离检索）
        top_k: 返回结果数量
        threshold: 相似度阈值

    Returns:
        相似的 FAQ 条目列表，包含 id, question, answer, score 等
    """
    try:
        retriever = FAQRetriever(
            agent_id=agent_id,
            top_k=top_k,
            similarity_threshold=threshold,
        )
        results = await retriever.search(question)
        return results
    except Exception as e:
        logger.warning("FAQ 相似度检索失败", error=str(e), question=question[:50])
        return []


async def merge_faq_entry(
    target: FAQEntry,
    new_data: dict[str, Any],
    db: AsyncSession,
) -> FAQEntry:
    """合并 FAQ 条目

    将新数据合并到已有的 FAQ 条目中。

    合并规则：
    - question: 保留原问题，新问法可记录到 tags
    - answer: 如果新答案更长，则替换；否则保留原答案
    - tags: 取并集
    - source: 追加新来源
    - priority: 取最大值
    - enabled: 保留原值

    Args:
        target: 目标 FAQ 条目
        new_data: 新的 FAQ 数据
        db: 数据库会话

    Returns:
        合并后的 FAQ 条目
    """
    new_question = new_data.get("question", "")
    new_answer = new_data.get("answer", "")
    new_tags = new_data.get("tags")
    new_source = new_data.get("source")
    new_priority = new_data.get("priority", 0)

    # 如果新问法与原问题不同，记录到 tags
    merged_tags = _merge_tags(target.tags, new_tags)
    if new_question and new_question.strip() != target.question.strip():
        alias_tag = f"alias:{new_question[:50]}"
        if merged_tags:
            if alias_tag not in merged_tags:
                merged_tags.append(alias_tag)
        else:
            merged_tags = [alias_tag]

    # 更新字段
    target.tags = merged_tags
    target.source = _merge_source(target.source, new_source)
    target.priority = max(target.priority, new_priority)

    # 如果新答案更完整（更长），则替换
    if new_answer and len(new_answer) > len(target.answer):
        target.answer = new_answer

    await db.flush()

    logger.info(
        "FAQ 条目已合并",
        target_id=target.id,
        new_question=new_question[:50] if new_question else None,
    )

    return target


async def upsert_faq_entry(
    data: dict[str, Any],
    db: AsyncSession,
    auto_merge: bool = True,
    auto_index: bool = True,
) -> FAQMergeResult:
    """创建或合并 FAQ 条目

    根据相似度检索决定是创建新条目还是合并到已有条目。

    Args:
        data: FAQ 数据，包含 question, answer, category, tags, source, priority, enabled, agent_id
        db: 数据库会话
        auto_merge: 是否启用自动合并
        auto_index: 是否自动索引到向量库

    Returns:
        FAQMergeResult 包含条目和合并状态
    """
    question = data.get("question", "").strip()
    answer = data.get("answer", "").strip()
    agent_id = data.get("agent_id")

    if not question or not answer:
        raise ValueError("question 和 answer 不能为空")

    target_id = None
    similarity_score = None

    # 尝试查找相似 FAQ
    if auto_merge and FAQ_AUTO_MERGE_ENABLED:
        similar_faqs = await find_similar_faq(
            question=question,
            agent_id=agent_id,
            top_k=FAQ_MERGE_TOP_K,
            threshold=FAQ_MERGE_THRESHOLD,
        )

        if similar_faqs:
            top_match = similar_faqs[0]
            similarity_score = top_match.get("score", 0)

            # 如果相似度超过阈值，执行合并
            if similarity_score >= FAQ_MERGE_THRESHOLD:
                target_id = top_match.get("id")
                if target_id:
                    # 从数据库获取目标条目
                    stmt = select(FAQEntry).where(FAQEntry.id == target_id)
                    result = await db.execute(stmt)
                    target_entry = result.scalar_one_or_none()

                    if target_entry:
                        entry = await merge_faq_entry(target_entry, data, db)

                        logger.info(
                            "FAQ 自动合并",
                            target_id=target_id,
                            source_question=question[:50],
                            score=similarity_score,
                        )

                        # 重新索引合并后的条目
                        if auto_index:
                            await index_faq_entry(entry, agent_id)

                        return FAQMergeResult(
                            entry=entry,
                            merged=True,
                            target_id=target_id,
                            similarity_score=similarity_score,
                        )

    # 创建新条目
    entry = FAQEntry(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        question=question,
        answer=answer,
        category=data.get("category"),
        tags=data.get("tags"),
        source=data.get("source"),
        priority=data.get("priority", 0),
        enabled=data.get("enabled", True),
    )

    db.add(entry)
    await db.flush()
    await db.refresh(entry)

    logger.info("FAQ 条目已创建", entry_id=entry.id, question=question[:50])

    # 索引新条目
    if auto_index:
        await index_faq_entry(entry, agent_id)

    return FAQMergeResult(
        entry=entry,
        merged=False,
        target_id=None,
        similarity_score=similarity_score,
    )


async def index_faq_entry(entry: FAQEntry, agent_id: str | None = None) -> bool:
    """索引单个 FAQ 条目到向量库

    Args:
        entry: FAQ 条目
        agent_id: Agent ID

    Returns:
        是否索引成功
    """
    try:
        retriever = FAQRetriever(agent_id=agent_id or entry.agent_id)
        entry_data = {
            "id": entry.id,
            "question": entry.question,
            "answer": entry.answer,
            "category": entry.category,
            "tags": entry.tags,
            "source": entry.source,
            "enabled": entry.enabled,
        }
        indexed = await retriever.index_entries([entry_data])
        return indexed > 0
    except Exception as e:
        logger.error("FAQ 索引失败", entry_id=entry.id, error=str(e))
        return False


async def refresh_knowledge_config(agent_id: str, db: AsyncSession) -> None:
    """刷新 Agent 关联的 KnowledgeConfig 版本

    Args:
        agent_id: Agent ID
        db: 数据库会话
    """
    try:
        stmt = select(Agent).where(Agent.id == agent_id)
        result = await db.execute(stmt)
        agent = result.scalar_one_or_none()

        if agent and agent.knowledge_config_id:
            kc_stmt = select(KnowledgeConfig).where(
                KnowledgeConfig.id == agent.knowledge_config_id
            )
            kc_result = await db.execute(kc_stmt)
            kc = kc_result.scalar_one_or_none()

            if kc:
                kc.data_version = str(uuid.uuid4())[:8]
                await db.flush()

                # 使 Agent 缓存失效
                agent_service.invalidate_agent(agent_id)

                logger.info(
                    "KnowledgeConfig 版本已更新",
                    agent_id=agent_id,
                    config_id=kc.id,
                    version=kc.data_version,
                )
    except Exception as e:
        logger.error("刷新 KnowledgeConfig 失败", agent_id=agent_id, error=str(e))
