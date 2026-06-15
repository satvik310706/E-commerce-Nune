'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ChevronDown, ChevronUp, RefreshCw, Filter, Eye, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import PremiumLoader from '@/components/PremiumLoader';
import CustomSelect from '@/components/CustomSelect';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { t, language } = useLanguage();

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // UI states
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Auth Protection
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    } else if (authStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [authStatus, session]);

  // Load Orders
  const loadOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);

    fetch(`/api/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching admin orders:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadOrders();
    }
  }, [authStatus, statusFilter]);

  // Expand / collapse row
  const toggleOrderExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // Update Status Action
  const handleUpdateStatus = async (id: string, orderStatus: string, paymentStatus: string) => {
    setUpdatingOrderId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });

      if (res.ok) {
        // Reload list
        loadOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'స్థితి అప్‌డేట్ చేయడంలో లోపం జరిగింది.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (authStatus === 'loading' || loading) {
    return <PremiumLoader fullScreen={true} text={t('admin_orders_loading')} />;
  }

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <AdminSidebar />

          <section className="flex-1 w-full space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-extrabold text-amber-950 font-heading">
                  {t('admin_order_management')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('admin_order_sub')}</p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center space-x-2 bg-white border border-amber-100 px-4 py-2 rounded-2xl smooth-shadow shrink-0 text-xs">
                <Filter size={14} className="text-amber-850" />
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: '', label: t('admin_filter_all') },
                    { value: 'PENDING', label: language === 'te' ? 'పెండింగ్' : 'Pending' },
                    { value: 'CONFIRMED', label: language === 'te' ? 'నిర్ధారించబడింది' : 'Confirmed' },
                    { value: 'PACKED', label: language === 'te' ? 'ప్యాక్ చేయబడింది' : 'Packed' },
                    { value: 'SHIPPED', label: language === 'te' ? 'రవాణా లో ఉంది' : 'Shipped' },
                    { value: 'DELIVERED', label: language === 'te' ? 'డెలివరీ పూర్తయింది' : 'Delivered' },
                    { value: 'CANCELLED', label: language === 'te' ? 'రద్దు చేయబడింది' : 'Cancelled' },
                  ]}
                  className="w-36"
                />
              </div>
            </div>

            {/* Orders list table */}
            <div className="bg-white border border-amber-100 rounded-3xl overflow-hidden smooth-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-amber-950">
                  <thead className="bg-amber-50 text-[10px] uppercase font-bold text-amber-900 border-b border-amber-100">
                    <tr>
                      <th className="py-3 px-4">{t('admin_order_id')}</th>
                      <th className="py-3 px-4">{t('admin_date')}</th>
                      <th className="py-3 px-4">{t('admin_customer')}</th>
                      <th className="py-3 px-4 text-center">{t('admin_payment_method')}</th>
                      <th className="py-3 px-4 text-center">{t('admin_payment_status')}</th>
                      <th className="py-3 px-4 text-center">{t('admin_delivery_status')}</th>
                      <th className="py-3 px-4 text-right">{t('admin_total')}</th>
                      <th className="py-3 px-4 text-center">{t('admin_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {orders.map((ord) => {
                      const isExpanded = expandedOrderId === ord.id;
                      const date = new Date(ord.createdAt).toLocaleDateString(language === 'te' ? 'te-IN' : 'en-US');

                      return (
                        <React.Fragment key={ord.id}>
                          <tr className={`hover:bg-amber-50/10 ${isExpanded ? 'bg-amber-50/20' : ''}`}>
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-800">{ord.orderId}</td>
                            <td className="py-3.5 px-4 text-gray-500 font-bold">{date}</td>
                            <td className="py-3.5 px-4 font-extrabold">{ord.name}</td>
                            <td className="py-3.5 px-4 text-center font-bold">{ord.paymentMethod}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                                ord.paymentStatus === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                                {ord.paymentStatus === 'COMPLETED' 
                                  ? (language === 'te' ? 'చెల్లింపు పూర్తయింది' : 'COMPLETED') 
                                  : ord.paymentStatus === 'FAILED'
                                  ? (language === 'te' ? 'చెల్లింపు వైఫల్యం' : 'FAILED')
                                  : (language === 'te' ? 'చెల్లింపు పెండింగ్' : 'PENDING')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                                ord.orderStatus === 'DELIVERED'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : ord.orderStatus === 'CANCELLED'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {ord.orderStatus === 'DELIVERED'
                                  ? (language === 'te' ? 'డెలివరీ అయింది' : 'DELIVERED')
                                  : ord.orderStatus === 'CANCELLED'
                                  ? (language === 'te' ? 'రద్దు చేయబడింది' : 'CANCELLED')
                                  : ord.orderStatus === 'PACKED'
                                  ? (language === 'te' ? 'ప్యాక్ చేయబడింది' : 'PACKED')
                                  : ord.orderStatus === 'SHIPPED'
                                  ? (language === 'te' ? 'రవాణా లో ఉంది' : 'SHIPPED')
                                  : ord.orderStatus === 'CONFIRMED'
                                  ? (language === 'te' ? 'స్థిరపరచబడింది' : 'CONFIRMED')
                                  : (language === 'te' ? 'పెండింగ్' : 'PENDING')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-black">₹{ord.total}</td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleOrderExpand(ord.id)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-100 flex items-center justify-center space-x-1"
                              >
                                <Eye size={12} />
                                <span>{t('admin_view')}</span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </td>
                          </tr>

                          {/* Row Expansion */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="bg-amber-50/20 border-b border-amber-150 p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-semibold leading-relaxed">
                                  {/* Ordered items listing */}
                                  <div className="space-y-2">
                                    <p className="text-amber-950 font-black">{t('admin_items_list')}</p>
                                    <div className="space-y-1.5">
                                      {ord.items.map((it: any) => (
                                        <div key={it.id} className="flex justify-between border-b border-amber-50 pb-1 font-bold">
                                          <span>
                                            {language === 'te' ? it.nameTe : it.name} ({it.quantity} x ₹{it.price})
                                          </span>
                                          <span>₹{it.price * it.quantity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Address info */}
                                  <div>
                                    <p className="text-amber-950 font-black">{t('admin_delivery_address')}</p>
                                    <div className="pl-1 font-semibold text-gray-700 mt-1">
                                      <p className="font-extrabold text-amber-950">{ord.name}</p>
                                      <p>{ord.line1}</p>
                                      {ord.line2 && <p>{ord.line2}</p>}
                                      <p>{ord.city}, {ord.state} - {ord.pincode}</p>
                                      <p>{language === 'te' ? 'ఫోన్' : 'Phone'}: {ord.phone}</p>
                                      {ord.latitude && ord.longitude && (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${ord.latitude},${ord.longitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center space-x-1 mt-2 text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-250 px-2.5 py-1 rounded-xl shadow-xs transition-all"
                                        >
                                          <span>{t('admin_view_map')}</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions dropdown */}
                                  <div className="space-y-3">
                                    <p className="text-amber-950 font-black">{t('admin_update_controls')}</p>
                                    
                                    <div className="space-y-2">
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-500 block">{t('admin_order_status')}</span>
                                        <CustomSelect
                                          value={ord.orderStatus}
                                          disabled={updatingOrderId === ord.id}
                                          onChange={(val) => handleUpdateStatus(ord.id, val, ord.paymentStatus)}
                                          options={[
                                            { value: 'PENDING', label: language === 'te' ? 'పెండింగ్' : 'Pending' },
                                            { value: 'CONFIRMED', label: language === 'te' ? 'నిర్ధారించబడింది' : 'Confirmed' },
                                            { value: 'PACKED', label: language === 'te' ? 'ప్యాక్ చేయబడింది' : 'Packed' },
                                            { value: 'SHIPPED', label: language === 'te' ? 'రవాణా లో ఉంది' : 'Shipped' },
                                            { value: 'DELIVERED', label: language === 'te' ? 'డెలివరీ పూర్తయింది' : 'Delivered' },
                                            { value: 'CANCELLED', label: language === 'te' ? 'రద్దు చేయబడింది' : 'Cancelled' },
                                          ]}
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-500 block">{t('admin_pay_status')}</span>
                                        <CustomSelect
                                          value={ord.paymentStatus}
                                          disabled={updatingOrderId === ord.id}
                                          onChange={(val) => handleUpdateStatus(ord.id, ord.orderStatus, val)}
                                          options={[
                                            { value: 'PENDING', label: language === 'te' ? 'చెల్లింపు పెండింగ్' : 'Payment Pending' },
                                            { value: 'COMPLETED', label: language === 'te' ? 'చెల్లింపు పూర్తయింది' : 'Payment Completed' },
                                            { value: 'FAILED', label: language === 'te' ? 'చెల్లింపు వైఫల్యం' : 'Payment Failed' },
                                          ]}
                                        />
                                      </div>
                                    </div>

                                    {updatingOrderId === ord.id && (
                                      <p className="text-[10px] text-amber-800 font-bold flex items-center space-x-1 animate-pulse">
                                        <RefreshCw size={12} className="animate-spin" />
                                        <span>{t('admin_updating')}</span>
                                      </p>
                                    )}

                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
