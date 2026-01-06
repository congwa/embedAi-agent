"use client";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  text?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function LoadingState({
  text,
  className,
  size = "default",
}: LoadingStateProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex h-[50vh] flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100",
          sizeMap[size]
        )}
      />
      {text && <p className="text-sm text-zinc-500">{text}</p>}
    </div>
  );
}

interface InlineLoadingProps {
  className?: string;
}

export function InlineLoading({ className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
    </div>
  );
}
