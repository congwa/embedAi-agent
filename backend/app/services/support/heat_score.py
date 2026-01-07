"""会话热度评分服务

基于现有数据库字段计算会话热度得分，用于客服工作台排序。

热度算法（基于现有字段）：
- 状态权重：pending=50, human=30, ai=0
- 等待时长：每分钟+1分，上限30分
- 未读消息：每条+5分，上限25分
- 用户在线：+10分
- 时间衰减：超30分钟无活动，每10分钟-2分
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.conversation import Conversation, HandoffState
from app.models.message import Message

if TYPE_CHECKING:
    pass

logger = get_logger("support.heat_score")

# 状态权重配置
STATE_WEIGHTS = {
    HandoffState.PENDING.value: 50,  # 等待接入，最高优先
    HandoffState.HUMAN.value: 30,    # 人工服务中
    HandoffState.AI.value: 0,        # AI 模式
}

# 得分上限配置
MAX_WAIT_SCORE = 30      # 等待时长最高分
MAX_UNREAD_SCORE = 25    # 未读消息最高分
USER_ONLINE_BONUS = 10   # 用户在线加成
DECAY_THRESHOLD_MIN = 30 # 开始衰减的阈值（分钟）
DECAY_PER_10MIN = 2      # 每10分钟衰减分数


def calculate_heat_score(
    handoff_state: str,
    updated_at: datetime,
    unread_count: int,
    user_online: bool,
    handoff_at: datetime | None = None,
) -> int:
    """计算单个会话的热度得分
    
    Args:
        handoff_state: 会话状态 (ai/pending/human)
        updated_at: 最后更新时间
        unread_count: 未读消息数
        user_online: 用户是否在线
        handoff_at: 请求人工的时间（可选）
        
    Returns:
        热度得分（整数，0-100+）
    """
    now = datetime.now()
    score = 0
    
    # 1. 状态权重
    score += STATE_WEIGHTS.get(handoff_state, 0)
    
    # 2. 等待时长得分
    wait_base = handoff_at if handoff_at and handoff_state == HandoffState.PENDING.value else updated_at
    wait_minutes = (now - wait_base).total_seconds() / 60
    wait_score = min(int(wait_minutes), MAX_WAIT_SCORE)
    score += wait_score
    
    # 3. 未读消息得分
    unread_score = min(unread_count * 5, MAX_UNREAD_SCORE)
    score += unread_score
    
    # 4. 用户在线加成
    if user_online:
        score += USER_ONLINE_BONUS
    
    # 5. 时间衰减（仅对 AI 模式应用）
    if handoff_state == HandoffState.AI.value:
        inactive_minutes = (now - updated_at).total_seconds() / 60
        if inactive_minutes > DECAY_THRESHOLD_MIN:
            decay = int((inactive_minutes - DECAY_THRESHOLD_MIN) / 10) * DECAY_PER_10MIN
            score = max(0, score - decay)
    
    return score


class HeatScoreService:
    """热度评分服务"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_unread_count(self, conversation_id: str) -> int:
        """获取会话的未读用户消息数"""
        stmt = (
            select(func.count())
            .select_from(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.role == "user",
                Message.read_at.is_(None),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
    
    async def get_unread_counts_batch(self, conversation_ids: list[str]) -> dict[str, int]:
        """批量获取多个会话的未读消息数"""
        if not conversation_ids:
            return {}
            
        stmt = (
            select(Message.conversation_id, func.count().label("count"))
            .where(
                Message.conversation_id.in_(conversation_ids),
                Message.role == "user",
                Message.read_at.is_(None),
            )
            .group_by(Message.conversation_id)
        )
        result = await self.session.execute(stmt)
        return {row.conversation_id: row.count for row in result.all()}
    
    async def calculate_for_conversation(self, conversation: Conversation) -> int:
        """计算单个会话的热度得分"""
        unread_count = await self.get_unread_count(conversation.id)
        return calculate_heat_score(
            handoff_state=conversation.handoff_state,
            updated_at=conversation.updated_at,
            unread_count=unread_count,
            user_online=conversation.user_online,
            handoff_at=conversation.handoff_at,
        )
    
    async def calculate_for_conversations_batch(
        self,
        conversations: list[Conversation],
    ) -> dict[str, int]:
        """批量计算多个会话的热度得分"""
        if not conversations:
            return {}
        
        # 批量获取未读数
        conversation_ids = [c.id for c in conversations]
        unread_counts = await self.get_unread_counts_batch(conversation_ids)
        
        # 计算得分
        scores = {}
        for conv in conversations:
            scores[conv.id] = calculate_heat_score(
                handoff_state=conv.handoff_state,
                updated_at=conv.updated_at,
                unread_count=unread_counts.get(conv.id, 0),
                user_online=conv.user_online,
                handoff_at=conv.handoff_at,
            )
        
        return scores


async def get_conversations_with_heat(
    session: AsyncSession,
    *,
    state: str | None = None,
    sort_by: str = "heat",  # heat | time
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """获取带热度得分的会话列表
    
    Args:
        session: 数据库会话
        state: 筛选状态（可选）
        sort_by: 排序方式 - heat(热度优先) 或 time(时间优先)
        limit: 分页大小
        offset: 分页偏移
        
    Returns:
        (会话列表, 总数)
    """
    # 构建查询
    stmt = select(Conversation)
    count_stmt = select(func.count()).select_from(Conversation)
    
    if state:
        stmt = stmt.where(Conversation.handoff_state == state)
        count_stmt = count_stmt.where(Conversation.handoff_state == state)
    
    # 按时间倒序获取（热度在内存计算后重排）
    stmt = stmt.order_by(Conversation.updated_at.desc())
    
    # 获取总数
    total_result = await session.execute(count_stmt)
    total = total_result.scalar() or 0
    
    # 如果按热度排序，需要获取更多数据来计算
    if sort_by == "heat":
        # 获取最近的会话（热度排序需要在内存中处理）
        fetch_limit = min(limit + offset + 100, 500)  # 防止内存溢出
        stmt = stmt.limit(fetch_limit)
    else:
        stmt = stmt.offset(offset).limit(limit)
    
    result = await session.execute(stmt)
    conversations = list(result.scalars().all())
    
    # 计算热度和未读数
    heat_service = HeatScoreService(session)
    heat_scores = await heat_service.calculate_for_conversations_batch(conversations)
    unread_counts = await heat_service.get_unread_counts_batch([c.id for c in conversations])
    
    # 构建响应数据
    items = []
    for conv in conversations:
        items.append({
            "id": conv.id,
            "user_id": conv.user_id,
            "title": conv.title,
            "handoff_state": conv.handoff_state,
            "handoff_operator": conv.handoff_operator,
            "user_online": conv.user_online,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "heat_score": heat_scores.get(conv.id, 0),
            "unread_count": unread_counts.get(conv.id, 0),
        })
    
    # 按热度排序
    if sort_by == "heat":
        items.sort(key=lambda x: (-x["heat_score"], -x["updated_at"].timestamp()))
        items = items[offset:offset + limit]
    
    return items, total


async def get_support_stats(session: AsyncSession) -> dict:
    """获取客服统计数据（用于红点提醒）
    
    Returns:
        {
            "pending_count": 等待接入数,
            "human_count": 人工服务中数,
            "total_unread": 总未读消息数,
            "high_heat_count": 高热会话数(得分>60),
        }
    """
    # 状态统计
    state_stmt = (
        select(Conversation.handoff_state, func.count().label("count"))
        .group_by(Conversation.handoff_state)
    )
    state_result = await session.execute(state_stmt)
    state_counts = {row.handoff_state: row.count for row in state_result.all()}
    
    # 未读消息总数（pending 和 human 状态的会话）
    unread_stmt = (
        select(func.count())
        .select_from(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            Conversation.handoff_state.in_([HandoffState.PENDING.value, HandoffState.HUMAN.value]),
            Message.role == "user",
            Message.read_at.is_(None),
        )
    )
    unread_result = await session.execute(unread_stmt)
    total_unread = unread_result.scalar() or 0
    
    # 计算高热会话数（需要获取会话详情）
    hot_conversations, _ = await get_conversations_with_heat(
        session,
        sort_by="heat",
        limit=100,
    )
    high_heat_count = sum(1 for c in hot_conversations if c["heat_score"] > 60)
    
    return {
        "pending_count": state_counts.get(HandoffState.PENDING.value, 0),
        "human_count": state_counts.get(HandoffState.HUMAN.value, 0),
        "total_unread": total_unread,
        "high_heat_count": high_heat_count,
    }
