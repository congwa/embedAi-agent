export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const requestId =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ||
    `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const target = process.env.API_PROXY_TARGET || "http://127.0.0.1:8000";

  // 读取请求体（聊天请求通常很小，读入内存是安全的）
  const bodyText = await req.text();

  console.log("[sse-proxy] /api/v1/chat start", {
    requestId,
    target,
    bodyLength: bodyText.length,
  });

  const upstream = await fetch(`${target}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: bodyText,
    // 不缓存，尽量保持实时性
    cache: "no-store",
  });

  console.log("[sse-proxy] /api/v1/chat upstream", {
    requestId,
    status: upstream.status,
    ok: upstream.ok,
  });

  // 透传错误（避免前端一直等待流）
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return new Response(text || `Upstream HTTP ${upstream.status}`, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // 关键：透传可读流，不要在 Next 层做任何聚合/解析
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // 避免任何中间层对 SSE 做 transform/compress buffering
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}


