// HTTP 客户端

// 默认使用同源（交给 Next rewrites 代理到后端），这样通过局域网访问前端时不会把 localhost 指向“访问设备自身”
// 如需直连后端（例如生产环境），可设置 NEXT_PUBLIC_API_URL="https://api.example.com"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
