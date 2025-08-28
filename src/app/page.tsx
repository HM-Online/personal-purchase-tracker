'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseList from '@/components/PurchaseList';
import type { Purchase } from '@/lib/types';
import type { Session } from '@supabase/supabase-js';

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPurchases = async () => {
    // THE FIX IS HERE: We now select everything to match our 'Purchase' type
    const { data, error } = await supabase
      .from('purchases')
      .select('*, shipments(*), refunds(*)')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
    } else {
      setPurchases(data as Purchase[]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchPurchases();
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchPurchases();
      } else {
        setPurchases([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleNewPurchase = () => {
    fetchPurchases();
  };
  
  const storeNames = [...new Set(purchases.map(p => p.store_name))].sort();

  if (isLoading) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>
  }

  if (!session) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-white">Purchase Tracker</h1>
                <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" />
            </div>
        </div>
    );
  } else {
    return (
      <main className="container mx-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-lg flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Personal Purchase Tracker</h1>
            <div className="flex items-center space-x-4">
                <Link href="/refunds" className="text-blue-400 hover:underline">
                    View Refunds
                </Link>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Sign Out
                </button>
            </div>
        </div>
        
        <div className="w-full max-w-lg mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-300">Search (Store, Order ID)</label>
              <input
                type="text"
                id="search"
                placeholder="Search..."
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2 text-white"
              />
            </div>
            <div>
              <label htmlFor="storeFilter" className="block text-sm font-medium text-gray-300">Filter by Store</label>
              <select
                id="storeFilter"
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2 text-white"
              >
                <option value="">All Stores</option>
                {storeNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <PurchaseForm onSuccess={handleNewPurchase} />
        <PurchaseList purchases={purchases} />
      </main>
    );
  }
}