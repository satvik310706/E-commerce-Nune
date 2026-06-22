'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';
import { useGroupedProducts } from '@/hooks/useGroupedProducts';
import { Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import PremiumLoader from '@/components/PremiumLoader';
import CustomSelect from '@/components/CustomSelect';


// Groups flat product list into variant groups then renders ProductCards
function GroupedProductGrid({ products }: { products: any[] }) {
  const grouped = useGroupedProducts(products);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in-up">
      {grouped.map((grp) => (
        <ProductCard key={grp.groupKey} group={grp} />
      ))}
    </div>
  );
}

// Wrapper to handle Suspense boundary for useSearchParams
function ProductListingContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search parameters
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort States
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(600);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state with url query parameters
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Load Categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error loading categories:', err));
  }, []);

  // Load Products with filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    if (minPrice) params.append('minPrice', minPrice.toString());
    if (maxPrice) params.append('maxPrice', maxPrice.toString());

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading products:', err);
        setLoading(false);
      });
  }, [category, search, sort, minPrice, maxPrice]);

  const clearFilters = () => {
    setCategory('');
    setSearch('');
    setSort('newest');
    setMinPrice(0);
    setMaxPrice(600);
    router.push('/products');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      
      {/* Search Header Info */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold text-amber-950 font-heading animate-fade-in">
          {category
            ? (language === 'te' 
                ? categories.find((c) => c.slug === category)?.nameTe 
                : categories.find((c) => c.slug === category)?.name) || t('products_title')
            : t('products_title')}
        </h1>
        {search && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('products_search_results')}: <span className="font-bold text-amber-900">&quot;{search}&quot;</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block bg-white border border-amber-100 rounded-2xl p-5 smooth-shadow space-y-6">
          <div className="flex justify-between items-center border-b border-amber-100 pb-3">
            <h3 className="font-bold text-sm text-amber-950 flex items-center space-x-1.5">
              <Filter size={16} />
              <span>{t('products_filters')}</span>
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline"
            >
              {t('products_reset')}
            </button>
          </div>

          {/* Search Sub-Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-950 block">{t('products_search_keyword')}</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('products_search_placeholder')}
                className="w-full bg-amber-50/20 text-xs text-amber-900 border border-amber-100 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-gray-600">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category List Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-950 block">{t('products_category')}</label>
            <div className="space-y-1.5">
              <button
                onClick={() => setCategory('')}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  category === '' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-gray-600 hover:bg-amber-50'
                }`}
              >
                {t('products_all_categories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    category === cat.slug ? 'bg-amber-100 text-amber-900 font-bold' : 'text-gray-600 hover:bg-amber-50'
                  }`}
                >
                  {language === 'te' ? cat.nameTe : cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-amber-950 block">{t('products_price_range')}</label>
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="600"
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-amber-700 cursor-pointer h-1 bg-amber-100 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                <span>₹0</span>
                <span>{t('products_max_price').replace('{price}', maxPrice.toString())}</span>
              </div>
            </div>
          </div>

          {/* Sort Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-950 block">{t('products_sort_by')}</label>
            <CustomSelect
              value={sort}
              onChange={(val) => setSort(val)}
              options={[
                { value: 'newest', label: t('products_sort_newest') },
                { value: 'price-asc', label: t('products_sort_price_asc') },
                { value: 'price-desc', label: t('products_sort_price_desc') },
                { value: 'popular', label: t('products_sort_popular') },
              ]}
            />
          </div>

        </aside>

        {/* Products Grid & Results */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar for Mobile */}
          <div className="flex justify-between items-center bg-white border border-amber-100 rounded-2xl p-3 smooth-shadow lg:hidden">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="flex items-center space-x-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 focus:outline-none bg-amber-50 px-4 py-2 rounded-xl border border-amber-100"
            >
              <Filter size={14} />
              <span>{t('products_filters')}</span>
            </button>

            {/* Quick Sort dropdown */}
            <div className="flex items-center space-x-1">
              <ArrowUpDown size={14} className="text-amber-700" />
            <CustomSelect
              value={sort}
              onChange={(val) => setSort(val)}
              options={[
                { value: 'newest', label: t('products_sort_newest') },
                { value: 'price-asc', label: t('products_sort_price_asc') },
                { value: 'price-desc', label: t('products_sort_price_desc') },
              ]}
              className="w-36"
            />
            </div>
          </div>

          {/* Collapsible Mobile Filters Drawer */}
          {mobileFiltersOpen && (
            <div className="bg-white border border-amber-100 rounded-2xl p-4 space-y-4 smooth-shadow lg:hidden animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                <span className="text-xs font-bold text-amber-950">{t('products_filters')}</span>
                <button onClick={clearFilters} className="text-[10px] font-bold text-amber-600 underline">
                  {t('products_reset')}
                </button>
              </div>

              {/* Keyword Search */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 block">{t('products_search_keyword')}</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('products_search_placeholder')}
                  className="w-full bg-amber-50/20 text-xs text-amber-900 border border-amber-100 rounded-lg py-1.5 px-3 focus:outline-none"
                />
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 block">{t('products_category')}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCategory('')}
                    className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
                      category === '' ? 'bg-amber-805 text-white' : 'bg-amber-50 text-amber-900 border border-amber-100'
                    }`}
                  >
                    {t('products_all_categories')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.slug)}
                      className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
                        category === cat.slug ? 'bg-amber-800 text-white' : 'bg-amber-50 text-amber-900 border border-amber-100'
                      }`}
                    >
                      {language === 'te' ? cat.nameTe : cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price max range */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 block">{t('products_max_price').replace('{price}', maxPrice.toString())}</span>
                <input
                  type="range"
                  min="0"
                  max="600"
                  step="20"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-amber-700 h-1 bg-amber-100 rounded-lg cursor-pointer"
                />
              </div>

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-2 bg-amber-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow"
              >
                {language === 'te' ? 'ఫిల్టర్లు వర్తింపజేయి' : 'Apply Filters'}
              </button>
            </div>
          )}

          {/* Loader State */}
          {loading ? (
            <PremiumLoader fullScreen={false} text={t('misc_loading')} />
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white border border-amber-100 rounded-2xl p-6">
              <Search size={48} className="text-amber-400 stroke-1" />
              <h3 className="font-bold text-amber-950 text-sm sm:text-base">{t('products_not_found')}</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                {t('products_not_found_sub')}
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-full shadow-sm"
              >
                {t('products_reset')}
              </button>
            </div>
          ) : (
            /* Products Grid */
            <GroupedProductGrid products={products} />
          )}

        </section>

      </div>

    </div>
  );
}

export default function ProductListingPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PremiumLoader fullScreen={false} />}>
        <ProductListingContent />
      </Suspense>
      <Footer />
    </>
  );
}
