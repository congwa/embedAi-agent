"""Agent 工具定义"""

import json

from langchain.tools import ToolRuntime, tool

from app.core.logging import get_logger
from app.services.agent.retriever import get_retriever
from app.services.streaming.context import ChatContext
from app.schemas.events import StreamEventType

logger = get_logger("tool")


@tool
def search_products(query: str, runtime: ToolRuntime[ChatContext] | None = None) -> str:
    """根据用户需求搜索匹配的商品。

    Args:
        query: 用户的搜索需求描述，如"降噪耳机"、"适合跑步的运动鞋"

    Returns:
        匹配的商品列表，包含名称、价格、描述等信息
    """
    if runtime and getattr(runtime, "context", None) and getattr(runtime.context, "emitter", None):
        runtime.context.emitter.emit(
            StreamEventType.TOOL_START.value,
            {
                "name": "search_products",
                "input": {"query": query},
            },
        )

    logger.info(
        "┌── 工具: search_products 开始 ──┐",
        input_data={
            "query": query,
            "query_length": len(query),
        },
    )
    
    try:
        # 步骤 1: 获取 retriever
        retriever = get_retriever(k=5)
        logger.debug(
            "│ [1] Retriever 已获取",
            retriever_k=5,
        )
        
        # 步骤 2: 向量检索
        logger.debug("│ [2] 开始向量检索...")
        docs = retriever.invoke(query)
        
        logger.info(
            "│ [2] 向量检索完成",
            doc_count=len(docs),
            docs_preview=[
                {
                    "product_id": d.metadata.get("product_id"),
                    "product_name": d.metadata.get("product_name"),
                    "content_preview": d.page_content[:100] + "..." if len(d.page_content) > 100 else d.page_content,
                }
                for d in docs[:3]  # 只显示前 3 个
            ] if docs else [],
        )
        
        if not docs:
            logger.warning(
                "│ [2] 未找到匹配商品",
                query=query,
            )
            logger.info("└── 工具: search_products 结束 (无结果) ──┘")
            return "未找到匹配的商品"
        
        # 步骤 3: 去重和整理结果
        logger.debug("│ [3] 开始去重和整理结果...")
        seen_products = set()
        results = []
        
        for doc in docs:
            product_id = doc.metadata.get("product_id")
            if product_id in seen_products:
                logger.debug(f"│     跳过重复商品: {product_id}")
                continue
            seen_products.add(product_id)
            
            product = {
                "id": product_id,
                "name": doc.metadata.get("product_name"),
                "price": doc.metadata.get("price"),
                "summary": doc.page_content[:200],
                "url": doc.metadata.get("url"),
            }
            results.append(product)
            
            logger.debug(
                f"│     添加商品 #{len(results)}",
                product_id=product_id,
                product_name=doc.metadata.get("product_name"),
                price=doc.metadata.get("price"),
            )
            
            # 最多返回 5 个不同的商品
            if len(results) >= 5:
                break
        
        # 步骤 4: 返回结果
        result_json = json.dumps(results, ensure_ascii=False, indent=2)
        if runtime and getattr(runtime, "context", None) and getattr(runtime.context, "emitter", None):
            runtime.context.emitter.emit(
                StreamEventType.TOOL_END.value,
                {
                    "name": "search_products",
                    "output_preview": results[:3],
                    "count": len(results),
                },
            )
        logger.info(
            "└── 工具: search_products 结束 ──┘",
            output_data={
                "result_count": len(results),
                "products": [
                    {"id": p["id"], "name": p["name"], "price": p["price"]}
                    for p in results
                ],
                "json_length": len(result_json),
            },
        )
        return result_json
        
    except Exception as e:
        if runtime and getattr(runtime, "context", None) and getattr(runtime.context, "emitter", None):
            runtime.context.emitter.emit(
                StreamEventType.TOOL_END.value,
                {
                    "name": "search_products",
                    "error": str(e),
                },
            )
        logger.exception("搜索商品失败", query=query, error=str(e))
        return f"搜索失败: {e}"
