"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isApiError, getErrorMessage } from "@/lib/errors";

interface FormErrorProps {
  error: unknown;
  className?: string;
}

/**
 * 表单错误提示组件
 *
 * 用于在表单顶部或操作区域显示错误信息。
 */
export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;

  const message = getErrorMessage(error);
  const code = isApiError(error) ? error.code : undefined;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="size-4" />
      <AlertDescription>
        {message}
        {code && code !== `http_${isApiError(error) ? error.status : ""}` && (
          <span className="ml-2 text-xs opacity-70">({code})</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
