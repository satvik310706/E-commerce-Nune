'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useCartStore } from '@/store/cartStore';
import { 
  User, 
  MapPin, 
  Package, 
  LogOut, 
  Plus, 
  Trash2, 
  Info,
} from 'lucide-react';
import PremiumLoader from '@/components/PremiumLoader';
import CustomSelect from '@/components/CustomSelect';
import OrderHistorySection from '@/components/OrderHistorySection';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function AccountContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus, update: updateSession } = useSession();

  // Navigation tab from URL or default
  const defaultTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Profile edit states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileRole, setProfileRole] = useState('CUSTOMER');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Fetch profile details
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    setLoadingProfile(true);
    fetch('/api/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then((data) => {
        setProfileName(data.name || '');
        setProfileEmail(data.email || '');
        setProfilePhone(data.phone || '');
        setProfileRole(data.role || 'CUSTOMER');
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error('Error loading profile:', err);
        // Fallback to session values
        if (session?.user) {
          setProfileName(session.user.name || '');
          setProfileEmail(session.user.email || '');
          setProfilePhone(session.user.phone || '');
          setProfileRole(session.user.role || 'CUSTOMER');
        }
        setLoadingProfile(false);
      });
  }, [authStatus, session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');
    setUpdatingProfile(true);

    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileErrorMsg(language === 'te' ? 'దయచేసి పేరు మరియు ఈమెయిల్ నింపండి.' : 'Name and email are required.');
      setUpdatingProfile(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        if (updateSession) {
          await updateSession({
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
          });
        }
        setProfileSuccessMsg(
          language === 'te'
            ? 'ప్రొఫైల్ వివరాలు విజయవంతంగా నవీకరించబడ్డాయి!'
            : 'Profile details updated successfully!'
        );
        showToast(
          language === 'te'
            ? 'ప్రొఫైల్ నవీకరించబడింది!'
            : 'Profile updated successfully!',
          'success'
        );
      } else {
        const err = await res.json();
        setProfileErrorMsg(err.error || (language === 'te' ? 'నవీకరించడం విఫలమైంది.' : 'Update failed.'));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileErrorMsg(language === 'te' ? 'కనెక్షన్ లోపం.' : 'Connection error.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

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
        showToast(
          language === 'te' ? 'ఆర్డర్‌లను లోడ్ చేయడంలో విఫలమైంది.' : 'Failed to load orders.',
          'error'
        );
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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
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

  if (authStatus === 'loading') {
    return <PremiumLoader fullScreen={true} text={t('account_loading')} />;
  }

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 relative">
      
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
              activeTab === 'orders' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-amber-900 hover:bg-amber-50'
            }`}
          >
            <Package size={16} />
            <span>{t('account_my_orders')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left text-xs font-bold py-3 px-4 rounded-2xl flex items-center space-x-2.5 transition-colors ${
              activeTab === 'addresses' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-amber-900 hover:bg-amber-50'
            }`}
          >
            <MapPin size={16} />
            <span>{t('account_my_addresses')}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left text-xs font-bold py-3 px-4 rounded-2xl flex items-center space-x-2.5 transition-colors ${
              activeTab === 'profile' ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-amber-900 hover:bg-amber-50'
            }`}
          >
            <User size={16} />
            <span>{t('account_my_profile')}</span>
          </button>
        </aside>

        {/* Dynamic Detail Card Content */}
        <section className="lg:col-span-3">
          
          {/* TAB 1: ORDERS – new OrderHistorySection component */}
          {activeTab === 'orders' && (
            <OrderHistorySection
              orders={orders}
              loadingOrders={loadingOrders}
              language={language}
              t={t}
              onOrdersChange={setOrders}
            />
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
                      <p className="text-[10px] font-bold text-center mt-1.5 text-amber-900">
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
                      className="accent-amber-800"
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
                      <div className="space-y-1.5 text-xs font-medium text-gray-600 leading-relaxed">
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
              <h3 className="text-lg font-bold text-amber-950 font-heading border-b border-amber-50 pb-3 flex items-center space-x-2">
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-900 shrink-0">
                  <Info size={15} />
                </div>
                <span>{t('account_profile_details')}</span>
              </h3>

              {loadingProfile ? (
                <div className="py-6 flex justify-center">
                  <PremiumLoader fullScreen={false} text={language === 'te' ? 'ప్రొఫైల్ వివరాలు లోడ్ అవుతున్నాయి...' : 'Loading profile details...'} />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-xs font-semibold text-amber-950">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-gray-500 font-bold block">{language === 'te' ? 'పూర్తి పేరు:' : 'Full Name:'}</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-white border-2 border-[#8f4412] rounded-2xl py-3 px-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#8f4412]/10 transition-all text-xs"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-2">
                      <label className="text-gray-500 font-bold block">{language === 'te' ? 'ఈమెయిల్ చిరునామా:' : 'Email Address:'}</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-white border-2 border-[#8f4412] rounded-2xl py-3 px-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#8f4412]/10 transition-all text-xs"
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-2">
                      <label className="text-gray-500 font-bold block">{language === 'te' ? 'మొబైల్ ఫోన్:' : 'Mobile Phone:'}</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="e.g. 9999988888"
                        className="w-full bg-white border-2 border-[#8f4412] rounded-2xl py-3 px-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#8f4412]/10 transition-all text-xs"
                      />
                    </div>

                    {/* Account Type */}
                    <div className="space-y-2">
                      <label className="text-gray-500 font-bold block">{language === 'te' ? 'ఖాతా రకం:' : 'Account Type:'}</label>
                      <input
                        type="text"
                        value={profileRole}
                        readOnly
                        disabled
                        className="w-full bg-[#fdfbf7]/60 border border-[#8f4412]/40 rounded-2xl py-3 px-4 font-bold text-gray-900/60 cursor-not-allowed text-xs uppercase"
                      />
                    </div>
                  </div>

                  {profileSuccessMsg && (
                    <p className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                      {profileSuccessMsg}
                    </p>
                  )}

                  {profileErrorMsg && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                      {profileErrorMsg}
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="bg-amber-800 hover:bg-amber-700 active:scale-95 text-white font-black px-8 py-3 rounded-2xl shadow-lg transition-all duration-200 text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      {updatingProfile ? (language === 'te' ? 'నవీకరించబడుతోంది...' : 'Updating...') : (language === 'te' ? 'ప్రొఫైల్ అప్‌డేట్ చేయి' : 'Update Profile')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </section>
      </div>

      {/* Toast system */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-lg border text-xs font-bold pointer-events-auto animate-fade-in-up flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500 animate-ping' : toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            <span>{toast.message}</span>
          </div>
        ))}
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
