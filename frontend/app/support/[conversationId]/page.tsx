"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Phone,
  PhoneOff,
  User,
  Bot,
  Headphones,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSupportWebSocket } from "@/hooks/use-support-websocket";
import {
  getConversationDetail,
  startHandoff,
  endHandoff,
  type ConversationDetailResponse,
} from "@/lib/api/support";
import type { SupportMessage, ConversationState } from "@/types/websocket";

export default function SupportChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  
  // 简单的 agentId（实际应从认证获取）
  const [agentId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("support_agent_id");
      if (!id) {
        id = `agent_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem("support_agent_id", id);
      }
      return id;
    }
    return "agent_default";
  });

  const [conversation, setConversation] = useState<ConversationDetailResponse | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket 消息回调
  const handleNewMessage = useCallback((message: SupportMessage) => {
    setMessages((prev) => {
      // 去重
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  // 本地状态（覆盖 WebSocket 的状态，用于保底）
  const [localHandoffState, setLocalHandoffState] = useState<"ai" | "pending" | "human" | null>(null);

  // WebSocket 状态变更回调
  const handleStateChange = useCallback((state: ConversationState) => {
    console.log("State changed:", state);
    // 同步到本地状态
    setLocalHandoffState(state.handoff_state);
  }, []);

  // WebSocket 连接
  const {
    isConnected,
    conversationState,
    userTyping,
    sendMessage,
    startHandoff: wsStartHandoff,
    endHandoff: wsEndHandoff,
  } = useSupportWebSocket({
    conversationId,
    agentId,
    onMessage: handleNewMessage,
    onStateChange: handleStateChange,
  });

  // 有效的 handoff 状态（优先使用本地状态，其次使用 WebSocket 状态）
  const effectiveHandoffState = localHandoffState ?? conversationState.handoff_state;

  // 加载会话详情和历史消息
  useEffect(() => {
    async function loadConversation() {
      try {
        setIsLoading(true);
        const data = await getConversationDetail(conversationId);
        setConversation(data);
        
        // 初始化本地状态（从后端获取最新状态）
        if (data.handoff_state) {
          setLocalHandoffState(data.handoff_state as "ai" | "pending" | "human");
        }
        
        // 转换历史消息格式
        const historyMessages: SupportMessage[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role as SupportMessage["role"],
          content: m.content,
          created_at: m.created_at,
        }));
        setMessages(historyMessages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    }

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    
    if (effectiveHandoffState !== "human") {
      setError("请先点击「接入」开始客服介入");
      return;
    }
    
    sendMessage(inputValue.trim());
    
    // 本地立即显示（乐观更新）
    const localMessage: SupportMessage = {
      id: `local_${Date.now()}`,
      role: "human_agent",
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
      operator: agentId,
    };
    setMessages((prev) => [...prev, localMessage]);
    setInputValue("");
  }, [inputValue, effectiveHandoffState, sendMessage, agentId]);

  // 开始介入
  const handleStartHandoff = useCallback(async () => {
    try {
      const result = await startHandoff(conversationId, agentId, "客服主动接入");
      if (result.success) {
        // 使用 API 返回的最新状态（保底机制），等待服务器广播
        setLocalHandoffState(result.handoff_state || "human");
      } else if (result.error) {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "接入失败");
    }
  }, [conversationId, agentId, wsStartHandoff]);

  // 结束介入
  const handleEndHandoff = useCallback(async () => {
    try {
      const result = await endHandoff(conversationId, agentId, "客服结束服务");
      if (result.success) {
        // 使用 API 返回的最新状态（保底机制），等待服务器广播
        setLocalHandoffState(result.handoff_state || "ai");
      } else if (result.error) {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "结束失败");
    }
  }, [conversationId, agentId, wsEndHandoff]);

  // 键盘提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 渲染消息
  const renderMessage = (message: SupportMessage) => {
    const isUser = message.role === "user";
    const isAgent = message.role === "human_agent";
    const isAI = message.role === "assistant";
    const isSystem = message.role === "system";

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="px-3 py-1 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-full">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 mb-4",
          isUser ? "flex-row" : "flex-row-reverse"
        )}
      >
        {/* 头像 */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isUser && "bg-blue-500",
            isAI && "bg-orange-500",
            isAgent && "bg-green-500"
          )}
        >
          {isUser && <User className="h-4 w-4 text-white" />}
          {isAI && <Bot className="h-4 w-4 text-white" />}
          {isAgent && <Headphones className="h-4 w-4 text-white" />}
        </div>

        {/* 消息内容 */}
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-2",
            isUser && "bg-blue-500 text-white",
            isAI && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
            isAgent && "bg-green-500 text-white"
          )}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          <div
            className={cn(
              "text-xs mt-1 opacity-70",
              isUser || isAgent ? "text-white" : "text-zinc-500"
            )}
          >
            {new Date(message.created_at).toLocaleTimeString()}
            {isAI && " · AI"}
            {isAgent && message.operator && ` · ${message.operator}`}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent mx-auto" />
          <p className="text-sm text-zinc-500">加载会话...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* 顶部栏 */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/support")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {conversation?.title || "会话"}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>用户: {conversation?.user_id?.slice(0, 8)}...</span>
              <span className="flex items-center gap-1">
                <Circle
                  className={cn(
                    "h-2 w-2",
                    conversationState.user_online
                      ? "fill-green-500 text-green-500"
                      : "fill-zinc-300 text-zinc-300"
                  )}
                />
                {conversationState.user_online ? "在线" : "离线"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 连接状态 */}
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              isConnected
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            <Circle
              className={cn(
                "h-2 w-2",
                isConnected
                  ? "fill-green-500 text-green-500"
                  : "fill-red-500 text-red-500"
              )}
            />
            {isConnected ? "已连接" : "断开"}
          </div>

          {/* 介入状态 */}
          <div
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              effectiveHandoffState === "human"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {effectiveHandoffState === "human" ? "人工模式" : "AI 模式"}
          </div>

          {/* 介入按钮 */}
          {effectiveHandoffState !== "human" ? (
            <Button
              size="sm"
              onClick={handleStartHandoff}
              className="bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-4 w-4 mr-1" />
              接入
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEndHandoff}
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              <PhoneOff className="h-4 w-4 mr-1" />
              结束
            </Button>
          )}
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-2 p-2 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            关闭
          </button>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">
              暂无消息
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          
          {/* 用户正在输入 */}
          {userTyping && (
            <div className="flex gap-3 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="shrink-0 border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                effectiveHandoffState === "human"
                  ? "输入消息..."
                  : "请先点击「接入」开始客服介入"
              }
              disabled={effectiveHandoffState !== "human"}
              className={cn(
                "flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm",
                "focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500",
                "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || effectiveHandoffState !== "human"}
              className="h-11 w-11 rounded-xl bg-green-500 hover:bg-green-600"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
