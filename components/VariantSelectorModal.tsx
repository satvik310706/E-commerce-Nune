'use client';

import React, { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Percent, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';
import type { RawProduct } from '@/hooks/useGroupedProducts';

interface VariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupKey: string;
  variants: RawProduct[];
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=120&auto=format&fit=crop';

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

export default function VariantSelectorModal({
  isOpen,
  onClose,
  groupKey,
  variants,
}: VariantSelectorModalProps) {
  const { language } = useLanguage();
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Compute live item total from variants in cart
  const itemTotal = variants.reduce((sum, v) => {
    const cartEntry = items.find((i) => i.productId === v.id);
    return sum + (cartEntry ? cartEntry.quantity * v.price : 0);
  }, 0);

  const totalQty = variants.reduce((sum, v) => {
    const cartEntry = items.find((i) => i.productId === v.id);
    return sum + (cartEntry ? cartEntry.quantity : 0);
  }, 0);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleAdd = (variant: RawProduct) => {
    const variantLabel = formatVariantLabel(variant);
    addItem({
      productId: variant.id,
      name: variant.name,
      nameTe: variant.nameTe,
      price: variant.price,
      mrp: variant.mrp,
      quantity: 1,
      image: variant.images?.[0] || FALLBACK_IMAGE,
      weight: variant.weight,
      unit: variant.unit,
      stock: variant.stock,
      variantLabel,
    });
  };

  const handleConfirm = () => {
    onClose();
  };

  const displayName =
    language === 'te'
      ? variants[0]?.nameTe?.replace(/[\d.]+\s*(లీటరు|మి\.లీ|గ్రా|కేజీ|లీ)/gi, '').trim()
      : groupKey;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100]"
            onClick={handleBackdropClick}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex flex-col"
            style={{ maxHeight: '90dvh' }}
          >
            <div className="bg-white rounded-t-3xl overflow-hidden flex flex-col shadow-2xl"
              style={{ maxHeight: '90dvh' }}>

              {/* Drag Handle */}
              <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-black text-gray-900 leading-tight font-heading">
                    {displayName}
                  </h2>
                  <p className="text-xs text-amber-800 font-bold mt-0.5">
                    {variants.length} {variants.length === 1 ? 'size' : 'sizes'} available
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Variant List — scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-gray-50">
                {variants.map((variant) => {
                  const cartEntry = items.find((i) => i.productId === variant.id);
                  const qty = cartEntry?.quantity || 0;
                  const discount = Math.round(
                    ((variant.mrp - variant.price) / variant.mrp) * 100
                  );
                  const outOfStock = variant.stock <= 0;
                  const label = formatVariantLabel(variant);
                  const imgSrc = imgErrors[variant.id]
                    ? FALLBACK_IMAGE
                    : variant.images?.[0] || FALLBACK_IMAGE;

                  return (
                    <div
                      key={variant.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-amber-50 border border-amber-100">
                        <Image
                          src={imgSrc}
                          alt={variant.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          onError={() =>
                            setImgErrors((prev) => ({ ...prev, [variant.id]: true }))
                          }
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 leading-tight">
                          {label}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm font-black text-gray-900">
                            ₹{variant.price}
                          </span>
                          {variant.mrp > variant.price && (
                            <span className="text-xs text-gray-400 line-through font-medium">
                              ₹{variant.mrp}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                              <Percent size={8} />
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                        {outOfStock && (
                          <p className="text-[10px] font-bold text-red-500 mt-0.5">
                            Out of Stock
                          </p>
                        )}
                      </div>

                      {/* Add / Qty Control */}
                      <div className="flex-shrink-0">
                        {qty > 0 ? (
                          <div className="flex items-center bg-amber-800 rounded-xl overflow-hidden shadow-md">
                            <button
                              onClick={() =>
                                qty === 1
                                  ? removeItem(variant.id)
                                  : updateQuantity(variant.id, qty - 1)
                              }
                              className="w-8 h-9 flex items-center justify-center text-white hover:bg-amber-700 transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="px-2 text-white font-black text-sm min-w-[24px] text-center select-none">
                              {qty}
                            </span>
                            <button
                              onClick={() => {
                                if (qty < variant.stock) updateQuantity(variant.id, qty + 1);
                              }}
                              className="w-8 h-9 flex items-center justify-center text-white hover:bg-amber-700 transition-colors"
                              aria-label="Increase"
                            >
                              <Plus size={14} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => !outOfStock && handleAdd(variant)}
                            disabled={outOfStock}
                            className={`px-5 py-2 rounded-xl text-sm font-black transition-all duration-200 border-2 ${
                              outOfStock
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                : 'border-amber-800 text-amber-800 hover:bg-amber-900 hover:text-white active:scale-95'
                            }`}
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticky Footer — Item Total + Confirm */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3.5 pb-safe">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Item Total ({totalQty} item{totalQty === 1 ? '' : 's'})
                    </p>
                    <p className="text-lg font-black text-gray-900 leading-tight">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={handleConfirm}
                    className="bg-amber-800 hover:bg-amber-700 active:scale-95 text-white font-black px-8 py-3 rounded-2xl shadow-lg transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    Confirm
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
