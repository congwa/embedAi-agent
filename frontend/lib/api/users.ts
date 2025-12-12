// 用户 API

import { apiRequest } from "./client";

interface CreateUserResponse {
  user_id: string;
}

interface UserResponse {
  id: string;
  exists: boolean;
}

export async function createUser(): Promise<CreateUserResponse> {
  return apiRequest<CreateUserResponse>("/api/v1/users", {
    method: "POST",
  });
}

export async function getUser(userId: string): Promise<UserResponse> {
  return apiRequest<UserResponse>(`/api/v1/users/${userId}`);
}
