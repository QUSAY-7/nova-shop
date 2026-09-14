// src/features/products/ProductCard.tsx
import React from "react";
import { Copy, Plus, Minus, LayoutGrid, type LucideIcon } from "lucide-react";

// ─── الأنواع ───
interface ProductData {
  id: string;
  title: string;
  description?: string;
  desc?: string;
  image?: string;
  category?: string;
  stock: number;
  compare_at?: number;
  compareAt?: number;
  [key: string]: unknown;
}

interface VariantOption {
  size?: string;
  color?: string;
  [key: string]: unknown;
}

interface SelectedVariantMap {
  [productId: string]: {
    size?: string;
    color?: string;
  };
}

interface ProductCardProps {
  product: ProductData;
  variantOptions?: VariantOption[];
  selectedVariant?: VariantOption | null;
  selectedVariants?: SelectedVariantMap;
  onSelectVariant: (productId: string, field: string, value: string) => void;
  effectivePrice: number;
  effectiveStock: number;
  qty?: number;
  onAddToCart: (product: ProductData) => void;
  onInc: (cartKey: string) => void;
  onDec: (cartKey: string) => void;
  cartKeyStr: string;
  onOpenGallery: (product: ProductData) => void;
  onShare: (product: ProductData) => void;
  productImages?: string[];
  categoryIcon?: LucideIcon;
}

// ─── المكون ───
export default function ProductCard({
  product,
  variantOptions = [],
  selectedVariant = null,
  selectedVariants = {},
  onSelectVariant,
  effectivePrice,
  effectiveStock,
  qty = 0,
  onAddToCart,
  onInc,
  onDec,
  cartKeyStr,
  onOpenGallery,
  onShare,
  productImages = [],
  categoryIcon: CategoryIcon = LayoutGrid,
}: ProductCardProps) {
  const hasVariants = variantOptions.length > 0;
  const compareAt = product.compare_at ?? product.compareAt ?? null;
  const sizeOptions = Array.from(new Set(variantOptions.map((v) => v.size).filter(Boolean)));
  const colorOptions = Array.from(new Set(variantOptions.map((v) => v.color).filter(Boolean)));

  return (
    <div className="product-card">
      <div
        className="product-thumb"
        onClick={() => onOpenGallery(product)}
        style={{ cursor: productImages.length > 0 ? "pointer" : "default" }}
      >
        <span className="product-cat-pill">{product.category}</span>
        {product.stock === 0 && (
          <span className="out-of-stock-badge">نفد المخزون</span>
        )}
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }}
          />
        ) : (
          <CategoryIcon />
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
        <p className="product-name">{product.title}</p>
        <button
          onClick={() => onShare(product)}
          aria-label="مشاركة المنتج"
          style={{
            flexShrink: 0,
            width: "26px",
            height: "26px",
            borderRadius: "999px",
            background: "var(--teal-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Copy size={12} style={{ color: "var(--teal-dark)" }} />
        </button>
      </div>

      <p className="product-desc-sm">{product.description || product.desc}</p>
      {!hasVariants && product.stock > 0 && product.stock <= 5 && (
        <p className="low-stock-note">باقي {product.stock} قطع فقط!</p>
      )}

      {hasVariants && (
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
          {sizeOptions.length > 0 && (
            <select
              value={selectedVariants[product.id]?.size || ""}
              onChange={(e) => onSelectVariant(product.id, "size", e.target.value)}
              style={{ flex: 1, minWidth: "70px", padding: "6px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "12px" }}
            >
              <option value="">المقاس</option>
              {sizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {colorOptions.length > 0 && (
            <select
              value={selectedVariants[product.id]?.color || ""}
              onChange={(e) => onSelectVariant(product.id, "color", e.target.value)}
              style={{ flex: 1, minWidth: "70px", padding: "6px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "12px" }}
            >
              <option value="">اللون</option>
              {colorOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="product-price-row">
        <span className="product-price">{effectivePrice} د.ل</span>
        {compareAt && <span className="product-compare">{compareAt} د.ل</span>}
      </div>

      <div className="product-action">
        {hasVariants && !selectedVariant ? (
          <button className="add-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
            اختر الخيار أولاً
          </button>
        ) : effectiveStock === 0 ? (
          <button className="add-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
            نفد المخزون
          </button>
        ) : qty === 0 ? (
          <button className="add-btn" onClick={() => onAddToCart(product)}>
            <Plus size={14} /> أضف للسلة
          </button>
        ) : (
          <div className="qty-control">
            <button className="qty-btn" onClick={() => onDec(cartKeyStr)}>
              <Minus />
            </button>
            <span className="qty-val">{qty}</span>
            <button
              className="qty-btn"
              onClick={() => onInc(cartKeyStr)}
              disabled={qty >= effectiveStock}
              style={qty >= effectiveStock ? { opacity: 0.4, cursor: "not-allowed" } : {}}
            >
              <Plus />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}