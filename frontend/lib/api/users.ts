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

// ========== User Profile API ==========

export interface UserProfile {
  user_id: string;
  nickname: string | null;
  tone_preference: string | null;
  budget_min: number | null;
  budget_max: number | null;
  favorite_categories: string[];
  task_progress: Record<string, unknown>;
  feature_flags: Record<string, boolean>;
  custom_data: Record<string, unknown>;
  updated_at: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/api/v1/users/${userId}/profile`);
}

// ========== Fact Memory API ==========

export interface Fact {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface FactListResponse {
  user_id: string;
  total: number;
  items: Fact[];
}

export async function getUserFacts(userId: string, limit?: number): Promise<FactListResponse> {
  const searchParams = new URLSearchParams();
  if (limit) searchParams.set("limit", String(limit));
  const query = searchParams.toString();
  return apiRequest<FactListResponse>(`/api/v1/users/${userId}/facts${query ? `?${query}` : ""}`);
}

// ========== Knowledge Graph API ==========

export interface Entity {
  name: string;
  entity_type: string;
  observations: string[];
}

export interface Relation {
  from_entity: string;
  to_entity: string;
  relation_type: string;
}

export interface GraphResponse {
  user_id: string;
  entity_count: number;
  relation_count: number;
  entities: Entity[];
  relations: Relation[];
}

export async function getUserGraph(userId: string): Promise<GraphResponse> {
  return apiRequest<GraphResponse>(`/api/v1/users/${userId}/graph`);
}
