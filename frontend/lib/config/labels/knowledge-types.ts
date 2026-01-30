/**
 * 知识源类型标签
 */

export const KNOWLEDGE_TYPE_LABELS: Record<string, string> = {
  faq: "FAQ 问答库",
  vector: "向量知识库",
  graph: "图谱知识库",
  product: "商品库",
  http_api: "外部 API",
  mixed: "混合知识源",
};

export function getKnowledgeTypeLabel(type: string): string {
  return KNOWLEDGE_TYPE_LABELS[type] || type;
}
