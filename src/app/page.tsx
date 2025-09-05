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

// Allowable status filter keys mapped from KPI clicks
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
    // Consider "in transit" if ANY shipment is not delivered
    return shipments.some((s) => getString(s?.status) !== 'delivered');
  };

  const isRefundInProgress = (p: Purchase) => {
    const refunds: any[] = Array.isArray((p as any)?.refunds) ? (p as any).refunds : [];
    if (refunds.length === 0) return false;

    const INPROG = new Set([
      'in progress', 'in-progress', 'progress',
      'pending', 'processing', 'open', 'opened',
      'under review', 'under-review', 'awaiting', 'waiting',
      'requested', 'submitted'
    ]);

    const DONE = new Set([
      'completed', 'complete', 'approved', 'resolved',
      'refunded', 'paid', 'closed', 'denied', 'rejected', 'canceled', 'cancelled'
    ]);

    let anyInProgress = false;
    let anyDone = false;

    for (const r of refunds) {
      const raw =
        r?.status ??
        r?.state ??
        r?.refund_status ??
        r?.current_status ??
        r?.progress_status ??
        '';
      const s = getString(raw);
      if (INPROG.has(s)) anyInProgress = true;
      if (DONE.has(s)) anyDone = true;
    }

    // If any refund explicitly looks "in progress", treat as in progress.
    if (anyInProgress) return true;

    // If refunds exist but none are in "done" states, assume still in progress.
    if (!anyDone) return true;

    return false;
  };

  // Build store list
  const storeNames = [...new Set(purchases.map(p => p.store_name))].sort();

  // Compose filters: store + search + (optional) statusFilter from KPI
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
    return <div className="min-h-screen bg-background-dark flex items-center justify-center text-text-light">Loading...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-surface-dark rounded-lg shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-text-light">Purchase Tracker</h1>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }} 
            theme="dark"
          />
        </div>
      </div>
    );
  } else {
    return (
      <main className="w-full flex flex-col items-center bg-background-dark min-h-screen">
        {/* Sticky top bar */}
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur supports-[backdrop-filter]:bg-background-dark/60">
          <div className="mx-auto max-w-6xl px-4 lg:px-8 py-3 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-text-light">
              Personal Purchase Tracker
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/claims"
                className="text-accent-primary hover:text-text-light font-semibold transition-shadow hover:shadow-[0_0_8px] hover:shadow-accent-primary/60 rounded px-2 py-1"
              >
                View Claims
              </Link>
              <Link
                href="/refunds"
                className="text-accent-primary hover:text-text-light font-semibold transition-shadow hover:shadow-[0_0_8px] hover:shadow-accent-primary/60 rounded px-2 py-1"
              >
                View Refunds
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-accent-danger hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-shadow hover:shadow-[0_0_8px] hover:shadow-accent-danger/80"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="w-full max-w-6xl px-4 lg:px-8 py-6">
          {/* KPI row — clickable with hover glow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <KpiCard
              title="In Transit"
              value={stats?.in_transit_count}
              onClick={() =>
                setStatusFilter((prev) => (prev === 'in_transit' ? '' : 'in_transit'))
              }
            />
            <KpiCard
              title="Delivered"
              value={stats?.delivered_count}
              onClick={() =>
                setStatusFilter((prev) => (prev === 'delivered' ? '' : 'delivered'))
              }
            />
            <KpiCard
              title="Refunds in Progress"
              value={stats?.refunds_in_progress_count}
              onClick={() =>
                setStatusFilter((prev) =>
                  (prev === 'refunds_in_progress' ? '' : 'refunds_in_progress')
                )
              }
            />
          </div>

          {/* Filters */}
          <div className="mb-6 p-4 bg-surface-dark rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-text-muted">
                  Search (Store, Order ID)
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary"
                />
              </div>
              <div>
                <label htmlFor="storeFilter" className="block text-sm font-medium text-text-muted">
                  Filter by Store
                </label>
                <select
                  id="storeFilter"
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary"
                >
                  <option value="">All Stores</option>
                  {storeNames.map(name => (<option key={name} value={name}>{name}</option>))}
                </select>
              </div>
            </div>

            {statusFilter && (
              <div className="mt-3 text-xs text-text-muted">
                Showing: <span className="font-medium text-text-light">
                  {statusFilter === 'in_transit' ? 'In Transit' :
                   statusFilter === 'delivered' ? 'Delivered' :
                   'Refunds in Progress'}
                </span> — click the same KPI again to clear.
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <PurchaseForm onSuccess={handleNewPurchase} />
            </div>
            <div>
              <PurchaseList purchases={filteredPurchases} onDelete={handleDeletePurchase} />
            </div>
          </div>
        </div>
      </main>
    );
  }
}
