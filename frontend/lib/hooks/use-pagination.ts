"use client";

import { useState, useCallback, useEffect } from "react";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  autoLoad?: boolean;
}

interface UsePaginationReturn<T> {
  data: PaginatedResponse<T> | null;
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { initialPage = 1, pageSize = 20, autoLoad = true } = options;

  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn(page, pageSize);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, pageSize]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  const totalPages = data?.total_pages || 0;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToFirstPage = useCallback(() => setPage(1), []);
  const goToLastPage = useCallback(() => setPage(totalPages), [totalPages]);
  const goToNextPage = useCallback(() => {
    if (hasNextPage) setPage((p) => p + 1);
  }, [hasNextPage]);
  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) setPage((p) => p - 1);
  }, [hasPrevPage]);

  return {
    data,
    items: data?.items || [],
    page,
    pageSize,
    totalPages,
    total: data?.total || 0,
    isLoading,
    error,
    setPage,
    refresh: loadData,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  };
}
