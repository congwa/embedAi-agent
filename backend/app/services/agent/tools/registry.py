"""工具注册表 - 集中管理，支持按模式/类别过滤

使用方式：
    from app.services.agent.tools.registry import get_tools
    tools = get_tools(mode="natural")

扩展方式：
    在 _get_tool_specs() 中添加新的 ToolSpec 即可
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from app.core.logging import get_logger

logger = get_logger("tools.registry")


@dataclass
class ToolSpec:
    """工具规格定义
    
    Attributes:
        name: 工具名称（用于日志和过滤）
        tool: 工具函数
        categories: 工具类别（用于按类别过滤）
        modes: 可用的聊天模式列表，None 表示所有模式可用
        enabled: 是否启用
    """
    name: str
    tool: Callable[..., Any]
    categories: list[str] = field(default_factory=list)
    modes: list[str] | None = None  # None = 所有模式可用
    enabled: bool = True


# ========== 工具列表（一目了然） ==========
#
# 名称                        │ 类别           │ 说明
# ────────────────────────────┼────────────────┼────────────────────
# search_products             │ search, core   │ 搜索商品
# get_product_details         │ query, core    │ 获取商品详情
# compare_products            │ compare        │ 对比商品
# filter_by_price             │ filter         │ 价格筛选
# guide_user                  │ guide          │ 引导用户
# list_all_categories         │ category       │ 列出所有类目
# get_category_overview       │ category       │ 类目概览
# list_products_by_category   │ category       │ 按类目列商品
# find_similar_products       │ search         │ 查找相似商品
# list_featured_products      │ featured       │ 精选商品
# list_products_by_attribute  │ filter         │ 按属性筛选
# suggest_related_categories  │ category       │ 推荐相关类目
# get_product_purchase_links  │ purchase       │ 获取购买链接
# ────────────────────────────┴────────────────┴────────────────────


def _get_tool_specs() -> list[ToolSpec]:
    """获取所有工具规格列表
    
    Returns:
        工具规格列表
    """
    from app.services.agent.tools.search_products import search_products
    from app.services.agent.tools.get_product_details import get_product_details
    from app.services.agent.tools.compare_products import compare_products
    from app.services.agent.tools.filter_by_price import filter_by_price
    from app.services.agent.tools.guide_user import guide_user
    from app.services.agent.tools.list_all_categories import list_all_categories
    from app.services.agent.tools.get_category_overview import get_category_overview
    from app.services.agent.tools.list_products_by_category import list_products_by_category
    from app.services.agent.tools.find_similar_products import find_similar_products
    from app.services.agent.tools.list_featured_products import list_featured_products
    from app.services.agent.tools.list_products_by_attribute import list_products_by_attribute
    from app.services.agent.tools.suggest_related_categories import suggest_related_categories
    from app.services.agent.tools.get_product_purchase_links import get_product_purchase_links

    return [
        # 核心搜索工具
        ToolSpec(
            name="search_products",
            tool=search_products,
            categories=["search", "core"],
        ),
        ToolSpec(
            name="get_product_details",
            tool=get_product_details,
            categories=["query", "core"],
        ),
        # 对比工具
        ToolSpec(
            name="compare_products",
            tool=compare_products,
            categories=["compare"],
        ),
        # 筛选工具
        ToolSpec(
            name="filter_by_price",
            tool=filter_by_price,
            categories=["filter"],
        ),
        ToolSpec(
            name="list_products_by_attribute",
            tool=list_products_by_attribute,
            categories=["filter"],
        ),
        # 引导工具
        ToolSpec(
            name="guide_user",
            tool=guide_user,
            categories=["guide"],
        ),
        # 类目工具
        ToolSpec(
            name="list_all_categories",
            tool=list_all_categories,
            categories=["category"],
        ),
        ToolSpec(
            name="get_category_overview",
            tool=get_category_overview,
            categories=["category"],
        ),
        ToolSpec(
            name="list_products_by_category",
            tool=list_products_by_category,
            categories=["category"],
        ),
        ToolSpec(
            name="suggest_related_categories",
            tool=suggest_related_categories,
            categories=["category"],
        ),
        # 相似商品
        ToolSpec(
            name="find_similar_products",
            tool=find_similar_products,
            categories=["search"],
        ),
        # 精选商品
        ToolSpec(
            name="list_featured_products",
            tool=list_featured_products,
            categories=["featured"],
        ),
        # 购买链接
        ToolSpec(
            name="get_product_purchase_links",
            tool=get_product_purchase_links,
            categories=["purchase"],
        ),
    ]


def get_tools(
    mode: str = "natural",
    categories: list[str] | None = None,
    exclude_categories: list[str] | None = None,
) -> list[Callable[..., Any]]:
    """获取工具列表（对外接口）
    
    Args:
        mode: 聊天模式（natural/free/strict）
        categories: 只返回指定类别的工具（可选）
        exclude_categories: 排除指定类别的工具（可选）
    
    Returns:
        工具函数列表
    
    Examples:
        # 获取所有工具
        tools = get_tools()
        
        # 只获取搜索类工具
        tools = get_tools(categories=["search"])
        
        # 排除引导类工具
        tools = get_tools(exclude_categories=["guide"])
    """
    specs = _get_tool_specs()
    tools: list[Callable[..., Any]] = []

    for spec in specs:
        # 检查是否启用
        if not spec.enabled:
            continue

        # 模式过滤
        if spec.modes is not None and mode not in spec.modes:
            continue

        # 包含类别过滤
        if categories is not None:
            if not any(c in spec.categories for c in categories):
                continue

        # 排除类别过滤
        if exclude_categories is not None:
            if any(c in spec.categories for c in exclude_categories):
                continue

        tools.append(spec.tool)

    logger.debug(f"加载 {len(tools)} 个工具", mode=mode)
    return tools


def get_tool_names(mode: str = "natural") -> list[str]:
    """获取工具名称列表（用于日志/调试）
    
    Args:
        mode: 聊天模式
    
    Returns:
        工具名称列表
    """
    specs = _get_tool_specs()
    names: list[str] = []

    for spec in specs:
        if not spec.enabled:
            continue
        if spec.modes is not None and mode not in spec.modes:
            continue
        names.append(spec.name)

    return names
