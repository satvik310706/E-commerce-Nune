'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Percent, Package } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameTe: string;
    slug: string;
    description: string;
    images: string[];
    price: number;
    mrp: number;
    stock: number;
    unit: string;
    weight: number;
  };
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=300&auto=format&fit=crop';

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { language, t } = useLanguage();

  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const imageUrl = imgError ? FALLBACK_IMAGE : (product.images?.[0] || FALLBACK_IMAGE);
  const outOfStock = product.stock <= 0;

  const displayName = language === 'te' ? product.nameTe : product.name.split('(')[0].trim();
  const displayUnit = language === 'te'
    ? (product.unit === 'Litre' ? t('misc_litre') : product.unit === 'Gram' ? t('misc_gram') : product.unit === 'Pack' ? t('misc_pack') : product.unit === 'Piece' ? t('misc_piece') : product.unit)
    : product.unit;

  const cartItem = items.find((i) => i.productId === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      nameTe: product.nameTe,
      price: product.price,
      mrp: product.mrp,
      quantity: 1,
      image: product.images?.[0] || FALLBACK_IMAGE,
      weight: product.weight,
      unit: product.unit,
      stock: product.stock,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl border border-amber-100/80 smooth-shadow overflow-hidden hover-lift flex flex-col h-full relative">
      
      {/* Discount Badge */}
      {discountPercent > 0 && !outOfStock && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 flex items-center space-x-0.5 shadow-sm">
          <Percent size={9} />
          <span>{discountPercent}% OFF</span>
        </div>
      )}

      {/* Out of Stock */}
      {outOfStock && (
        <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
          {t('products_out_of_stock')}
        </div>
      )}

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative w-full pt-[85%] bg-amber-50/30 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Weight / Unit tag */}
        <div className="text-[10px] font-bold text-amber-600 mb-1.5">
          {product.weight} {displayUnit}
        </div>

        {/* Name */}
        <Link href={`/products/${product.slug}`} className="block focus:outline-none">
          <h3 className="text-xs sm:text-sm font-bold text-amber-950 group-hover:text-amber-800 line-clamp-2 leading-snug transition-colors">
            {displayName}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline space-x-1.5 mt-3">
          <span className="text-sm sm:text-base font-black text-amber-900">
            ₹{product.price}
          </span>
          {product.mrp > product.price && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through font-medium">
              ₹{product.mrp}
            </span>
          )}
        </div>

        {/* Add to Cart / Quantity Selector */}
        <div className="mt-auto pt-3">
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-250 rounded-xl overflow-hidden h-[38px] smooth-shadow">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, quantityInCart - 1);
                }}
                className="w-10 h-full flex items-center justify-center text-amber-900 hover:bg-amber-100 hover:text-amber-950 transition-colors font-extrabold text-sm border-r border-amber-150"
                aria-label="Decrease quantity"
              >
                —
              </button>
              <span className="font-extrabold text-xs text-amber-950 px-2 select-none">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, quantityInCart + 1);
                }}
                className="w-10 h-full flex items-center justify-center text-amber-900 hover:bg-amber-100 hover:text-amber-950 transition-colors font-extrabold text-sm border-l border-amber-150"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              id={`add-to-cart-${product.id}`}
              className={`w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                outOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : added
                  ? 'bg-green-600 text-white shadow-sm scale-95'
                  : 'bg-amber-800 hover:bg-amber-700 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {added ? (
                <>
                  <Check size={13} />
                  <span>{t('products_added')}</span>
                </>
              ) : outOfStock ? (
                <span>{t('products_no_stock')}</span>
              ) : (
                <>
                  <ShoppingCart size={13} />
                  <span>{t('products_add_cart')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
