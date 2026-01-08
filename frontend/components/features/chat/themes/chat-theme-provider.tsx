"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type ChatThemeId, type ChatThemeConfig, getTheme, getAllThemes } from "./theme-registry";

interface ChatThemeContextValue {
  // 当前主题
  theme: ChatThemeConfig;
  themeId: ChatThemeId;
  // 切换主题
  setTheme: (id: ChatThemeId) => void;
  // 获取所有可用主题
  availableThemes: ChatThemeConfig[];
  // 便捷方法：获取组件类名
  getClass: (component: keyof ChatThemeConfig["components"]) => string;
  // 便捷方法：获取动效类名
  getMotion: (motion: keyof ChatThemeConfig["motion"]) => string;
}

const ChatThemeContext = createContext<ChatThemeContextValue | null>(null);

const STORAGE_KEY = "chat-theme-id";

interface ChatThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ChatThemeId;
}

export function ChatThemeProvider({ 
  children, 
  defaultTheme = "default" 
}: ChatThemeProviderProps) {
  const [themeId, setThemeId] = useState<ChatThemeId>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // 从 localStorage 恢复主题
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ChatThemeId | null;
    if (stored && ["default", "ethereal", "industrial"].includes(stored)) {
      setThemeId(stored);
    }
    setMounted(true);
  }, []);

  // 切换主题
  const setTheme = useCallback((id: ChatThemeId) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
    
    // 更新 document 的 data-chat-theme 属性，用于 CSS 选择器
    document.documentElement.setAttribute("data-chat-theme", id);
  }, []);

  // 初始化时设置 data-chat-theme
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-chat-theme", themeId);
    }
  }, [mounted, themeId]);

  const theme = getTheme(themeId);
  const availableThemes = getAllThemes();

  const getClass = useCallback(
    (component: keyof ChatThemeConfig["components"]) => {
      return theme.components[component];
    },
    [theme]
  );

  const getMotion = useCallback(
    (motion: keyof ChatThemeConfig["motion"]) => {
      return theme.motion[motion];
    },
    [theme]
  );

  const value: ChatThemeContextValue = {
    theme,
    themeId,
    setTheme,
    availableThemes,
    getClass,
    getMotion,
  };

  // 避免 SSR 闪烁
  if (!mounted) {
    return (
      <ChatThemeContext.Provider value={value}>
        {children}
      </ChatThemeContext.Provider>
    );
  }

  return (
    <ChatThemeContext.Provider value={value}>
      {children}
    </ChatThemeContext.Provider>
  );
}

// Hook
export function useChatTheme(): ChatThemeContextValue {
  const context = useContext(ChatThemeContext);
  if (!context) {
    throw new Error("useChatTheme must be used within a ChatThemeProvider");
  }
  return context;
}

// 可选 Hook：检查是否在 Provider 内
export function useChatThemeOptional(): ChatThemeContextValue | null {
  return useContext(ChatThemeContext);
}
