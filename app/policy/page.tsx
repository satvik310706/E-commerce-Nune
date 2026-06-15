'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';
import PremiumLoader from '@/components/PremiumLoader';

function PolicyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get('tab') || 'shipping';
  const [activeTab, setActiveTab] = useState<string>(tab);

  useEffect(() => {
    const activeTabParam = searchParams.get('tab');
    if (activeTabParam) setActiveTab(activeTabParam);
  }, [searchParams]);

  const selectTab = (tabName: string) => {
    setActiveTab(tabName);
    router.push(`/policy?tab=${tabName}`);
  };

  const tabClass = (tabName: string) => {
    const base = 'pb-3.5 border-b-2 text-xs sm:text-sm font-bold transition-colors duration-250 ';
    return activeTab === tabName
      ? base + 'border-amber-700 text-amber-950 font-extrabold'
      : base + 'border-transparent text-gray-400 hover:text-amber-800';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
      
      {/* Tabs Header */}
      <div className="flex border-b border-amber-50 justify-between sm:justify-start sm:space-x-8 mb-8 overflow-x-auto no-scrollbar">
        <button onClick={() => selectTab('shipping')} className={tabClass('shipping')}>
          షిప్పింగ్ పాలసీ (Shipping)
        </button>
        <button onClick={() => selectTab('returns')} className={tabClass('returns')}>
          రిటర్న్స్ & రీఫండ్ (Returns)
        </button>
        <button onClick={() => selectTab('privacy')} className={tabClass('privacy')}>
          ప్రైవసీ పాలసీ (Privacy)
        </button>
      </div>

      {/* Tab Content Cards */}
      <div className="bg-white border border-amber-100 rounded-3xl p-6 sm:p-8 smooth-shadow text-xs sm:text-sm leading-relaxed text-gray-650 font-medium">
        
        {/* SHIPPING POLICY */}
        {activeTab === 'shipping' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-2 border-b border-amber-50 pb-3">
              <Truck size={22} className="text-amber-800" />
              <h2 className="text-sm sm:text-base font-extrabold text-amber-950 font-heading">షిప్పింగ్ మరియు డెలివరీ పాలసీ</h2>
            </div>
            
            <p>మా వెబ్‌సైట్‌లో ఆర్డర్ చేసిన ప్రతి పార్సెల్ ను ఎంతో భద్రంగా ప్యాకింగ్ చేసి పంపుతాము. వంట నూనెలు లీకేజీ కాకుండా ప్రత్యేకమైన సీల్డ్ కంటైనర్ల ద్వారా ప్యాక్ చేయబడతాయి.</p>
            
            <div className="space-y-1 mt-4">
              <p className="font-extrabold text-amber-950">డెలివరీ సమయం (Delivery Timeline):</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>హైదరాబాద్, విజయవాడ, వైజాగ్ వంటి నగరాలకు: 24-48 గంటల్లో.</li>
                <li>ఆంధ్రప్రదేశ్ & తెలంగాణలోని ఇతర జిల్లాలకు: 2-3 రోజుల్లో.</li>
                <li>ఇతర రాష్ట్రాలకు: 5-7 పనిదినాల్లో.</li>
              </ul>
            </div>

            <div className="space-y-1 mt-4">
              <p className="font-extrabold text-amber-950">డెలివరీ చార్జీలు (Shipping Charges):</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>₹500 మరియు అంతకంటే ఎక్కువ కొనుగోలుపై డెలివరీ చార్జీలు పూర్తిగా ఉచితం (FREE Shipping).</li>
                <li>₹500 లోపు ఆర్డర్లకు ₹40 ఫ్లాట్ డెలివరీ చార్జీలు వర్తిస్తాయి.</li>
              </ul>
            </div>
          </div>
        )}

        {/* RETURNS & REFUND POLICY */}
        {activeTab === 'returns' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-2 border-b border-amber-50 pb-3">
              <RotateCcw size={22} className="text-amber-800" />
              <h2 className="text-sm sm:text-base font-extrabold text-amber-950 font-heading">రిటర్న్స్, క్యాన్సిలేషన్స్ మరియు రీఫండ్ పాలసీ</h2>
            </div>

            <p>కస్టమర్ల సంతృప్తి మాకు అత్యంత ప్రాధాన్యం. ఒకవేళ మీకు అందిన వస్తువులు దెబ్బతిన్నట్లు లేదా తప్పుగా ఉన్నట్లు గుర్తిస్తే కింద పేర్కొన్న నిబంధనల ప్రకారం మార్చుకోవచ్చు.</p>
            
            <div className="space-y-1 mt-4">
              <p className="font-extrabold text-amber-950">రిటర్న్ నిబంధనలు (Return Eligibility):</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>నూనె సీసాలు సీల్ ఓపెన్ చేయకుండా ఉండాలి.</li>
                <li>డెలివరీ అయిన 3 రోజుల్లోపు మా కస్టమర్ కేర్‌ను సంప్రదించాలి.</li>
                <li>డ్యామేజ్ అయిన పార్సెల్ యొక్క ఫోటో లేదా వీడియోను వాట్సాప్ (+91 99999 99999) కు పంపాలి.</li>
              </ul>
            </div>

            <div className="space-y-1 mt-4">
              <p className="font-extrabold text-amber-950">రీఫండ్ ప్రాసెస్ (Refund Timeline):</p>
              <p>రిటర్న్ ఆమోదించబడిన తర్వాత ఆన్‌లైన్ పేమెంట్లకు 3 నుండి 5 పనిదినాల్లో మీ ఒరిజినల్ పేమెంట్ అకౌంట్ కు డబ్బులు జమ చేయబడును. క్యాష్ ఆన్ డెలివరీ (COD) ఆర్డర్లకు మీ బ్యాంక్ లేదా UPI అకౌంట్ కు ట్రాన్స్ఫర్ చేస్తాము.</p>
            </div>
          </div>
        )}

        {/* PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-2 border-b border-amber-50 pb-3">
              <Lock size={22} className="text-amber-800" />
              <h2 className="text-sm sm:text-base font-extrabold text-amber-950 font-heading">ప్రైవసీ మరియు భద్రతా పాలసీ (Privacy Policy)</h2>
            </div>

            <p>మా వెబ్‌సైట్‌లో మీ వ్యక్తిగత సమాచారం (పేరు, ఫోన్ నెంబర్, అడ్రస్) పూర్తిగా భద్రంగా ఉంచబడుతుంది. దీనిని కేవలం మీ ఆర్డర్లను డెలివరీ చేయడానికి మాత్రమే ఉపయోగిస్తాము.</p>
            
            <div className="space-y-1 mt-4">
              <p className="font-extrabold text-amber-950">మేము సేకరించే సమాచారం (Data Collection):</p>
              <p>మీరు ఆర్డర్ చేసినప్పుడు ఇచ్చే పేరు, ఈమెయిల్, డెలివరీ అడ్రస్ మరియు ఫోన్ నంబర్ మాత్రమే సేకరిస్తాము. మేము ఎటువంటి క్రెడిట్/డెబిట్ కార్డు పిన్ నంబర్లు లేదా పాస్‌వర్డ్స్ సేకరించము.</p>
            </div>

            <div className="space-y-1 mt-4">
              <p className="font-extrabold text-amber-950">సురక్షిత లావాదేవీలు (Secure Payments):</p>
              <p>ఆన్‌లైన్ చెల్లింపుల కోసం మేము PhonePe యొక్క అధికారిక మరియు భద్రమైన గేట్‌వేను ఉపయోగిస్తాము. ప్రతి ట్రాన్సాక్షన్ పూర్తి సురక్షితమైన ఎన్‌క్రిప్షన్ సర్టిఫికేషన్స్ ద్వారా రక్షించబడుతుంది.</p>
            </div>
          </div>
        )}

      </div>
      
      {/* Support seal */}
      <div className="flex items-center justify-center space-x-1 mt-8 text-[11px] text-gray-400 font-semibold">
        <ShieldCheck size={16} className="text-amber-700" />
        <span>భారతీయ వినియోగదారుల రక్షణ చట్టాలకు లోబడి పనిచేస్తుంది</span>
      </div>

    </div>
  );
}

export default function PolicyPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PremiumLoader fullScreen={false} />}>
        <PolicyContent />
      </Suspense>
      <Footer />
    </>
  );
}
