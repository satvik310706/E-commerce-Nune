'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Plus, Edit3, Trash2, Search, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import PremiumLoader from '@/components/PremiumLoader';
import CustomSelect from '@/components/CustomSelect';

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { t, language } = useLanguage();

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameTe: '',
    slug: '',
    description: '',
    imageUrl: '', // for simplicity, one primary image input for URL in forms
    price: '',
    mrp: '',
    sku: '',
    stock: '',
    unit: 'Litre',
    weight: '',
    categoryId: '',
    benefitsInput: '', // comma separated strings in form
  });

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Auth Protection
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    } else if (authStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [authStatus, session]);

  // Load Products & Categories
  const loadData = () => {
    setLoading(true);
    // Fetch products
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching admin products:', err);
        setLoading(false);
      });

    // Fetch categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching admin categories:', err));
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadData();
    }
  }, [authStatus]);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Generate slug from name automatically if adding new product
    if (name === 'name' && !editingProduct) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      nameTe: '',
      slug: '',
      description: '',
      imageUrl: '',
      price: '',
      mrp: '',
      sku: '',
      stock: '',
      unit: 'Litre',
      weight: '',
      categoryId: categories[0]?.id || '',
      benefitsInput: '',
    });
    setFormError('');
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      nameTe: p.nameTe,
      slug: p.slug,
      description: p.description,
      imageUrl: p.images[0] || '',
      price: p.price.toString(),
      mrp: p.mrp.toString(),
      sku: p.sku,
      stock: p.stock.toString(),
      unit: p.unit,
      weight: p.weight.toString(),
      categoryId: p.categoryId,
      benefitsInput: p.benefits.join(', '),
    });
    setFormError('');
    setShowModal(true);
  };

  // Submit product creation/update
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const { name, slug, description, price, sku, stock, weight, categoryId } = formData;
    if (!name || !slug || !description || !price || !sku || !stock || !weight || !categoryId) {
      setFormError(language === 'te' ? 'దయచేసి అన్ని అవసరమైన వివరాలు నింపండి.' : 'Please fill in all required fields.');
      setSaving(false);
      return;
    }

    const payload = {
      ...formData,
      images: formData.imageUrl ? [formData.imageUrl] : [],
      benefits: formData.benefitsInput.split(',').map((s) => s.trim()).filter(Boolean),
      price: parseFloat(price),
      mrp: formData.mrp ? parseFloat(formData.mrp) : parseFloat(price),
      stock: parseInt(stock),
      weight: parseFloat(weight),
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        loadData();
        setShowModal(false);
      } else {
        const err = await res.json();
        setFormError(err.error || (language === 'te' ? 'ఉత్పత్తి సేవ్ చేయడంలో విఫలమైంది.' : 'Failed to save product.'));
      }
    } catch (err) {
      setFormError(language === 'te' ? 'సర్వర్ కనెక్షన్ లోపం.' : 'Server connection error.');
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm(language === 'te' ? 'ఈ ఉత్పత్తిని ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?' : 'Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || (language === 'te' ? 'తొలగించడం విఫలమైంది.' : 'Deletion failed.'));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nameTe.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (authStatus === 'loading' || loading) {
    return <PremiumLoader fullScreen={true} text={t('admin_products_loading')} />;
  }

  const getUnitLabel = (unit: string) => {
    switch (unit.toLowerCase()) {
      case 'litre': return t('misc_litre');
      case 'gram': return t('misc_gram');
      case 'kg': return t('misc_kg');
      case 'piece': return t('misc_piece');
      case 'pack': return t('misc_pack');
      default: return unit;
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <AdminSidebar />

          <section className="flex-1 w-full space-y-6">
            
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-extrabold text-amber-950 font-heading">
                  {t('admin_products_title')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('admin_products_sub')}</p>
              </div>

              <button
                onClick={handleOpenAdd}
                className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-5 py-3 rounded-full flex items-center justify-center space-x-1.5 shadow-sm hover:shadow"
              >
                <Plus size={16} />
                <span>{t('admin_products_add')}</span>
              </button>
            </div>

            {/* Search filter bar */}
            <div className="bg-white border border-amber-100 p-4 rounded-3xl smooth-shadow flex items-center relative">
              <input
                type="text"
                placeholder={t('admin_products_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-2xl py-2.5 pl-3 pr-10 focus:outline-none"
              />
              <Search size={18} className="absolute right-7 text-gray-400" />
            </div>

            {/* Products Data Table */}
            <div className="bg-white border border-amber-100 rounded-3xl overflow-hidden smooth-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-amber-950">
                  <thead className="bg-amber-50 text-[10px] uppercase font-bold text-amber-900 border-b border-amber-100">
                    <tr>
                      <th className="py-3 px-4">{t('admin_products_th_image')}</th>
                      <th className="py-3 px-4">{t('admin_products_th_name')}</th>
                      <th className="py-3 px-4">{t('admin_products_th_sku')}</th>
                      <th className="py-3 px-4">{t('admin_products_th_size')}</th>
                      <th className="py-3 px-4 text-center">{t('admin_products_th_stock')}</th>
                      <th className="py-3 px-4 text-right">{t('admin_products_th_price')}</th>
                      <th className="py-3 px-4 text-center">{t('admin_products_th_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50/10">
                        <td className="py-3 px-4 shrink-0">
                          <img
                            src={p.images[0] || '/images/placeholder.jpg'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-amber-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=100&auto=format&fit=crop';
                            }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-amber-950">
                            {language === 'te' ? p.nameTe : p.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold">{p.name}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-900">{p.sku}</td>
                        <td className="py-3 px-4 font-bold text-amber-600">{p.weight} {getUnitLabel(p.unit)}</td>
                        <td className={`py-3 px-4 text-center font-black ${p.stock < 10 ? 'text-red-650' : 'text-amber-950'}`}>
                          {p.stock}
                        </td>
                        <td className="py-3 px-4 text-right font-black">₹{p.price}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-100"
                              title={language === 'te' ? 'సవరించు' : 'Edit'}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100"
                              title={language === 'te' ? 'తొలగించు' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add/Edit Product Modal Form */}
            {showModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="w-full max-w-lg bg-white border border-amber-100 rounded-3xl smooth-shadow max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-fade-in-up">
                  <div className="flex justify-between items-center border-b border-amber-50 pb-3">
                    <h3 className="font-extrabold text-sm sm:text-base text-amber-950 font-heading">
                      {editingProduct ? t('admin_products_edit') : t('admin_products_add')}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_name_en')}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Groundnut Oil"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_name_te')}</label>
                      <input
                        type="text"
                        name="nameTe"
                        value={formData.nameTe}
                        onChange={handleInputChange}
                        placeholder="ఉదా: వేరుశనగ నూనె"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_slug')}</label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="e.g. groundnut-oil"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_sku')}</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        placeholder="e.g. OIL-GND-1L"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_desc')}</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder={language === 'te' ? 'ఉత్పత్తి పూర్తి వివరాలు...' : 'Product detailed description...'}
                        rows={3}
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_image')}</label>
                      <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="/images/products/example.jpg"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_category')}</label>
                      <CustomSelect
                        value={formData.categoryId}
                        onChange={(val) => setFormData({ ...formData, categoryId: val })}
                        options={categories.map((c) => ({
                          value: c.id,
                          label: language === 'te' ? c.nameTe : c.name
                        }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_price')}</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="280"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_mrp')}</label>
                      <input
                        type="number"
                        name="mrp"
                        value={formData.mrp}
                        onChange={handleInputChange}
                        placeholder="320"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_weight')}</label>
                      <input
                        type="number"
                        step="0.1"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="1.0"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_unit')}</label>
                      <CustomSelect
                        value={formData.unit}
                        onChange={(val) => setFormData({ ...formData, unit: val })}
                        options={[
                          { value: 'Litre', label: language === 'te' ? 'లీటర్' : 'Litre' },
                          { value: 'Gram', label: language === 'te' ? 'గ్రామ్స్' : 'Gram' },
                          { value: 'Kg', label: language === 'te' ? 'కిలోగ్రామ్' : 'Kg' },
                          { value: 'Piece', label: language === 'te' ? 'పీస్' : 'Piece' },
                          { value: 'Pack', label: language === 'te' ? 'ప్యాక్' : 'Pack' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_stock')}</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="50"
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">{t('admin_products_form_benefits')}</label>
                      <input
                        type="text"
                        name="benefitsInput"
                        value={formData.benefitsInput}
                        onChange={handleInputChange}
                        placeholder={language === 'te' ? 'ఉదా: 100% ప్యూర్, గానుగ పద్ధతి, విటమిన్ E కలదు' : 'e.g. 100% Pure, Wood Pressed, Contains Vitamin E'}
                        className="w-full bg-amber-50/15 border border-amber-100 rounded-lg p-2.5 focus:outline-none"
                      />
                    </div>

                    {formError && (
                      <div className="col-span-1 sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-650 font-bold flex items-center space-x-1">
                        <AlertCircle size={14} />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="col-span-1 sm:col-span-2 flex space-x-3 pt-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-amber-800 text-white py-3 rounded-full font-bold shadow-sm cursor-pointer"
                      >
                        {saving ? t('admin_updating') : t('admin_products_form_save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 bg-white border border-amber-200 text-amber-950 py-3 rounded-full font-bold cursor-pointer"
                      >
                        {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
