'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Refund } from '@/lib/types';
import RefundModal, { RefundFormData } from '@/components/RefundModal';

type RefundWithPurchaseDetails = Refund & {
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

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundWithPurchaseDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRefund, setEditingRefund] = useState<RefundWithPurchaseDetails | null>(null);

  const fetchRefunds = useCallback(async () => {
    const { data, error } = await supabase
      .from('refunds')
      .select('*, purchases!inner(store_name, order_id)');

    if (error) {
      console.error('Error fetching refunds:', error);
    } else {
      setRefunds(data as RefundWithPurchaseDetails[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleEditClick = (refund: RefundWithPurchaseDetails) => {
    setEditingRefund(refund);
    setIsModalOpen(true);
  };

  const handleUpdateRefund = async (formData: RefundFormData) => {
    if (!editingRefund) return;
    const { error } = await supabase
      .from('refunds')
      .update({
        amount: formData.amount,
        platform: formData.platform,
        reason: formData.reason,
        rma_number: formData.rma_number,
        refund_start_date: formData.refund_start_date || null,
        approved_at: formData.approved_at || null,
        paid_at: formData.paid_at || null,
        return_tracking_number: formData.return_tracking_number,
        return_courier: formData.return_courier,
      })
      .eq('id', editingRefund.id);

    if (error) {
      alert('Error updating refund: ' + error.message);
    } else {
      alert('Refund updated successfully!');
      setIsModalOpen(false);
      setEditingRefund(null);
      fetchRefunds();
    }
  };

  const updateRefundStatus = async (refund: RefundWithPurchaseDetails, newStatus: Refund['status']) => {
    const updateData: {
      status: Refund['status'];
      approved_at?: Date | null;
      paid_at?: Date | null;
    } = { status: newStatus };

    if (newStatus === 'approved') updateData.approved_at = new Date();
    else if (newStatus === 'paid') updateData.paid_at = new Date();

    if (newStatus === 'requested') {
      updateData.approved_at = null;
      updateData.paid_at = null;
    } else if (newStatus === 'approved' && refund.status === 'paid') {
      updateData.paid_at = null;
    }

    const { error } = await supabase.from('refunds').update(updateData).eq('id', refund.id);

    if (error) {
      alert('Error updating status: '.concat(error.message));
    } else {
      const purchaseInfo = refund.purchases;
      if (purchaseInfo && newStatus !== 'requested') {
        let statusEmoji = '❔';
        if (newStatus === 'approved') statusEmoji = '✅';
        if (newStatus === 'paid') statusEmoji = '💶';
        if (newStatus === 'denied') statusEmoji = '❌';
        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        const message = `
${statusEmoji} <b>Refund ${statusText}!</b>
--------------------------------------
<b>Store:</b> ${purchaseInfo.store_name}
<b>Order ID:</b> ${purchaseInfo.order_id}
`;
        sendNotification(message);
      }
      fetchRefunds();
    }
  };

  const requestedRefunds = refunds.filter((r) => r.status === 'requested');
  const approvedRefunds = refunds.filter((r) => r.status === 'approved');
  const paidRefunds = refunds.filter((r) => r.status === 'paid');
  const deniedRefunds = refunds.filter((r) => r.status === 'denied');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f680,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
        Loading refunds...
      </div>
    );
  }

  // Glass card used in all columns (UI-only)
  const RefundCard = ({
    refund,
    children,
  }: {
    refund: RefundWithPurchaseDetails;
    children?: React.ReactNode;
  }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl shadow-md p-4 backdrop-blur-xl hover:shadow-[0_0_12px] hover:shadow-cyan-500/15 transition">
      <div>
        <p className="font-semibold text-white leading-snug">{refund.purchases?.store_name}</p>
        <p className="text-sm text-cyan-300 truncate">{refund.purchases?.order_id}</p>

        <div className="mt-3 space-y-1 text-sm">
          {typeof refund.amount === 'number' && (
            <p className="text-neutral-200">
              <span className="text-neutral-400">Amount:</span> {refund.amount.toFixed(2)}
            </p>
          )}
          {refund.platform && (
            <p className="text-neutral-200">
              <span className="text-neutral-400">Platform:</span> {refund.platform}
            </p>
          )}
        </div>
      </div>

      <div className="text-xs text-neutral-300/80 mt-3 border-t border-white/10 pt-2 space-y-0.5">
        <p>Requested: {new Date(refund.created_at).toLocaleDateString()}</p>
        {refund.approved_at && <p>Approved: {new Date(refund.approved_at).toLocaleDateString()}</p>}
        {refund.paid_at && <p>Paid: {new Date(refund.paid_at).toLocaleDateString()}</p>}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => handleEditClick(refund)}
          className="text-xs border border-white/10 hover:bg-white/10 text-white font-semibold py-1 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/30"
        >
          Edit
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );

  return (
    <>
      <main className="min-h-screen text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f6AA,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)] px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Refunds Dashboard</h1>
          <Link
            href="/"
            className="text-cyan-300 hover:text-white transition hover:shadow-[0_0_10px] hover:shadow-cyan-500/60 rounded px-2 py-1"
          >
            ← Back to Main Dashboard
          </Link>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {/* Requested */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-yellow-300">Requested</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/10">
                {requestedRefunds.length}
              </span>
            </h2>
            <div className="space-y-4">
              {requestedRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => updateRefundStatus(refund, 'denied')}
                      className="w-1/2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-red-500/60"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateRefundStatus(refund, 'approved')}
                      className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-blue-500/60"
                    >
                      Approve →
                    </button>
                  </div>
                </RefundCard>
              ))}
            </div>
          </section>

          {/* Approved */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-blue-300">Approved</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/10">
                {approvedRefunds.length}
              </span>
            </h2>
            <div className="space-y-4">
              {approvedRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => updateRefundStatus(refund, 'requested')}
                      className="w-1/2 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold py-1.5 px-2 rounded transition"
                    >
                      ← Undo
                    </button>
                    <button
                      onClick={() => updateRefundStatus(refund, 'paid')}
                      className="w-1/2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold py-1.5 px-2 rounded transition-shadow hover:shadow-[0_0_8px] hover:shadow-green-500/60"
                    >
                      Paid →
                    </button>
                  </div>
                </RefundCard>
              ))}
            </div>
          </section>

          {/* Paid */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-green-300">Paid</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/10">
                {paidRefunds.length}
              </span>
            </h2>
            <div className="space-y-4">
              {paidRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                  <button
                    onClick={() => updateRefundStatus(refund, 'approved')}
                    className="w-full border border-white/10 hover:bg-white/10 text-white text-xs font-semibold py-1.5 px-2 rounded transition"
                  >
                    ← Undo
                  </button>
                </RefundCard>
              ))}
            </div>
          </section>

          {/* Denied */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
              <span className="text-red-400">Denied</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 border border-white/10">
                {deniedRefunds.length}
              </span>
            </h2>
            <div className="space-y-4">
              {deniedRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                  <button
                    onClick={() => updateRefundStatus(refund, 'requested')}
                    className="w-full border border-white/10 hover:bg-white/10 text-white text-xs font-semibold py-1.5 px-2 rounded transition"
                  >
                    ← Re-open
                  </button>
                </RefundCard>
              ))}
            </div>
          </section>
        </div>
      </main>

      <RefundModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpdateRefund}
        existingRefund={editingRefund}
      />
    </>
  );
}
