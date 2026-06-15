'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { Search, MapPin, Package, Truck, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import PremiumLoader from '@/components/PremiumLoader';

function TrackOrderContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlOrderId = searchParams.get('orderId') || '';

  const [orderIdQuery, setOrderIdQuery] = useState(urlOrderId);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sseConnected, setSseConnected] = useState(false);

  // Status mapping
  const steps = [
    { key: 'PENDING', label: language === 'te' ? 'ఆర్డర్ నమోదు' : 'Order Placed', sub: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: language === 'te' ? 'నిర్ధారించబడింది' : 'Confirmed', sub: 'Confirmed', icon: CheckSquare },
    { key: 'PACKED', label: language === 'te' ? 'ప్యాక్ చేయబడింది' : 'Packed', sub: 'Packed', icon: Package },
    { key: 'SHIPPED', label: language === 'te' ? 'షిప్పింగ్ లో ఉంది' : 'Shipped', sub: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: language === 'te' ? 'డెలివరీ అయింది' : 'Delivered', sub: 'Delivered', icon: MapPin },
  ];

  const fetchOrder = (id: string) => {
    if (!id.trim()) return;

    setLoading(true);
    setError('');

    // Fetch order details by ID or Custom Order ID
    fetch(`/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('ఆర్డర్ కనుగొనబడలేదు. సరైన ID నమోదు చేయండి.');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tracking order:', err);
        setError(err.message || 'ఆర్డర్ ట్రాక్ చేయడంలో విఫలమైంది.');
        setOrder(null);
        setLoading(false);
      });
  };

  // Trigger search if query is in URL on load
  useEffect(() => {
    if (urlOrderId) {
      fetchOrder(urlOrderId);
    }
  }, [urlOrderId]);

  // Server Sent Events (SSE) listener for real-time status updates
  useEffect(() => {
    if (!order) return;

    // Connect to SSE stream
    const eventSource = new EventSource(`/api/orders/sse?orderId=${order.id}`);

    eventSource.onopen = () => {
      setSseConnected(true);
      console.log('SSE Tracking connection opened');
    };

    eventSource.addEventListener('order-update', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('SSE Tracking Event Received:', data);
      
      // Update order status in view
      setOrder((prev: any) => {
        if (prev && prev.id === data.orderId) {
          return {
            ...prev,
            orderStatus: data.status,
          };
        }
        return prev;
      });
    });

    eventSource.onerror = (err) => {
      console.error('SSE Tracking Connection Error:', err);
      setSseConnected(false);
      eventSource.close();
    };

    return () => {
      console.log('Closing SSE Tracking connection');
      eventSource.close();
      setSseConnected(false);
    };
  }, [order?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdQuery.trim()) {
      router.push(`/track-order?orderId=${orderIdQuery.trim()}`);
      fetchOrder(orderIdQuery.trim());
    }
  };

  // Find index of current status
  const currentStepIndex = order ? steps.findIndex((s) => s.key === order.orderStatus) : -1;
  const isCancelled = order ? order.orderStatus === 'CANCELLED' : false;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
      
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-xl sm:text-3xl font-extrabold text-amber-950 font-heading">
          {t('track_title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          {t('track_sub')}
        </p>
      </div>

      {/* Tracker search bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-amber-100 p-4 rounded-3xl smooth-shadow flex gap-3 max-w-lg mx-auto">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('track_placeholder')}
            value={orderIdQuery}
            onChange={(e) => setOrderIdQuery(e.target.value)}
            className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-2xl py-3 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          />
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          type="submit"
          disabled={loading || !orderIdQuery.trim()}
          className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs px-6 rounded-2xl shadow-sm transition-all"
        >
          {loading ? (language === 'te' ? 'వెతుకుతోంది...' : 'Searching...') : t('track_btn')}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-bold text-center">
          {error}
        </div>
      )}

      {/* Tracking results */}
      {order && (
        <div className="mt-10 bg-white border border-amber-100 rounded-3xl p-6 sm:p-8 smooth-shadow space-y-8 animate-fade-in-up">
          
          {/* Header Summary */}
          <div className="flex justify-between items-start border-b border-amber-50 pb-4 text-xs font-bold text-amber-950">
            <div>
              <p className="text-gray-400">{language === 'te' ? 'ఆర్డర్ నెంబర్:' : 'Order Number:'}</p>
              <p className="font-mono text-sm sm:text-base text-amber-900 mt-0.5">{order.orderId}</p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-400">{language === 'te' ? 'లైవ్ అప్‌డేట్స్:' : 'Live Updates:'}</p>
              <span className={`inline-flex items-center space-x-1 mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                sseConnected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-green-600 animate-ping' : 'bg-amber-600'}`}></span>
                <span>{sseConnected ? (language === 'te' ? 'కనెక్ట్ అయింది (LIVE)' : 'Connected (LIVE)') : (language === 'te' ? 'కనెక్ట్ అవుతోంది...' : 'Connecting...')}</span>
              </span>
            </div>
          </div>

          {/* Cancellation indicator */}
          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-600 text-xs font-semibold">
              <AlertTriangle size={24} className="shrink-0" />
              <div>
                <p className="font-bold">{language === 'te' ? 'ఆర్డర్ రద్దు చేయబడింది (Order Cancelled)' : 'Order Cancelled'}</p>
                <p className="text-red-500 text-[10px] mt-0.5">{language === 'te' ? 'ఈ ఆర్డర్ రద్దు చేయబడింది. ఏవైనా సమస్యలు ఉంటే మమ్మల్ని సంప్రదించండి.' : 'This order has been cancelled. Contact support for any queries.'}</p>
              </div>
            </div>
          ) : (
            /* Standard timeline steps */
            <div className="relative pl-6 border-l border-amber-200 space-y-8 py-2">
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const IconComponent = step.icon;

                return (
                  <div key={step.key} className="relative flex items-start space-x-4">
                    
                    {/* Circle dot identifier */}
                    <div className={`absolute -left-[35px] top-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-amber-800 border-amber-800 text-white'
                        : 'bg-white border-amber-200 text-gray-300'
                    }`}>
                      {isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </div>

                    <div className={`p-2 rounded-xl shrink-0 border ${
                      isCompleted
                        ? isCurrent
                          ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                          : 'bg-amber-50 border-amber-100 text-amber-800'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}>
                      <IconComponent size={18} />
                    </div>

                    <div className="space-y-0.5">
                      <p className={`text-xs font-black ${isCompleted ? 'text-amber-950' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">{step.sub}</p>
                      {isCurrent && (
                        <span className="inline-block mt-1 text-[9px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {language === 'te' ? 'ప్రస్తుత స్థితి' : 'Current State'}
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Simple delivery note */}
          <div className="border-t border-amber-50 pt-4 text-[10px] text-gray-400 font-semibold text-center leading-relaxed">
            {language === 'te'
              ? 'డెలివరీ స్థితిగతులు సమయానుకూలంగా అప్‌డేట్ చేయబడును. సహాయం కొరకు ఫోన్/వాట్సాప్ ద్వారా మమ్మల్ని సంప్రదించండి.'
              : 'Delivery updates are made periodically. Contact us via Phone/WhatsApp for support.'
            }
          </div>

        </div>
      )}

    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PremiumLoader fullScreen={false} />}>
        <TrackOrderContent />
      </Suspense>
      <Footer />
    </>
  );
}
