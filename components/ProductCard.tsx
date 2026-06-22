'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, Layers, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import VariantSelectorModal from '@/components/VariantSelectorModal';
import type { RawProduct, GroupedProduct } from '@/hooks/useGroupedProducts';

interface ProductCardProps {
  group: GroupedProduct;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=400&auto=format&fit=crop';

function formatVariantLabel(product: RawProduct): string {
  const w = product.weight;
  const u = product.unit;
  if (u === 'Litre' || u === 'Liter') {
    return w >= 1 ? `${w} Litre` : `${Math.round(w * 1000)} ml`;
  }
  if (u === 'Gram' || u === 'g') {
    return w >= 1000 ? `${w / 1000} Kg` : `${w} g`;
  }
  if (u === 'Kg' || u === 'kg') return `${w} Kg`;
  if (u === 'ml') return w >= 1000 ? `${w / 1000} L` : `${w} ml`;
  return `${w} ${u}`;
}

export default function ProductCard({ group }: ProductCardProps) {
  const { representative, variants, minPrice, minMrp, groupKey } = group;

  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { language, t } = useLanguage();

  const isSingleVariant = variants.length === 1;
  const displayName = language === 'te' ? representative.nameTe : groupKey;
  const imageUrl = imgError ? FALLBACK_IMAGE : (representative.images?.[0] || FALLBACK_IMAGE);
  const outOfStock = representative.stock <= 0;

  // Discount based on representative (lowest price variant)
  const discountPercent =
    minMrp > minPrice ? Math.round(((minMrp - minPrice) / minMrp) * 100) : 0;

  // Total qty of all variants of this group in cart
  const totalCartQty = variants.reduce((sum, v) => {
    const entry = items.find((i) => i.productId === v.id);
    return sum + (entry?.quantity || 0);
  }, 0);

  // For single-variant: direct add/qty controls
  const singleCartEntry = isSingleVariant
    ? items.find((i) => i.productId === representative.id)
    : null;
  const singleQty = singleCartEntry?.quantity || 0;

  const handleAddSingle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (outOfStock) return;
      addItem({
        productId: representative.id,
        name: representative.name,
        nameTe: representative.nameTe,
        price: representative.price,
        mrp: representative.mrp,
        quantity: 1,
        image: representative.images?.[0] || FALLBACK_IMAGE,
        weight: representative.weight,
        unit: representative.unit,
        stock: representative.stock,
        variantLabel: formatVariantLabel(representative),
      });
    },
    [addItem, outOfStock, representative]
  );

  const handleOpenModal = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setModalOpen(true);
    },
    []
  );

  return (
    <>
      {/* Card */}
      <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full relative">

        {/* Out of Stock Badge */}
        {outOfStock && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            Out of Stock
          </div>
        )}

        {/* Overlapping Add/Qty Controls */}
        {!outOfStock && (
          <div 
            className="absolute top-2.5 right-2.5 z-20"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {isSingleVariant ? (
              singleQty > 0 ? (
                /* Single variant quantity selector pill */
                <div className="flex items-center bg-amber-800 text-white rounded-xl h-8 px-1 shadow-md border border-amber-900 animate-fade-in">
                  <button
                    onClick={() =>
                      singleQty === 1
                        ? removeItem(representative.id)
                        : updateQuantity(representative.id, singleQty - 1)
                    }
                    className="w-6 h-6 flex items-center justify-center hover:bg-amber-700 rounded-lg transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="px-1.5 text-xs font-black min-w-[16px] text-center select-none">
                    {singleQty}
                  </span>
                  <button
                    onClick={() => {
                      if (singleQty < representative.stock)
                        updateQuantity(representative.id, singleQty + 1);
                    }}
                    className="w-6 h-6 flex items-center justify-center hover:bg-amber-700 rounded-lg transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                /* Single variant ADD plus button */
                <button
                  onClick={handleAddSingle}
                  className="w-8 h-8 rounded-xl bg-white border-2 border-amber-800 text-amber-800 shadow-sm flex items-center justify-center hover:bg-amber-50 hover:border-amber-955 hover:text-amber-955 transition-all active:scale-95"
                  aria-label="Add to cart"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )
            ) : (
              totalCartQty > 0 ? (
                /* Multi-variant added badge/button that opens size modal */
                <button
                  onClick={handleOpenModal}
                  className="flex items-center bg-amber-800 hover:bg-amber-700 text-white rounded-xl h-8 px-2.5 font-black text-xs shadow-md transition-colors"
                >
                  <span>{totalCartQty} Added</span>
                  <Plus size={10} strokeWidth={3} className="ml-1" />
                </button>
              ) : (
                /* Multi-variant ADD button */
                <button
                  onClick={handleOpenModal}
                  className="w-8 h-8 rounded-xl bg-white border-2 border-amber-800 text-amber-800 shadow-sm flex items-center justify-center hover:bg-amber-50 hover:border-amber-955 hover:text-amber-955 transition-all active:scale-95"
                  aria-label="Choose sizes"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )
            )}
          </div>
        )}

        {/* Image Box */}
        <Link
          href={`/products/${representative.slug}`}
          className="block relative w-full aspect-square bg-[#fcfaf7] border-b border-gray-100/60 overflow-hidden flex items-center justify-center p-2.5"
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white">
            <Image
              src={imageUrl}
              alt={representative.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={() => setImgError(true)}
            />
          </div>
        </Link>

        {/* Info Area */}
        <div className="p-3.5 flex flex-col flex-1 bg-white">
          
          {/* Delivery ETA Tag */}
          <p className="text-[10px] font-black text-amber-800/80 tracking-wider uppercase mb-1.5 flex items-center gap-0.5">
            ⚡ {language === 'te' ? '15 నిమిషాలు' : '15 MINS'}
          </p>

          {/* Product Name */}
          <Link href={`/products/${representative.slug}`}>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-amber-800 line-clamp-2 leading-snug transition-colors h-8 sm:h-9">
              {displayName}
            </h3>
          </Link>

          {/* Weight/Size selector dropdown chip */}
          <div className="mt-1.5">
            {!isSingleVariant ? (
              /* Clickable chip for multi-variant products */
              <div 
                onClick={handleOpenModal}
                className="flex items-center gap-1 bg-white border border-amber-100/80 hover:border-amber-600 rounded-lg px-2.5 py-1 text-[10px] font-extrabold text-amber-900 w-fit cursor-pointer transition-colors shadow-sm"
              >
                <span>{formatVariantLabel(representative)}</span>
                <ChevronDown size={11} className="text-amber-800 shrink-0" />
              </div>
            ) : (
              /* Non-clickable badge for single-variant products */
              <span className="text-[10px] font-bold text-amber-600 block py-0.5">
                {formatVariantLabel(representative)}
              </span>
            )}
          </div>

          {/* Discount & Price section */}
          <div className="mt-auto pt-2.5 flex flex-col">
            {discountPercent > 0 && !outOfStock && (
              <span className="text-[10px] font-black text-emerald-600 tracking-tight mb-0.5">
                {discountPercent}% OFF
              </span>
            )}
            
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-black text-gray-900">
                ₹{representative.price}
              </span>
              {representative.mrp > representative.price && (
                <span className="text-[10px] text-gray-400 line-through font-medium">
                  ₹{representative.mrp}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Variant Selector Modal (bottom sheet) */}
      {!isSingleVariant && (
        <VariantSelectorModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          groupKey={groupKey}
          variants={variants}
        />
      )}
    </>
  );
}
