'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// Define the shape of our refund data, including the linked purchase info
type RefundWithPurchase = {
  id: string;
  status: 'requested' | 'approved' | 'paid' | 'denied';
  created_at: string;
  // THE FIX IS HERE: We now expect an array of purchases.
  purchases: {
    store_name: string;
    order_id: string;
  }[] | null;
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRefunds = async () => {
    const { data, error } = await supabase
      .from('refunds')
      .select('*, purchases(store_name, order_id)');

    if (error) {
      console.error('Error fetching refunds:', error);
      setError('Could not load refund data.');
    } else {
      setRefunds(data as RefundWithPurchase[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const updateRefundStatus = async (id: string, newStatus: RefundWithPurchase['status']) => {
    const { error } = await supabase
      .from('refunds')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      fetchRefunds();
    }
  };

  const requestedRefunds = refunds.filter((r) => r.status === 'requested');
  const approvedRefunds = refunds.filter((r) => r.status === 'approved');
  const paidRefunds = refunds.filter((r) => r.status === 'paid');

  if (loading) {
    return <div className="text-center p-8 text-white">Loading refunds...</div>;
  }
  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <main className="container mx-auto p-4 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Refunds Dashboard</h1>
        <Link href="/" className="text-blue-400 hover:underline">
          &larr; Back to Main Dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Requested */}
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-yellow-400">Requested ({requestedRefunds.length})</h2>
          <div className="space-y-4">
            {requestedRefunds.map((refund) => (
              <div key={refund.id} className="bg-gray-700 p-4 rounded-md shadow">
                {/* THE FIX IS HERE: We access the first item [0] of the purchases array */}
                <p className="font-bold">{refund.purchases?.[0]?.store_name}</p>
                <p className="text-sm text-gray-400">{refund.purchases?.[0]?.order_id}</p>
                <button 
                  onClick={() => updateRefundStatus(refund.id, 'approved')}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-2 rounded"
                >
                  Mark as Approved →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Approved */}
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-blue-400">Approved ({approvedRefunds.length})</h2>
          <div className="space-y-4">
            {approvedRefunds.map((refund) => (
              <div key={refund.id} className="bg-gray-700 p-4 rounded-md shadow">
                <p className="font-bold">{refund.purchases?.[0]?.store_name}</p>
                <p className="text-sm text-gray-400">{refund.purchases?.[0]?.order_id}</p>
                <button 
                  onClick={() => updateRefundStatus(refund.id, 'paid')}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1 px-2 rounded"
                >
                  Mark as Paid →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Paid */}
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col">
          <h2 className="font-bold text-xl mb-4 text-green-400">Paid ({paidRefunds.length})</h2>
          <div className="space-y-4">
            {paidRefunds.map((refund) => (
              <div key={refund.id} className="bg-gray-700 p-4 rounded-md shadow">
                <p className="font-bold">{refund.purchases?.[0]?.store_name}</p>
                <p className="text-sm text-gray-400">{refund.purchases?.[0]?.order_id}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}