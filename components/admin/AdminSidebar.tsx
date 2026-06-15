'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, ShoppingCart, FolderHeart, ShieldAlert, Award, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const linkClass = (path: string) => {
    const base = 'flex items-center space-x-3 py-3 px-4 rounded-xl text-xs font-bold transition-all ';
    return pathname === path
      ? base + 'bg-amber-800 text-white shadow-sm'
      : base + 'text-amber-900 hover:bg-amber-100/50';
  };

  return (
    <aside className="w-full lg:w-64 bg-white border border-amber-100 rounded-3xl p-4 sm:p-5 smooth-shadow lg:sticky lg:top-24 space-y-6">
      
      {/* Session User Widget */}
      <div className="flex items-center space-x-3 border-b border-amber-50 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center text-white font-black uppercase text-sm shadow-inner shrink-0">
          AD
        </div>
        <div className="text-xs truncate">
          <p className="font-extrabold text-amber-950 truncate">{session?.user?.name || 'Admin'}</p>
          <span className="inline-block px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-900 text-[9px] font-black rounded-md uppercase mt-0.5">
            {t('admin_sidebar_mode')}
          </span>
        </div>
      </div>

      {/* Main Nav links */}
      <nav className="flex flex-col space-y-1">
        <Link href="/admin/dashboard" className={linkClass('/admin/dashboard')}>
          <LayoutDashboard size={16} />
          <span>{t('admin_sidebar_dashboard')}</span>
        </Link>

        <Link href="/admin/products" className={linkClass('/admin/products')}>
          <ShoppingCart size={16} />
          <span>{t('admin_sidebar_products')}</span>
        </Link>

        <Link href="/admin/categories" className={linkClass('/admin/categories')}>
          <FolderHeart size={16} />
          <span>{t('admin_sidebar_categories')}</span>
        </Link>

        <Link href="/admin/orders" className={linkClass('/admin/orders')}>
          <ShieldAlert size={16} />
          <span>{t('admin_sidebar_orders')}</span>
        </Link>

        <Link href="/admin/coupons" className={linkClass('/admin/coupons')}>
          <Award size={16} />
          <span>{t('admin_sidebar_coupons')}</span>
        </Link>
      </nav>

      {/* Sidebar Utilities */}
      <div className="border-t border-amber-50 pt-4 space-y-1">
        <Link
          href="/"
          className="flex items-center space-x-3 py-2.5 px-4 rounded-xl text-xs text-amber-950 font-bold hover:bg-amber-50"
        >
          <ArrowLeft size={16} />
          <span>{t('admin_sidebar_exit')}</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center space-x-3 py-2.5 px-4 rounded-xl text-xs text-red-600 font-bold hover:bg-red-50 text-left"
        >
          <LogOut size={16} />
          <span>{t('admin_sidebar_logout')}</span>
        </button>
      </div>

    </aside>
  );
}
