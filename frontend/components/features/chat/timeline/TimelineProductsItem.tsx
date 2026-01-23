"use client";

import { ProductCard } from "../ProductCard";
import type { ProductsItem } from "@/hooks/use-timeline-reducer";

interface TimelineProductsItemProps {
  item: ProductsItem;
}

export function TimelineProductsItem({ item }: TimelineProductsItemProps) {
  if (!item.products || item.products.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {item.products.map((product, index) => {
        const productId =
          typeof product.id === "string" && product.id ? product.id : null;
        const productKey = productId ?? `${item.id}-product-${index}`;
        return (
          <ProductCard
            key={productKey}
            product={product}
            rank={index + 1}
            showRank={item.products.length <= 5}
          />
        );
      })}
    </div>
  );
}
