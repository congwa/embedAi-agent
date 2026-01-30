"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptViewer } from "@/components/admin";
import type { Agent } from "@/lib/api/agents";

export interface SystemPromptCardProps {
  agent: Agent;
  editHref: string;
}

export function SystemPromptCard({ agent, editHref }: SystemPromptCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">系统提示词</CardTitle>
      </CardHeader>
      <CardContent>
        <PromptViewer 
          content={agent.system_prompt} 
          maxHeight={256}
          editHref={editHref}
          editLabel="编辑提示词"
        />
      </CardContent>
    </Card>
  );
}
