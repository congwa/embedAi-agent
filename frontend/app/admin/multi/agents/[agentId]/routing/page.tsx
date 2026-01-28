"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Route, Save, Loader2 } from "lucide-react";
import { useAgentDetail } from "@/lib/hooks/use-agents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MultiAgentRoutingPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent } = useAgentDetail({ agentId });
  
  const [routingHints, setRoutingHints] = useState("");
  const [priority, setPriority] = useState(100);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (agent) {
      setDescription(agent.description || "");
    }
  }, [agent]);

  if (!agent) return null;

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: 保存路由配置到后端
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30">
        <Route className="h-4 w-4 text-violet-600" />
        <AlertDescription>
          配置 Supervisor 如何将用户请求路由到此子 Agent。
        </AlertDescription>
      </Alert>

      {/* 路由关键词 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4 text-violet-500" />
            路由关键词
          </CardTitle>
          <CardDescription>
            当用户消息包含这些关键词时，优先路由到此 Agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>关键词列表（用逗号分隔）</Label>
            <Textarea
              value={routingHints}
              onChange={(e) => {
                setRoutingHints(e.target.value);
                setHasChanges(true);
              }}
              placeholder="例如：商品, 价格, 推荐, 购买"
              className="mt-2"
              rows={3}
            />
            <p className="mt-2 text-xs text-zinc-500">
              Supervisor 会根据这些关键词匹配用户意图，决定是否将请求转发给此 Agent
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 优先级配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">优先级</CardTitle>
          <CardDescription>
            当多个 Agent 都匹配时，优先级高的 Agent 会被优先选择
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>优先级分数（0-1000，越高越优先）</Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={priority}
                onChange={(e) => {
                  setPriority(parseInt(e.target.value) || 0);
                  setHasChanges(true);
                }}
                className="mt-2 w-32"
              />
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {priority}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agent 描述 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent 描述</CardTitle>
          <CardDescription>
            Supervisor 会参考此描述来理解 Agent 的职责
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setHasChanges(true);
            }}
            placeholder="描述此 Agent 的专长和适用场景..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存配置
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
