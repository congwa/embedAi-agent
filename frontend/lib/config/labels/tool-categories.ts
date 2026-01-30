/**
 * 工具类别标签配置
 */

import {
  Search,
  Info,
  Scale,
  Filter,
  FolderTree,
  Star,
  ShoppingCart,
  Compass,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react";
import type { ToolCategoryInfo } from "./types";

export const TOOL_CATEGORY_LABELS: Record<string, ToolCategoryInfo> = {
  search: {
    label: "搜索",
    desc: "在商品库中搜索匹配产品",
    icon: Search,
    tools: [
      { name: "search_products", desc: "搜索匹配的商品" },
      { name: "find_similar_products", desc: "查找相似商品" },
    ],
  },
  query: {
    label: "查询",
    desc: "获取商品详细信息（价格、规格、库存等）",
    icon: Info,
    tools: [{ name: "get_product_details", desc: "获取商品详情" }],
  },
  compare: {
    label: "对比",
    desc: "对比多个商品的参数差异",
    icon: Scale,
    tools: [{ name: "compare_products", desc: "对比商品差异" }],
  },
  filter: {
    label: "筛选",
    desc: "按价格、属性等条件筛选商品",
    icon: Filter,
    tools: [
      { name: "filter_by_price", desc: "按价格区间筛选" },
      { name: "list_products_by_attribute", desc: "按属性筛选" },
    ],
  },
  category: {
    label: "分类",
    desc: "按类目浏览和导航商品",
    icon: FolderTree,
    tools: [
      { name: "list_all_categories", desc: "列出所有类目" },
      { name: "get_category_overview", desc: "获取类目概览" },
      { name: "list_products_by_category", desc: "按类目列出商品" },
      { name: "suggest_related_categories", desc: "推荐相关类目" },
    ],
  },
  featured: {
    label: "精选",
    desc: "展示精选推荐商品",
    icon: Star,
    tools: [{ name: "list_featured_products", desc: "获取精选商品" }],
  },
  purchase: {
    label: "购买",
    desc: "获取商品购买链接和渠道",
    icon: ShoppingCart,
    tools: [{ name: "get_product_purchase_links", desc: "获取购买链接" }],
  },
  guide: {
    label: "引导",
    desc: "引导用户明确需求",
    icon: Compass,
    tools: [{ name: "guide_user", desc: "引导用户" }],
  },
  faq: {
    label: "FAQ",
    desc: "FAQ 知识库检索",
    icon: MessageSquare,
    tools: [{ name: "faq_search", desc: "搜索 FAQ 知识库" }],
  },
  kb: {
    label: "知识库",
    desc: "通用知识库检索",
    icon: FileText,
    tools: [{ name: "kb_search", desc: "搜索知识库" }],
  },
};

export function getToolCategoryLabel(category: string): ToolCategoryInfo {
  return (
    TOOL_CATEGORY_LABELS[category] || {
      label: category,
      desc: "",
      icon: Settings,
    }
  );
}
