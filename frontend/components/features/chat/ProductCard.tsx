"use client";

import { ExternalLink } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {product.name}
        </h4>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      
      {product.summary && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {product.summary}
        </p>
      )}
      
      {product.price !== null && (
        <div className="text-sm font-semibold text-orange-500">
          ¥{product.price.toFixed(2)}
        </div>
      )}
    </div>
  );
}
