'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // 1. Import the new hook
import { supabase } from '../../../lib/supabaseClient';
import type { Purchase } from '../../../components/PurchaseList';
import Link from 'next/link';
import ShipmentTimeline from '../../../components/ShipmentTimeline';

// We no longer need the Page Props type, so it has been removed.

export default function PurchaseDetailPage() {
  // 2. Use the hook to get the params
  const params = useParams();
  const id = params.id as string; // Get the id from the hook's result

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!id) return; // Don't fetch if the id isn't available yet

      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select('*, shipments(*, checkpoints(*))')
        .eq('id', id) // 3. Use the id from the hook
        .single();

      if (error) {
        console.error('Error fetching purchase details:', error);
        setError('Failed to load purchase details.');
      } else {
        setPurchase(data);
      }
      setLoading(false);
    };

    fetchPurchaseDetails();
  }, [id]); // 4. The dependency is now the id from the hook

  // The rest of the component (the JSX) is identical
  if (loading) {
    return <div className="text-center p-8 text-white">Loading purchase details...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!purchase) {
    return <div className="text-center p-8 text-white">Purchase not found.</div>;
  }

  return (
    <main className="container mx-auto p-4 text-white">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold mb-4">
            Purchase Details: <span className="text-blue-400">{purchase.store_name}</span>
        </h1>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Order Information</h2>
            <p><strong>Order ID:</strong> {purchase.order_id}</p>
            <p><strong>Order Date:</strong> {new Date(purchase.order_date).toLocaleDateString()}</p>
        </div>

        <ShipmentTimeline shipments={purchase.shipments} />

    </main>
  );
}