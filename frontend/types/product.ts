// 商品相关类型

export interface Product {
  id: string;
  name: string;
  price: number | null;
  summary: string | null;
  url: string | null;
  // 扩展字段（阶段三）
  image?: string;
  category?: string;
  rating?: number;
  reviewsCount?: number;
  specs?: Record<string, string>;
  highlights?: string[];
}

export interface ProductRecommendation {
  product: Product;
  rank: number;              // 1, 2, 3...
  matchScore: number;        // 0-100
  reason: string;            // AI 生成的推荐理由
  highlights: string[];      // 亮点标签
}

export interface ProductSearchResult {
  id: string;
  name: string;
  summary: string | null;
  price: number | null;
  url: string | null;
  category?: string;
  highlights?: string[];
}
