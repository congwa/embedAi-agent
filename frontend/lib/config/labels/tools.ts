/**
 * 工具名称标签配置
 */

import type { ToolInfo } from "./types";

export const TOOL_NAME_LABELS: Record<string, ToolInfo> = {
  // 搜索类
  search_products: { label: "商品搜索", desc: "根据关键词搜索匹配的商品" },
  find_similar_products: { label: "相似商品", desc: "查找与指定商品相似的产品" },
  // 查询类
  get_product_details: { label: "商品详情", desc: "获取商品的详细信息" },
  // 对比类
  compare_products: { label: "商品对比", desc: "对比多个商品的参数差异" },
  // 筛选类
  filter_by_price: { label: "价格筛选", desc: "按价格区间筛选商品" },
  list_products_by_attribute: { label: "属性筛选", desc: "按商品属性筛选" },
  // 分类类
  list_all_categories: { label: "全部分类", desc: "列出所有商品类目" },
  get_category_overview: { label: "分类概览", desc: "获取类目的统计概览" },
  list_products_by_category: { label: "分类商品", desc: "列出某分类下的商品" },
  suggest_related_categories: { label: "相关分类", desc: "推荐相关的商品类目" },
  // 精选类
  list_featured_products: { label: "精选商品", desc: "获取精选推荐商品列表" },
  // 购买类
  get_product_purchase_links: { label: "购买链接", desc: "获取商品的购买渠道" },
  // 引导类
  guide_user: { label: "用户引导", desc: "引导用户明确购买需求" },
  // 知识库类
  faq_search: { label: "FAQ 搜索", desc: "搜索 FAQ 知识库" },
  kb_search: { label: "知识库搜索", desc: "搜索通用知识库" },
};

export function getToolNameLabel(name: string): ToolInfo {
  return TOOL_NAME_LABELS[name] || { label: name, desc: "" };
}
