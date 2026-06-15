'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { User, MapPin, Package, LogOut, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle, ClipboardList, Info } from 'lucide-react';
import PremiumLoader from '@/components/PremiumLoader';
import CustomSelect from '@/components/CustomSelect';

function AccountContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  // Navigation tab from URL or default
  const defaultTab = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Address form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Telangana',
    pincode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    isDefault: false,
  });
  const [formError, setFormError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Expandable order items state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Redirect if unauthenticated or admin
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?redirect=/account');
    } else if (authStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [authStatus, session, router]);

  // Sync tab with URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Load Orders
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    setLoadingOrders(true);

    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error('Error fetching user orders:', err);
        setLoadingOrders(false);
      });
  }, [authStatus]);

  // Load Addresses
  const fetchAddresses = () => {
    if (authStatus !== 'authenticated') return;
    setLoadingAddresses(true);

    fetch('/api/addresses')
      .then((res) => res.json())
      .then((data) => {
        setAddresses(data);
        setLoadingAddresses(false);
      })
      .catch((err) => {
        console.error('Error loading addresses:', err);
        setLoadingAddresses(false);
      });
  };

  useEffect(() => {
    fetchAddresses();
  }, [authStatus]);

  // Handle address input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Get User's Live Geolocation Coordinates
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingLocation(true);
    setLocationStatus("📍 Fetching location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        try {
          // Attempt reverse geocoding with OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            // Auto fill fields if found
            const line1Val = addr.road || addr.suburb || addr.neighbourhood || '';
            const line2Val = addr.suburb || addr.county || addr.state_district || '';
            const cityVal = addr.city || addr.town || addr.village || addr.city_district || '';
            const stateVal = addr.state === 'Andhra Pradesh' ? 'Andhra Pradesh' : 'Telangana';
            const pincodeVal = addr.postcode || '';

            setFormData(prev => ({
              ...prev,
              line1: prev.line1 || line1Val,
              line2: prev.line2 || `${line2Val} (Coords: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              city: prev.city || cityVal,
              state: stateVal,
              pincode: prev.pincode || pincodeVal,
            }));
            setLocationStatus('📍 Live location captured and address autofilled!');
          } else {
            setFormData(prev => ({
              ...prev,
              line2: prev.line2 || `Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            }));
            setLocationStatus('📍 Location coordinates captured!');
          }
        } catch (err) {
          setFormData(prev => ({
            ...prev,
            line2: prev.line2 || `Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
          setLocationStatus('📍 Location coordinates captured!');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        setLocationStatus('❌ Could not retrieve location. Please fill manually.');
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Create address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSavingAddress(true);

    const { name, phone, line1, city, state, pincode } = formData;
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      setFormError('దయచేసి అన్ని వివరాలు నింపండి.');
      setSavingAddress(false);
      return;
    }

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAddresses();
        setShowForm(false);
        setFormData({
          name: '',
          phone: '',
          line1: '',
          line2: '',
          city: '',
          state: 'Telangana',
          pincode: '',
          latitude: null,
          longitude: null,
          isDefault: false,
        });
      } else {
        const err = await res.json();
        setFormError(err.error || 'చిరునామాను సృష్టించలేకపోయాము.');
      }
    } catch (err) {
      setFormError('కనెక్షన్ లోపం.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('ఈ చిరునామాను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?')) return;

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  // Set address as default
  const handleSetDefaultAddress = async (id: string) => {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;

    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addr, isDefault: true }),
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  // Expand / collapse order items card
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (authStatus === 'loading') {
    return <PremiumLoader fullScreen={true} text={t('account_loading')} />;
  }

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      
      {/* Account Greeting Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 smooth-shadow mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            {t('account_greeting')}
          </h2>
          <h1 className="text-2xl sm:text-3xl font-black font-heading">{t('account_hello')} {session.user.name}</h1>
          <p className="text-xs text-amber-200">{session.user.email}</p>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5"
        >
          <LogOut size={14} />
          <span>{t('account_logout')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Navigation Sidebar Tabs */}
        <aside className="bg-white border border-amber-100 rounded-3xl p-4 smooth-shadow flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left text-xs font-bold py-3 px-4 rounded-2xl flex items-center space-x-2.5 transition-colors ${
              activeTab === 'orders' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-amber-850 hover:bg-amber-50'
            }`}
          >
            <Package size={16} />
            <span>{t('account_my_orders')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left text-xs font-bold py-3 px-4 rounded-2xl flex items-center space-x-2.5 transition-colors ${
              activeTab === 'addresses' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-amber-850 hover:bg-amber-50'
            }`}
          >
            <MapPin size={16} />
            <span>{t('account_my_addresses')}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left text-xs font-bold py-3 px-4 rounded-2xl flex items-center space-x-2.5 transition-colors ${
              activeTab === 'profile' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-amber-850 hover:bg-amber-50'
            }`}
          >
            <User size={16} />
            <span>{t('account_my_profile')}</span>
          </button>
        </aside>

        {/* Dynamic Detail Card Content */}
        <section className="lg:col-span-3">
          
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-950 font-heading mb-4 flex items-center space-x-1.5">
                <ClipboardList size={18} className="text-amber-700" />
                <span>{t('account_order_history')}</span>
              </h3>

              {loadingOrders ? (
                <div className="bg-white border border-amber-100 rounded-3xl p-12 smooth-shadow">
                  <PremiumLoader fullScreen={false} text={t('misc_loading')} />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-100 rounded-3xl p-12 text-center text-xs text-gray-500 space-y-4 smooth-shadow">
                  <p>{t('account_no_orders')}</p>
                  <button
                    onClick={() => router.push('/products')}
                    className="bg-amber-800 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-sm hover:shadow"
                  >
                    {t('account_browse_products')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    const date = new Date(ord.createdAt).toLocaleDateString('te-IN');
                    
                    return (
                      <div
                        key={ord.id}
                        className="bg-white border border-amber-100 rounded-3xl overflow-hidden smooth-shadow"
                      >
                        {/* Order Header Summary Row */}
                        <div
                          onClick={() => toggleOrderExpand(ord.id)}
                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-amber-50/20 transition-colors"
                        >
                          <div className="space-y-1 text-xs">
                            <p className="font-extrabold text-amber-950 flex items-center space-x-1.5">
                              <span className="font-mono text-sm sm:text-base text-amber-800">{ord.orderId}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                ord.orderStatus === 'DELIVERED'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : ord.orderStatus === 'CANCELLED'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-850 border-amber-200'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </p>
                            <p className="text-gray-400 font-semibold">{t('admin_date')}: {date} • {t('admin_total')}: <span className="font-extrabold text-amber-950">₹{ord.total}</span></p>
                          </div>
                          
                          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/track-order?orderId=${ord.id}`);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 text-[10px] font-extrabold px-4 py-1.5 rounded-lg shadow-sm"
                            >
                              {t('account_track')}
                            </button>
                            
                            <div className="text-amber-800">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>

                        {/* Order Detailed Items Panel */}
                        {isExpanded && (
                          <div className="bg-amber-50/25 border-t border-amber-50 p-5 space-y-4 text-xs font-semibold animate-fade-in-up">
                            
                            {/* Items list */}
                            <div className="space-y-3">
                              <p className="text-amber-950 font-black">{t('admin_items_list')}</p>
                              {ord.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-amber-950 font-bold text-xs">
                                  <div className="flex items-center space-x-2">
                                    <img
                                      src={item.image}
                                      alt=""
                                      className="w-8 h-8 rounded-lg object-cover border border-amber-50"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=100&auto=format&fit=crop';
                                      }}
                                    />
                                    <span>{item.nameTe} ({item.quantity} x ₹{item.price})</span>
                                  </div>
                                  <span>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            {/* Address details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-amber-50 pt-3">
                              <div>
                                <p className="text-gray-400 font-bold">{t('admin_delivery_address')}</p>
                                <div className="text-amber-950 pl-1 mt-1 font-semibold leading-relaxed">
                                  <p className="font-extrabold">{ord.name}</p>
                                  <p>{ord.line1}</p>
                                  {ord.line2 && <p>{ord.line2}</p>}
                                  <p>{ord.city}, {ord.state} - {ord.pincode}</p>
                                  <p>{t('checkout_phone')}: {ord.phone}</p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-gray-400 font-bold">{t('account_payment_details')}</p>
                                <p className="pl-1 text-amber-950">{t('account_payment_method')}: <span className="font-bold">{ord.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'PhonePe Online'}</span></p>
                                <p className="pl-1 text-amber-950">{t('account_payment_status')}: <span className="font-bold">{ord.paymentStatus}</span></p>
                                {ord.notes && <p className="pl-1 text-gray-500 font-medium italic mt-2">{language === 'te' ? 'గమనిక:' : 'Note:'} &quot;{ord.notes}&quot;</p>}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-950 font-heading flex items-center space-x-1.5">
                  <MapPin size={18} className="text-amber-700" />
                  <span>{t('account_saved_addresses')}</span>
                </h3>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1 shadow-sm"
                >
                  <Plus size={14} />
                  <span>{t('account_new_address')}</span>
                </button>
              </div>

              {/* Add address form overlay */}
              {showForm && (
                <form onSubmit={handleSaveAddress} className="bg-white border border-amber-100 p-5 rounded-3xl smooth-shadow grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
                  <h4 className="col-span-1 sm:col-span-2 text-xs font-bold text-amber-950">{t('checkout_new_address')}</h4>
                  
                  <div className="col-span-1 sm:col-span-2 pb-2">
                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      disabled={fetchingLocation}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-950 font-bold text-xs rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50"
                    >
                      <span>{fetchingLocation ? t('checkout_fetching_location') : t('checkout_live_location')}</span>
                    </button>
                    {locationStatus && (
                      <p className="text-[10px] font-bold text-center mt-1.5 text-amber-850">
                        {locationStatus}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_name')}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_phone')}</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_line1')}</label>
                    <input
                      type="text"
                      name="line1"
                      value={formData.line1}
                      onChange={handleInputChange}
                      placeholder="e.g. Flat No, Street Address"
                      className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_line2')}</label>
                    <input
                      type="text"
                      name="line2"
                      value={formData.line2}
                      onChange={handleInputChange}
                      placeholder="e.g. Area, Landmark (Optional)"
                      className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_city')}</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Hyderabad"
                      className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_state')}</label>
                    <CustomSelect
                      value={formData.state}
                      onChange={(val) => setFormData({ ...formData, state: val })}
                      options={[
                        { value: 'Telangana', label: t('checkout_state_telangana') },
                        { value: 'Andhra Pradesh', label: t('checkout_state_ap') },
                      ]}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{t('checkout_pincode')}</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 500072"
                      className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="accent-amber-850"
                    />
                    <label htmlFor="isDefault" className="text-[10px] font-bold text-amber-900 cursor-pointer">
                      {t('checkout_default')}
                    </label>
                  </div>

                  {formError && (
                    <div className="col-span-1 sm:col-span-2 text-xs text-red-600 font-bold">
                      {formError}
                    </div>
                  )}

                  <div className="col-span-1 sm:col-span-2 flex space-x-4 pt-2">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="flex-1 bg-amber-800 text-white py-2 font-bold text-xs rounded-xl shadow-sm"
                    >
                      {savingAddress ? t('checkout_saving') : t('checkout_save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-white text-amber-900 border border-amber-200 py-2 font-bold text-xs rounded-xl"
                    >
                      {t('checkout_cancel')}
                    </button>
                  </div>
                </form>
              )}
              {/* Saved Addresses list */}
              {loadingAddresses ? (
                <div className="bg-white border border-amber-100 rounded-3xl p-12 smooth-shadow">
                  <PremiumLoader fullScreen={false} text={t('checkout_loading_addresses')} />
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-amber-100 rounded-3xl p-12 text-center text-xs text-gray-500 smooth-shadow">
                  {t('account_no_addresses')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-amber-100 rounded-3xl p-5 smooth-shadow flex flex-col justify-between"
                    >
                      <div className="space-y-1.5 text-xs font-medium text-gray-650 leading-relaxed">
                        <div className="flex justify-between items-center border-b border-amber-50 pb-2">
                          <span className="font-extrabold text-amber-950 text-sm">{addr.name}</span>
                          <span className="text-gray-400 font-bold">{addr.phone}</span>
                        </div>
                        <p className="pt-2">{addr.line1}</p>
                        {addr.line2 && <p>{addr.line2}</p>}
                        <p>{addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span></p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-amber-50 flex items-center justify-between">
                        {addr.isDefault ? (
                          <span className="bg-green-100 border border-green-200 text-green-800 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">
                            {t('account_default_address')}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[10px] text-amber-800 font-bold hover:underline"
                          >
                            {t('account_set_default')}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-amber-100 rounded-3xl p-6 sm:p-8 smooth-shadow space-y-6">
              <h3 className="text-lg font-bold text-amber-950 font-heading border-b border-amber-50 pb-3 flex items-center space-x-1.5">
                <Info size={18} className="text-amber-700" />
                <span>{t('account_profile_details')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-amber-950">
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold block">{t('account_full_name')}</span>
                  <p className="bg-amber-50/30 p-2.5 rounded-xl border border-amber-100">{session.user.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold block">{t('account_email')}</span>
                  <p className="bg-amber-50/30 p-2.5 rounded-xl border border-amber-100">{session.user.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold block">{t('account_phone')}</span>
                  <p className="bg-amber-50/30 p-2.5 rounded-xl border border-amber-100">{session.user.phone || (language === 'te' ? 'అందుబాటులో లేదు' : 'Not Available')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold block">{t('account_account_type')}</span>
                  <p className="bg-amber-50/30 p-2.5 rounded-xl border border-amber-100 uppercase tracking-wider">{session.user.role}</p>
                </div>
              </div>
            </div>
          )}

        </section>

      </div>

    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PremiumLoader fullScreen={false} />}>
        <AccountContent />
      </Suspense>
      <Footer />
    </>
  );
}
