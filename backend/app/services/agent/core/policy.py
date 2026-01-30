"""工具调用策略配置

定义工具调用策略，替代硬编码的提示词约束。
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ToolPolicy:
    """工具调用策略配置"""

    # 最小工具调用次数（0 表示不强制）
    min_tool_calls: int = 0

    # 无工具调用时的默认回退工具（可选）
    fallback_tool: Optional[str] = None

    # 是否允许无工具调用的直接回答
    allow_direct_answer: bool = True

    # 信息不足时优先使用的澄清工具
    clarification_tool: Optional[str] = None

    # 策略描述（用于日志和调试）
    description: str = ""


# 默认策略：不强制工具调用，允许自由对话
DEFAULT_POLICY = ToolPolicy(
    min_tool_calls=0, allow_direct_answer=True, description="默认策略：不强制工具调用，允许自由对话"
)


def get_policy() -> ToolPolicy:
    """获取默认工具策略"""
    return DEFAULT_POLICY
