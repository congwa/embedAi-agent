"use client";

/**
 * 主题化聊天组件
 * 
 * 这些组件根据当前主题自动应用对应的样式类名
 */

import React from "react";
import { cn } from "@/lib/utils";
import { useChatThemeOptional } from "./chat-theme-provider";

interface ThemedProps {
  children: React.ReactNode;
  className?: string;
}

// 获取主题类名的 helper
function useThemeClass(component: string, fallbackClass: string): string {
  const theme = useChatThemeOptional();
  if (!theme) return fallbackClass;
  return (theme.theme.components as Record<string, string>)[component] || fallbackClass;
}

// 聊天容器
export function ThemedChatContainer({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("chatContainer", "chat-default");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 头部
export function ThemedHeader({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("header", "chat-default-header");
  return (
    <header className={cn(themeClass, className)}>
      {children}
    </header>
  );
}

// 消息区域
export function ThemedMessageArea({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("messageArea", "chat-default-messages");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 输入区域容器
export function ThemedInputArea({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("inputArea", "chat-default-input-area");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 用户消息气泡
export function ThemedUserMessage({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("userMessage", "chat-default-user-msg");
  const theme = useChatThemeOptional();
  const motionClass = theme?.theme.motion.messageAppear || "animate-fade-in";
  
  return (
    <div className={cn(themeClass, motionClass, className)}>
      {children}
    </div>
  );
}

// AI 消息气泡
export function ThemedAIMessage({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("aiMessage", "chat-default-ai-msg");
  const theme = useChatThemeOptional();
  const motionClass = theme?.theme.motion.messageAppear || "animate-fade-in";
  
  return (
    <div className={cn(themeClass, motionClass, className)}>
      {children}
    </div>
  );
}

// 输入框包装器
export function ThemedInputWrapper({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("inputWrapper", "chat-default-input-wrapper");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 发送按钮
interface ThemedSendButtonProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}

export function ThemedSendButton({ 
  children, 
  className, 
  isActive = false,
  disabled,
  onClick,
  title 
}: ThemedSendButtonProps) {
  const baseClass = useThemeClass("sendButton", "chat-default-send-btn");
  const activeClass = useThemeClass("sendButtonActive", "chat-default-send-btn-active");
  const theme = useChatThemeOptional();
  const pressClass = theme?.theme.motion.buttonPress || "active:scale-95";
  
  return (
    <button
      className={cn(
        baseClass,
        isActive && activeClass,
        pressClass,
        className
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

// 空状态容器
export function ThemedEmptyState({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("emptyState", "chat-default-empty");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 空状态图标
export function ThemedEmptyIcon({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("emptyIcon", "chat-default-empty-icon");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 空状态标题
export function ThemedEmptyTitle({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("emptyTitle", "chat-default-empty-title");
  return (
    <h2 className={cn(themeClass, className)}>
      {children}
    </h2>
  );
}

// 空状态描述
export function ThemedEmptyDescription({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("emptyDescription", "chat-default-empty-desc");
  return (
    <p className={cn(themeClass, className)}>
      {children}
    </p>
  );
}

// 建议按钮
interface ThemedSuggestionButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ThemedSuggestionButton({ 
  children, 
  className, 
  disabled,
  onClick 
}: ThemedSuggestionButtonProps) {
  const themeClass = useThemeClass("suggestionButton", "chat-default-suggestion");
  const theme = useChatThemeOptional();
  const transitionClass = theme?.theme.motion.transition || "transition-all duration-200";
  
  return (
    <button
      className={cn(themeClass, transitionClass, className)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// LLM 调用集群
export function ThemedLLMCluster({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("llmCallCluster", "chat-default-llm-cluster");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// LLM 调用头部
export function ThemedLLMHeader({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("llmCallHeader", "chat-default-llm-header");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// LLM 调用主体
export function ThemedLLMBody({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("llmCallBody", "chat-default-llm-body");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 推理区域
export function ThemedReasoning({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("reasoning", "chat-default-reasoning");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}

// 内容区域
export function ThemedContent({ children, className }: ThemedProps) {
  const themeClass = useThemeClass("content", "chat-default-content");
  return (
    <div className={cn(themeClass, className)}>
      {children}
    </div>
  );
}
