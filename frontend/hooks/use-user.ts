"use client";

import { useCallback, useEffect, useState } from "react";
import { createUser, getUser } from "@/lib/api";

const USER_ID_KEY = "embed_ai_user_id";

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initUser() {
      try {
        // 尝试从 localStorage 获取用户 ID
        const storedUserId = localStorage.getItem(USER_ID_KEY);
        
        if (storedUserId) {
          // 验证用户是否存在
          const user = await getUser(storedUserId);
          if (user.exists) {
            setUserId(storedUserId);
            console.log("[user] 已恢复用户:", storedUserId);
            return;
          }
        }
        
        // 创建新用户
        const response = await createUser();
        localStorage.setItem(USER_ID_KEY, response.user_id);
        setUserId(response.user_id);
        console.log("[user] 已创建新用户:", response.user_id);
      } catch (error) {
        console.error("[user] 初始化用户失败:", error);
        // 创建本地临时用户 ID
        const tempId = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, tempId);
        setUserId(tempId);
      } finally {
        setIsLoading(false);
      }
    }

    initUser();
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    setUserId(null);
  }, []);

  return {
    userId,
    isLoading,
    clearUser,
  };
}
