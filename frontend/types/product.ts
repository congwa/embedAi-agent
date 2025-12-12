// 商品相关类型

export interface Product {
  id: string;
  name: string;
  price: number | null;
  summary: string | null;
  url: string | null;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  summary: string | null;
  price: number | null;
  url: string | null;
}
