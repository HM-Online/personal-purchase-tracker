'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Claim } from '@/lib/types';
import ClaimModal, { ClaimFormData } from '@/components/ClaimModal';

type ClaimWithPurchase = Claim & {
  purchases: {
    store_name: string;
    order_id: string;
  } | null;
};

async function sendNotification(message: string) {
  await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ClaimWithPurchase | null>(null);

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('*, purchases!inner(store_name, order_id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching claims:', error);
    } else {
      setClaims(data as ClaimWithPurchase[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleEditClick = (claim: ClaimWithPurchase) => {
    setEditingClaim(claim);
    setIsModalOpen(true);
  };

  const handleUpdateClaim = async (formData: ClaimFormData) => {
    if (!editingClaim) return;
    const { error } = await supabase
      .from('claims')
      .update({
        reason: formData.reason,
        rma_number: formData.rma_number,
        tracking_number_to_seller: formData.tracking_number_to_seller
      })
      .eq('id', editingClaim.id);

    if (error) {
        alert('Error updating claim: ' + error.message);
    } else {
        alert('Claim updated successfully!');
        setIsModalOpen(false);
        setEditingClaim(null);
        fetchClaims();
    }
  };

  const updateClaimStatus = async (claim: ClaimWithPurchase, newStatus: Claim['status']) => {
    const { error } = await supabase
      .from('claims')
      .update({ status: newStatus })
      .eq('id', claim.id);

    if (error) {
      alert('Error updating status: '.concat(error.message));
    } else {
      const purchaseInfo = claim.purchases;
      if (purchaseInfo) {
        const statusText = newStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const message = `
        🔧 <b>Claim Status Updated!</b>
        --------------------------------------
        <b>Store:</b> ${purchaseInfo.store_name}
        <b>Order ID:</b> ${purchaseInfo.order_id}
        <b>New Status:</b> ${statusText}
        `;
        sendNotification(message);
      }
      fetchClaims();
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-white">Loading Claims...</div>;
  }

  const ClaimCard = ({ claim, children }: { claim: ClaimWithPurchase, children?: React.ReactNode }) => (
      <div key={claim.id} className="bg-gray-700 p-4 rounded-md shadow flex flex-col justify-between">
          <div>
            <p className="font-bold">{claim.purchases?.store_name}</p>
            <p className="text-sm text-gray-400">{claim.purchases?.order_id}</p>
            {claim.rma_number && <p className="text-sm text-gray-300 mt-2">RMA: {claim.rma_number}</p>}
          </div>
          <div className="text-xs text-gray-400 mt-3 border-t border-gray-600 pt-2">
            <p>Initiated: {new Date(claim.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center space-x-2 mt-3">
            <button onClick={() => handleEditClick(claim)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded">
                Edit
            </button>
            <div className="flex-grow">{children}</div>
          </div>
      </div>
  );

  // Filter claims into columns based on status
  const initiatedClaims = claims.filter((c) => c.status === 'initiated');
  const itemSentClaims = claims.filter((c) => c.status === 'item_sent');
  const resolvedClaims = claims.filter((c) => c.status === 'resolved_closed');
  // You can add more columns for the other statuses here if you wish

  return (
    <>
      <main className="w-full p-4 lg:px-8 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Warranty Claims Dashboard</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Main Dashboard
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-orange-400">Initiated ({initiatedClaims.length})</h2>
            <div className="space-y-4">
              {initiatedClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim}>
                  <button onClick={() => updateClaimStatus(claim, 'item_sent')} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-2 rounded">
                    Mark as Item Sent →
                  </button>
                </ClaimCard>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-blue-400">Item Sent ({itemSentClaims.length})</h2>
            <div className="space-y-4">
               {itemSentClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim}>
                  <div className="flex space-x-2 w-full">
                    <button onClick={() => updateClaimStatus(claim, 'initiated')} className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-1 px-2 rounded">
                      ← Undo
                    </button>
                    <button onClick={() => updateClaimStatus(claim, 'resolved_closed')} className="w-1/2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1 px-2 rounded">
                      Mark as Resolved →
                    </button>
                  </div>
                </ClaimCard>
               ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-green-400">Resolved & Closed ({resolvedClaims.length})</h2>
            <div className="space-y-4">
              {resolvedClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim}>
                    <button onClick={() => updateClaimStatus(claim, 'item_sent')} className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-1 px-2 rounded">
                      ← Undo
                    </button>
                </ClaimCard>
              ))}
            </div>
          </div>

        </div>
      </main>

      <ClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateClaim}
        existingClaim={editingClaim}
      />
    </>
  );
}