// 聊天相关类型

export interface ChatRequest {
  user_id: string;
  conversation_id: string;
  message: string;
}

export interface ChatEvent {
  type: "text" | "products" | "done" | "error";
  content?: string;
  data?: Product[];
  message_id?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number | null;
  summary: string | null;
  url: string | null;
}
