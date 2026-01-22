"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  TrendingUp,
  User,
  Bot,
  Plus,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FAQFormSheet } from "@/components/admin/faq/faq-form-sheet";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { createFAQEntry, type Agent, type FAQEntry } from "@/lib/api/agents";
import { Markdown } from "@/components/prompt-kit/markdown";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

// Mock 数据，后续可替换为真实 API
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "关于退款政策的咨询",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "请问你们的退款政策是什么？",
        timestamp: "2024-01-07T10:30:00Z",
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "我们提供7天无理由退款服务。如果商品存在质量问题，可以在30天内申请退换货。退款会在3-5个工作日内原路返回。",
        timestamp: "2024-01-07T10:30:05Z",
      },
      {
        id: "msg-3",
        role: "user",
        content: "那如果超过7天了怎么办？",
        timestamp: "2024-01-07T10:31:00Z",
      },
      {
        id: "msg-4",
        role: "assistant",
        content:
          "超过7天但在30天内，如果商品有质量问题，仍可申请退换。请联系客服并提供商品问题的照片作为凭证。",
        timestamp: "2024-01-07T10:31:10Z",
      },
    ],
    created_at: "2024-01-07T10:30:00Z",
    updated_at: "2024-01-07T10:31:10Z",
  },
  {
    id: "conv-2",
    title: "商品配送时间咨询",
    messages: [
      {
        id: "msg-5",
        role: "user",
        content: "下单后多久能收到货？",
        timestamp: "2024-01-07T09:15:00Z",
      },
      {
        id: "msg-6",
        role: "assistant",
        content:
          "一般情况下，订单会在24小时内发货。配送时间根据地区不同，通常为2-5个工作日。偏远地区可能需要5-7个工作日。",
        timestamp: "2024-01-07T09:15:08Z",
      },
    ],
    created_at: "2024-01-07T09:15:00Z",
    updated_at: "2024-01-07T09:15:08Z",
  },
];

export default function AgentConversationsPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent } = useAgentDetail({ agentId });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);

  // FAQ 表单状态
  const [faqSheetOpen, setFaqSheetOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    // TODO: 替换为真实 API 调用
    // const data = await fetch(`/api/v1/admin/agents/${agentId}/conversations`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setConversations(mockConversations);
    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleAddToFAQ = (userMsg: ConversationMessage, assistantMsg: ConversationMessage, convId: string) => {
    setSelectedQuestion(userMsg.content);
    setSelectedAnswer(assistantMsg.content);
    setSelectedSource(`conversation:${convId}`);
    setFaqSheetOpen(true);
  };

  const handleSaveFAQ = async (data: Partial<FAQEntry>) => {
    const result = await createFAQEntry({
      ...data,
      agent_id: agentId,
    });
    return { merged: result.merged, target_id: result.target_id };
  };

  const toggleExpand = (convId: string) => {
    setExpandedConv(expandedConv === convId ? null : convId);
  };

  // 统计数据
  const totalConversations = conversations.length;
  const todayConversations = conversations.filter((c) => {
    const today = new Date().toDateString();
    return new Date(c.created_at).toDateString() === today;
  }).length;
  const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0);

  return (
    <div className="space-y-6">
      {/* 会话统计 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">总会话数</p>
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-zinc-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">今日会话</p>
                <p className="text-2xl font-bold">{todayConversations}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">消息总数</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 会话列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            最近会话
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadConversations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-zinc-400">
              暂无会话记录
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                  {/* 会话头部 */}
                  <div
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => toggleExpand(conv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <MessageSquare className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <p className="font-medium">{conv.title}</p>
                        <p className="text-xs text-zinc-500">
                          {conv.messages.length} 条消息 ·{" "}
                          {new Date(conv.created_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    {expandedConv === conv.id ? (
                      <ChevronUp className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>

                  {/* 展开的消息列表 */}
                  {expandedConv === conv.id && (
                    <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="space-y-4">
                        {conv.messages.map((msg, idx) => {
                          const isUser = msg.role === "user";
                          // 找到下一条助手消息用于配对
                          const nextMsg = conv.messages[idx + 1];
                          const canAddToFAQ =
                            isUser && nextMsg?.role === "assistant";

                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${isUser ? "" : "pl-4"}`}
                            >
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                  isUser
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : "bg-green-100 dark:bg-green-900"
                                }`}
                              >
                                {isUser ? (
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {isUser ? "用户" : "助手"}
                                  </Badge>
                                  <span className="text-xs text-zinc-400">
                                    {new Date(msg.timestamp).toLocaleTimeString(
                                      "zh-CN"
                                    )}
                                  </span>
                                  {canAddToFAQ && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-auto h-7 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToFAQ(msg, nextMsg, conv.id);
                                      }}
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      加入 FAQ
                                    </Button>
                                  )}
                                </div>
                                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 prose prose-sm dark:prose-invert max-w-none">
                                  <Markdown>{msg.content}</Markdown>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ 表单 */}
      <FAQFormSheet
        open={faqSheetOpen}
        entry={null}
        agents={agent ? [agent as Agent] : []}
        onClose={() => {
          setFaqSheetOpen(false);
          setSelectedQuestion("");
          setSelectedAnswer("");
          setSelectedSource("");
        }}
        onSave={handleSaveFAQ}
        initialQuestion={selectedQuestion}
        initialAnswer={selectedAnswer}
        initialSource={selectedSource}
        initialAgentId={agentId}
        readOnlyAgent
      />
    </div>
  );
}
