'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import type { Purchase } from '../../../lib/types'; // We now import from our central types file
import Link from 'next/link';
import ShipmentTimeline from '../../../components/ShipmentTimeline';

export default function PurchaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingRefund, setIsCreatingRefund] = useState(false);

  const fetchPurchaseDetails = async () => {
    setLoading(true);
    // We update the select() query to also fetch linked refunds
    const { data, error } = await supabase
      .from('purchases')
      .select('*, shipments(*, checkpoints(*)), refunds(*)') 
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching purchase details:', error);
      setError('Failed to load purchase details.');
    } else {
      setPurchase(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
        fetchPurchaseDetails();
    }
  }, [id]);

  // This is the new function to handle starting a refund
  const handleStartRefund = async () => {
    if (!purchase) return;
    setIsCreatingRefund(true);
    const { error } = await supabase.from('refunds').insert({
      purchase_id: purchase.id,
      status: 'requested',
    });

    if (error) {
      alert('Error starting refund: ' + error.message);
    } else {
      alert('Refund process started successfully!');
      // Refresh the page data to show the new refund status
      fetchPurchaseDetails();
    }
    setIsCreatingRefund(false);
  };

  if (loading) {
    return <div className="text-center p-8 text-white">Loading purchase details...</div>;
  }
  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }
  if (!purchase) {
    return <div className="text-center p-8 text-white">Purchase not found.</div>;
  }

  // Check if a refund already exists for this purchase
  const existingRefund = purchase.refunds && purchase.refunds.length > 0 ? purchase.refunds[0] : null;

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

        {/* This is the new Refund section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-2">Return / Refund Status</h2>
            {existingRefund ? (
                <p className="font-bold text-lg capitalize">Status: <span className="text-yellow-400">{existingRefund.status}</span></p>
            ) : (
                <button 
                    onClick={handleStartRefund}
                    disabled={isCreatingRefund}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
                >
                    {isCreatingRefund ? 'Starting...' : 'Start Refund Process'}
                </button>
            )}
        </div>

        <ShipmentTimeline shipments={purchase.shipments} />
    </main>
  );
}