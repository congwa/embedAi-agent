"use client";

import { ExternalLink, Star, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  rank?: number;
  showRank?: boolean;
}

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export function ProductCard({ product, rank, showRank = true }: ProductCardProps) {
  // 兼容后端返回 price 缺失 / 为字符串等情况，避免 runtime 报错
  const rawPrice: unknown = (product as unknown as { price?: unknown }).price;
  const price =
    typeof rawPrice === "number"
      ? rawPrice
      : typeof rawPrice === "string"
        ? Number(rawPrice)
        : null;

  const hasRank = showRank && typeof rank === "number" && rank >= 1 && rank <= 3;
  const rankIcon = hasRank ? RANK_ICONS[rank - 1] : null;

  return (
    <div className={cn(
      "flex flex-col gap-2.5 rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-zinc-800",
      hasRank && rank === 1 && "border-amber-200 dark:border-amber-700/50 ring-1 ring-amber-100 dark:ring-amber-900/30",
      hasRank && rank === 2 && "border-zinc-300 dark:border-zinc-600",
      hasRank && rank === 3 && "border-zinc-200 dark:border-zinc-700",
      !hasRank && "border-zinc-200 dark:border-zinc-700"
    )}>
      {/* 头部：排名 + 名称 + 链接 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {rankIcon && <span className="text-lg shrink-0">{rankIcon}</span>}
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {product.name}
          </h4>
        </div>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-zinc-400 hover:text-orange-500 transition-colors"
            title="查看详情"
            aria-label="查看详情"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* 价格 + 评分 */}
      <div className="flex items-center gap-3">
        {typeof price === "number" && !Number.isNaN(price) && (
          <span className="text-base font-bold text-orange-500">
            ¥{price.toFixed(0)}
          </span>
        )}
        {product.rating && (
          <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
            {product.reviewsCount && (
              <span className="text-zinc-400 dark:text-zinc-500">
                ({product.reviewsCount > 1000 ? `${(product.reviewsCount / 1000).toFixed(1)}k` : product.reviewsCount})
              </span>
            )}
          </span>
        )}
        {product.category && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {product.category}
          </span>
        )}
      </div>
      
      {/* 商品摘要 */}
      {product.summary && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {product.summary}
        </p>
      )}

      {/* 亮点标签 */}
      {product.highlights && product.highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.highlights.slice(0, 3).map((highlight, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
            >
              <Tag className="h-2.5 w-2.5" />
              {highlight}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
