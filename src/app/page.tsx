'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseList, { Purchase } from '@/components/PurchaseList'; // Import the new component
import type { Session } from '@supabase/supabase-js';

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]); // State to hold the purchases
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch purchases from the database
  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, shipments(*)') // Get all columns
      .order('order_date', { ascending: false }); // Show newest first

    if (error) {
      console.error('Error fetching purchases:', error);
    } else {
      setPurchases(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Check for an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchPurchases(); // Fetch data if user is logged in
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchPurchases(); // Re-fetch data on login
      } else {
        setPurchases([]); // Clear data on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // We also want to refresh the list after a new purchase is added.
  // A simple way is to pass the fetch function to the form.
  const handleNewPurchase = () => {
    fetchPurchases();
  };

  if (isLoading) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>
  }

  if (!session) {
    // Show Auth UI if not logged in
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-white">Purchase Tracker</h1>
                <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="dark" />
            </div>
        </div>
    );
  } else {
    // Show the main application if logged in
    return (
      <main className="container mx-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-lg flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Personal Purchase Tracker</h1>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign Out
            </button>
        </div>

        <PurchaseForm onSuccess={handleNewPurchase} />
        <PurchaseList purchases={purchases} />
      </main>
    );
  }
}