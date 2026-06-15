'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User, Mail, Lock, Phone, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import PremiumLoader from '@/components/PremiumLoader';
import { useLanguage } from '@/context/LanguageContext';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { language } = useLanguage();

  const redirectUrl = searchParams.get('redirect') || '/';

  // Tabs state
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push(redirectUrl);
    }
  }, [authStatus, redirectUrl]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!email || !password) {
      setErrorMsg(
        language === 'te'
          ? 'దయచేసి ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.'
          : 'Please enter both your email and password.'
      );
      setLoading(false);
      return;
    }

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(
          language === 'te'
            ? 'లాగిన్ విఫలమైంది. ఈమెయిల్ లేదా పాస్‌వర్డ్ తప్పుగా ఉంది.'
            : 'Login failed. Incorrect email or password.'
        );
        setLoading(false);
      } else {
        setSuccessMsg(
          language === 'te'
            ? 'లాగిన్ విజయవంతమైంది! రీడైరెక్ట్ అవుతోంది...'
            : 'Login successful! Redirecting...'
        );
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setErrorMsg(
        language === 'te'
          ? 'ఏదో లోపం జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
          : 'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!name || !email || !password) {
      setErrorMsg(
        language === 'te'
          ? 'దయచేసి పేరు, ఈమెయిల్ మరియు పాస్‌వర్డ్ వివరాలు నింపండి.'
          : 'Please fill in all required fields (Name, Email, Password).'
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(
          language === 'te'
            ? 'నమోదు విజయవంతమైంది! స్వయంచాలకంగా లాగిన్ అవుతోంది...'
            : 'Registration successful! Logging in automatically...'
        );
        
        // Log in immediately
        const loginRes = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.ok) {
          setTimeout(() => {
            router.push(redirectUrl);
            router.refresh();
          }, 1500);
        } else {
          setActiveTab('login');
          setLoading(false);
        }
      } else {
        setErrorMsg(
          data.error ||
            (language === 'te' ? 'నమోదు చేయడంలో లోపం జరిగింది.' : 'Registration failed.')
        );
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg(
        language === 'te'
          ? 'సర్వర్ తో కనెక్ట్ కాలేకపోయాము.'
          : 'Unable to connect to the server.'
      );
      setLoading(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <PremiumLoader
        fullScreen={false}
        text={language === 'te' ? 'ధృవీకరించబడుతోంది...' : 'Verifying Session...'}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
      
      <div className="bg-white border border-amber-100 rounded-3xl smooth-shadow p-6 sm:p-8 space-y-6">
        
        {/* Toggle Headers */}
        <div className="flex border-b border-amber-50 text-center font-bold text-sm">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 pb-3.5 border-b-2 transition-colors duration-255 ${
              activeTab === 'login' ? 'border-amber-700 text-amber-950' : 'border-transparent text-gray-400'
            }`}
          >
            {language === 'te' ? 'లాగిన్' : 'Sign In'}
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 pb-3.5 border-b-2 transition-colors duration-255 ${
              activeTab === 'register' ? 'border-amber-700 text-amber-950' : 'border-transparent text-gray-400'
            }`}
          >
            {language === 'te' ? 'ఖాతా తెరవండి' : 'Register'}
          </button>
        </div>

        {/* Form Body */}
        {activeTab === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in-up">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                {language === 'te' ? 'ఈమెయిల్ చిరునామా' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                {language === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-800 hover:bg-amber-700 text-white font-extrabold text-xs rounded-full shadow hover:shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-amber-800" />
                  <span>{language === 'te' ? 'లాగిన్ అవుతోంది...' : 'Logging in...'}</span>
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>{language === 'te' ? 'లాగిన్' : 'Sign In'}</span>
                </>
              )}
            </button>

          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in-up">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                {language === 'te' ? 'పూర్తి పేరు' : 'Full Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'te' ? 'ఉదా: వెంకట్ సుబ్బారావు' : 'e.g. Venkat Subbarao'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                {language === 'te' ? 'ఈమెయిల్ చిరునామా' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                {language === 'te' ? 'ఫోన్ నెంబర్ (ఐచ్ఛికం)' : 'Mobile Number (Optional)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'te' ? 'ఉదా: 9876543210' : 'e.g. 9876543210'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                {language === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder={language === 'te' ? 'కనీసం 6 అక్షరాలు...' : 'Min 6 characters...'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-amber-50/10 text-xs border border-amber-100 rounded-xl py-3 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-800 hover:bg-amber-700 text-white font-extrabold text-xs rounded-full shadow hover:shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-amber-800" />
                  <span>{language === 'te' ? 'నమోదు చేయబడుతోంది...' : 'Registering...'}</span>
                </>
              ) : (
                <span>{language === 'te' ? 'ఖాతా సృష్టించు' : 'Register Account'}</span>
              )}
            </button>

          </form>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-[10px] sm:text-xs text-red-600 font-semibold flex items-start space-x-1.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-[10px] sm:text-xs text-green-700 font-semibold text-center">
            {successMsg}
          </div>
        )}

        {/* Quick demo notes */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3 text-[10px] text-amber-900 leading-snug font-medium">
          {language === 'te' ? (
            <>
              💡 <span className="font-extrabold">డెమో గమనిక:</span> సులభంగా టెస్టింగ్ చేయడానికి హోమ్ పేజీ లో కింద ఇవ్వబడిన డెమో అడ్మిన్ లేదా కస్టమర్ వివరాలతో డైరెక్ట్ గా లాగిన్ అవ్వవచ్చు.
            </>
          ) : (
            <>
              💡 <span className="font-extrabold">Demo Note:</span> For easy testing, you can log in directly using the demo admin or customer credentials provided at the bottom of the home page.
            </>
          )}
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PremiumLoader fullScreen={false} />}>
        <LoginContent />
      </Suspense>
      <Footer />
    </>
  );
}
