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
        tracking_number_to_seller: formData.tracking_number_to_seller,
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
        const statusText = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        Loading Claims...
      </div>
    );
  }

  // Polished claim card (UI only)
  const ClaimCard = ({
    claim,
    children,
  }: {
    claim: ClaimWithPurchase;
    children?: React.ReactNode;
  }) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm p-4 hover:shadow-[0_0_10px] hover:shadow-cyan-500/10 transition">
      <div>
        <p className="font-semibold text-white leading-snug">
          {claim.purchases?.store_name}
        </p>
        <p className="text-sm text-cyan-400 truncate">{claim.purchases?.order_id}</p>
        {claim.rma_number && (
          <p className="text-sm text-neutral-200 mt-2">
            <span className="text-neutral-400">RMA:</span> {claim.rma_number}
          </p>
        )}
      </div>

      <div className="text-xs text-neutral-400 mt-3 border-top border-neutral-800 pt-2">
        Initiated: {new Date(claim.created_at).toLocaleDateString()}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => handleEditClick(claim)}
          className="text-xs border border-neutral-700 hover:bg-neutral-800 text-white font-semibold py-1 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/30"
        >
          Edit
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );

  // Filter columns
  const initiatedClaims = claims.filter((c) => c.status === 'initiated');
  const itemSentClaims = claims.filter((c) => c.status === 'item_sent');
  const resolvedClaims = claims.filter((c) => c.status === 'resolved_closed');

  return (
    <>
      <main className="min-h-screen bg-neutral-950 px-4 lg:px-8 py-6 text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Warranty Claims Dashboard</h1>
          <Link
            href="/"
            className="text-cyan-400 hover:text-white transition hover:shadow-[0_0_8px] hover:shadow-cyan-500/60 rounded px-2 py-1"
          >
            ← Back to Main Dashboard
          </Link>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Initiated */}
          <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-orange-400">Initiated</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                {initiatedClaims.length}
              </span>
            </h2>
            <div className="space-y-4">
              {initiatedClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim}>
                  <button
                    onClick={() => updateClaimStatus(claim, 'item_sent')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-blue-500/60"
                  >
                    Mark as Item Sent →
                  </button>
                </ClaimCard>
              ))}
            </div>
          </section>

          {/* Item Sent */}
          <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-blue-400">Item Sent</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                {itemSentClaims.length}
              </span>
            </h2>
            <div className="space-y-4">
              {itemSentClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim}>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => updateClaimStatus(claim, 'initiated')}
                      className="w-1/2 border border-neutral-700 hover:bg-neutral-800 text-white text-xs font-semibold py-1.5 px-2 rounded transition"
                    >
                      ← Undo
                    </button>
                    <button
                      onClick={() => updateClaimStatus(claim, 'resolved_closed')}
                      className="w-1/2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold py-1.5 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-green-500/60"
                    >
                      Mark as Resolved →
                    </button>
                  </div>
                </ClaimCard>
              ))}
            </div>
          </section>

          {/* Resolved & Closed */}
          <section className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-green-400">Resolved &amp; Closed</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                {resolvedClaims.length}
              </span>
            </h2>
            <div className="space-y-4">
              {resolvedClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim}>
                  <button
                    onClick={() => updateClaimStatus(claim, 'item_sent')}
                    className="w-full border border-neutral-700 hover:bg-neutral-800 text-white text-xs font-semibold py-1.5 px-2 rounded transition"
                  >
                    ← Undo
                  </button>
                </ClaimCard>
              ))}
            </div>
          </section>
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
