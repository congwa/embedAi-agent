"use client";

import { AlertCircle, RefreshCw, ShieldX, ServerOff, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { isApiError, isNotFound, isForbidden, isServiceUnavailable } from "@/lib/errors";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

/**
 * 统一错误状态展示组件
 *
 * 根据错误类型自动选择图标和默认文案，支持重试操作。
 */
export function ErrorState({
  error,
  title,
  description,
  onRetry,
  retryText = "重试",
  className,
}: ErrorStateProps) {
  // 根据错误类型确定图标和默认文案
  let Icon = AlertCircle;
  let defaultTitle = "加载失败";
  let defaultDescription = "发生未知错误，请稍后重试";

  if (isApiError(error)) {
    defaultDescription = error.payload.message;

    if (isNotFound(error)) {
      Icon = FileQuestion;
      defaultTitle = "资源不存在";
    } else if (isForbidden(error)) {
      Icon = ShieldX;
      defaultTitle = "无权限访问";
    } else if (isServiceUnavailable(error)) {
      Icon = ServerOff;
      defaultTitle = "服务不可用";
    }
  } else if (error instanceof Error) {
    defaultDescription = error.message;
  }

  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5 text-zinc-500" />
        </EmptyMedia>
        <EmptyTitle>{title || defaultTitle}</EmptyTitle>
        <EmptyDescription>{description || defaultDescription}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 size-4" />
            {retryText}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
