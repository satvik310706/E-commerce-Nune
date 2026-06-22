/**
 * useGroupedProducts
 * ------------------
 * Groups a flat list of products by their "base name" (stripping weight/size suffixes).
 *
 * Strategy:
 *  - Products named "Sunflower Oil (1L)", "Sunflower Oil (5L)" → group key "Sunflower Oil"
 *  - Products named "Groundnut Oil 1 Litre" → group key "Groundnut Oil"
 *  - Products with unique names → single-variant group
 *
 * Returns an array of GroupedProduct, each containing:
 *  - representative: the variant with the lowest price (shown on card)
 *  - variants: all variants in this group (sorted by weight asc)
 *  - minPrice: lowest price across variants
 *  - maxPrice: highest price across variants
 *  - totalCartQty: sum of cart quantities across all variants (for badge display)
 */

export interface RawProduct {
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
  category?: { id: string; name: string; slug: string };
  [key: string]: any;
}

export interface GroupedProduct {
  groupKey: string;
  representative: RawProduct;
  variants: RawProduct[];
  minPrice: number;
  maxPrice: number;
  minMrp: number;
}

/**
 * Extracts a "base name" from a product name by removing common size/weight suffixes.
 * Examples:
 *   "Sunflower Oil (1L)"     → "Sunflower Oil"
 *   "Cold Pressed Groundnut Oil 1 Litre" → "Cold Pressed Groundnut Oil"
 *   "Sesame Oil 500ml"       → "Sesame Oil"
 *   "Badam Oil 250g"         → "Badam Oil"
 */
export function extractBaseName(name: string): string {
  return name
    // Remove parenthetical size/weight: (1L), (500ml), (5 Kg), (250g), (1 Litre)
    .replace(/\s*\([^)]*(?:L|ml|g|kg|litre|liter|gram|pack|piece|pcs)[^)]*\)/gi, '')
    // Remove trailing size tokens like "1L", "500ml", "5 Litre", "250 Gram", "1Kg"
    .replace(/\s+\d+\.?\d*\s*(?:Litre|Liter|L|ml|Kg|kg|g|Gram|Pack|Piece|pcs)\b/gi, '')
    // Remove trailing numbers that could be sizes like "5" left after above
    .replace(/\s+\d+$/, '')
    .trim();
}

export function useGroupedProducts(products: RawProduct[]): GroupedProduct[] {
  if (!products || products.length === 0) return [];

  const groupMap = new Map<string, RawProduct[]>();

  for (const product of products) {
    const key = extractBaseName(product.name);
    const existing = groupMap.get(key) || [];
    groupMap.set(key, [...existing, product]);
  }

  const groups: GroupedProduct[] = [];

  groupMap.forEach((variants, groupKey) => {
    // Sort variants by weight ascending so smallest size is first
    const sorted = [...variants].sort((a, b) => a.weight - b.weight);

    const minPrice = Math.min(...sorted.map((v) => v.price));
    const maxPrice = Math.max(...sorted.map((v) => v.price));
    const minMrp = Math.min(...sorted.map((v) => v.mrp));

    // Representative = lowest price variant (first after sort)
    const representative = sorted.find((v) => v.price === minPrice) || sorted[0];

    groups.push({
      groupKey,
      representative,
      variants: sorted,
      minPrice,
      maxPrice,
      minMrp,
    });
  });

  return groups;
}
