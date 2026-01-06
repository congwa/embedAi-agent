/**
 * 统一错误处理
 *
 * 提供标准化的错误类和工具函数，用于解析后端返回的错误响应。
 */

/** 后端返回的错误结构 */
export interface ApiErrorPayload {
  code: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

/** API 错误类 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorPayload
  ) {
    super(payload.message);
    this.name = "ApiError";
  }

  /** 错误码 */
  get code(): string {
    return this.payload.code;
  }

  /** 附加数据 */
  get data(): Record<string, unknown> | undefined {
    return this.payload.data;
  }
}

// ========== 错误判断工具函数 ==========

/** 是否为 API 错误 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** 是否为资源不存在错误 (404) */
export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

/** 是否为权限不足错误 (403) */
export function isForbidden(error: unknown): boolean {
  return isApiError(error) && error.status === 403;
}

/** 是否为未授权错误 (401) */
export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

/** 是否为服务不可用错误 (503) */
export function isServiceUnavailable(error: unknown): boolean {
  return isApiError(error) && error.status === 503;
}

/** 是否为请求参数错误 (400) */
export function isBadRequest(error: unknown): boolean {
  return isApiError(error) && error.status === 400;
}

/** 是否为验证错误 (422) */
export function isValidationError(error: unknown): boolean {
  return isApiError(error) && error.status === 422;
}

// ========== 错误信息提取 ==========

/** 获取用户友好的错误信息 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.payload.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "发生未知错误";
}

/** 获取错误码 */
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.payload.code;
  }
  return undefined;
}

/** 根据错误码获取特定消息 */
export function getMessageByCode(
  error: unknown,
  codeMessages: Record<string, string>
): string {
  const code = getErrorCode(error);
  if (code && code in codeMessages) {
    return codeMessages[code];
  }
  return getErrorMessage(error);
}
