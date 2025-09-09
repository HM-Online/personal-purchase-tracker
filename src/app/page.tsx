'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseList from '@/components/PurchaseList';
import KpiCard from '@/components/KpiCard';
import type { Purchase } from '@/lib/types';
import type { Session } from '@supabase/supabase-js';

type DashboardStats = {
  in_transit_count: number;
  delivered_count: number;
  refunds_in_progress_count: number;
};

type StatusFilter = '' | 'in_transit' | 'delivered' | 'refunds_in_progress';

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(''); // KPI-driven list filter

  const fetchPurchases = useCallback(async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, shipments(*), refunds(*), claims(*)')
      .order('order_date', { ascending: false });
    if (error) console.error('Error fetching purchases:', error);
    else setPurchases(data as Purchase[]);
    setIsLoading(false);
  }, []);
  
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  }, []);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      if (purchases.length === 0) setIsLoading(true);
      fetchPurchases();
      fetchStats();
    } else {
      setIsLoading(false);
      setPurchases([]);
      setStats(null);
    }
  }, [session, fetchPurchases, fetchStats]);
  
  const handleDeletePurchase = async (purchaseId: string) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this purchase? This action cannot be undone.');
    if (isConfirmed) {
      const { error } = await supabase.from('purchases').delete().eq('id', purchaseId);
      if (error) {
        alert('Error deleting purchase: ' + error.message);
      } else {
        alert('Purchase deleted successfully.');
        fetchPurchases();
        fetchStats();
      }
    }
  };

  const handleNewPurchase = () => {
    fetchPurchases();
    fetchStats();
  };

  // ---- Robust status helpers (UI-only filtering) ----
  const getString = (v: unknown) => (v ?? '').toString().toLowerCase();

  const isDelivered = (p: Purchase) => {
    const shipments: any[] = Array.isArray((p as any)?.shipments) ? (p as any).shipments : [];
    return shipments.some((s) => getString(s?.status) === 'delivered');
  };

  const isInTransit = (p: Purchase) => {
    const shipments: any[] = Array.isArray((p as any)?.shipments) ? (p as any).shipments : [];
    if (shipments.length === 0) return false;
    return shipments.some((s) => getString(s?.status) !== 'delivered');
  };

  const isRefundInProgress = (p: Purchase) => {
    const refunds: any[] = Array.isArray((p as any)?.refunds) ? (p as any).refunds : [];
    if (refunds.length === 0) return false;

    const INPROG = new Set([
      'in progress','in-progress','progress','pending','processing','open','opened','under review','under-review',
      'awaiting','waiting','requested','submitted'
    ]);
    const DONE = new Set(['completed','complete','approved','resolved','refunded','paid','closed','denied','rejected','canceled','cancelled']);

    let anyInProgress = false;
    let anyDone = false;
    for (const r of refunds) {
      const raw = r?.status ?? r?.state ?? r?.refund_status ?? r?.current_status ?? r?.progress_status ?? '';
      const s = getString(raw);
      if (INPROG.has(s)) anyInProgress = true;
      if (DONE.has(s)) anyDone = true;
    }
    if (anyInProgress) return true;
    if (!anyDone) return true;
    return false;
  };

  const storeNames = [...new Set(purchases.map(p => p.store_name))].sort();

  const filteredPurchases = purchases
    .filter(p => (storeFilter ? p.store_name === storeFilter : true))
    .filter(p => {
      const term = searchTerm.toLowerCase();
      return p.store_name.toLowerCase().includes(term) || p.order_id.toLowerCase().includes(term);
    })
    .filter(p => {
      if (!statusFilter) return true;
      if (statusFilter === 'delivered') return isDelivered(p);
      if (statusFilter === 'in_transit') return isInTransit(p);
      if (statusFilter === 'refunds_in_progress') return isRefundInProgress(p);
      return true;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f680,transparent_60%),linear-gradient(180deg,#0b1020, #0a0f1a)]">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f640,transparent_60%),linear-gradient(180deg,#0b1020, #0a0f1a)]">
        <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">Purchase Tracker</h1>
          <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" />
        </div>
      </div>
    );
  }

  // ---- SVG icons (inline) ----
  const TruckIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h12v10H3z" />
      <path d="M15 10h4l2 3v4h-6z" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </svg>
  );
  const BoxIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7l9 4 9-4" />
      <path d="M21 7v10l-9 4-9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
  const RefundIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 4v8h8" />
      <path d="M12 6v6" />
    </svg>
  );

  return (
    <main
      className={[
        "w-full min-h-screen flex flex-col items-center",
        "bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f6AA,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]",
      ].join(" ")}
    >
      {/* Sticky top bar (glass) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-3 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Personal Purchase Tracker
          </h1>
          <div className="flex items-center space-x-3">
            <Link
              href="/claims"
              className="text-cyan-300 hover:text-white font-semibold transition-shadow hover:shadow-[0_0_10px] hover:shadow-cyan-500/50 rounded px-3 py-1.5"
            >
              View Claims
            </Link>
            <Link
              href="/refunds"
              className="text-cyan-300 hover:text-white font-semibold transition-shadow hover:shadow-[0_0_10px] hover:shadow-cyan-500/50 rounded px-3 py-1.5"
            >
              View Refunds
            </Link>
            {/* NEW: Settings */}
            <Link
  href="/settings"
  className="p-2 rounded-full text-cyan-300 hover:text-white transition hover:bg-white/10 hover:shadow-[0_0_10px] hover:shadow-cyan-500/50"
  title="Settings"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.543-.89 3.313.88 2.423 2.423a1.724 1.724 0 001.01 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.89 1.543-.88 3.313-2.423 2.423a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.01c-1.543.89-3.313-.88-2.423-2.423a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.573c-.89-1.543.88-3.313 2.423-2.423.996.574 2.247.125 2.573-1.01z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
</Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-shadow hover:shadow-[0_0_10px] hover:shadow-red-500/80"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content container */}
      <div className="w-full max-w-6xl px-4 lg:px-8 py-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <KpiCard
            title="In Transit"
            value={stats?.in_transit_count}
            active={statusFilter === 'in_transit'}
            onClick={() => setStatusFilter((prev) => (prev === 'in_transit' ? '' : 'in_transit'))}
            icon={TruckIcon}
          />
          <KpiCard
            title="Delivered"
            value={stats?.delivered_count}
            active={statusFilter === 'delivered'}
            onClick={() => setStatusFilter((prev) => (prev === 'delivered' ? '' : 'delivered'))}
            icon={BoxIcon}
          />
          <KpiCard
            title="Refunds in Progress"
            value={stats?.refunds_in_progress_count}
            active={statusFilter === 'refunds_in_progress'}
            onClick={() =>
              setStatusFilter((prev) =>
                prev === 'refunds_in_progress' ? '' : 'refunds_in_progress'
              )
            }
            icon={RefundIcon}
          />
        </div>

        {/* Filters — glass section */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-neutral-300/90 mb-1">
                Search (Store, Order ID)
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="storeFilter" className="block text-xs font-medium text-neutral-300/90 mb-1">
                Filter by Store
              </label>
              <select
                id="storeFilter"
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:ring-cyan-400"
              >
                <option value="">All Stores</option>
                {[...new Set(purchases.map(p => p.store_name))].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {statusFilter && (
            <div className="mt-3 text-xs text-neutral-300/90">
              Showing: <span className="font-medium text-white">
                {statusFilter === 'in_transit' ? 'In Transit' :
                 statusFilter === 'delivered' ? 'Delivered' :
                 'Refunds in Progress'}
              </span> — click the same KPI again to clear.
            </div>
          )}
        </div>
        
        {/* Main split: Add Form + Purchases list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Purchase</h2>
            <PurchaseForm onSuccess={handleNewPurchase} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
            <PurchaseList purchases={filteredPurchases} onDelete={handleDeletePurchase} />
          </div>
        </div>
      </div>
    </main>
  );
}
