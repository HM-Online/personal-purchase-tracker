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
      if (purchaseInfo) {
        if (newStatus !== 'requested') {
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
      }
      fetchRefunds();
    }
  };

  const requestedRefunds = refunds.filter((r) => r.status === 'requested');
  const approvedRefunds = refunds.filter((r) => r.status === 'approved');
  const paidRefunds = refunds.filter((r) => r.status === 'paid');
  const deniedRefunds = refunds.filter((r) => r.status === 'denied');

  if (loading) return <div className="text-center p-8 text-white">Loading refunds...</div>;

  const RefundCard = ({ refund, children }: { refund: RefundWithPurchaseDetails, children?: React.ReactNode }) => (
    <div key={refund.id} className="bg-surface-dark p-4 rounded-md shadow flex flex-col justify-between">
      <div>
        <p className="font-bold text-text-light">{refund.purchases?.store_name}</p>
        <p className="text-sm text-text-muted">{refund.purchases?.order_id}</p>
        {refund.amount && <p className="text-sm text-text-light mt-2">Amount: {refund.amount.toFixed(2)}</p>}
        {refund.platform && <p className="text-sm text-text-light">Platform: {refund.platform}</p>}
      </div>
      <div className="text-xs text-text-muted mt-3 border-t border-gray-600 pt-2">
        <p>Requested: {new Date(refund.created_at).toLocaleDateString()}</p>
        {refund.approved_at && <p>Approved: {new Date(refund.approved_at).toLocaleDateString()}</p>}
        {refund.paid_at && <p>Paid: {new Date(refund.paid_at).toLocaleDateString()}</p>}
      </div>
      <div className="flex items-center space-x-2 mt-3">
        <button onClick={() => handleEditClick(refund)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded">
            Edit
        </button>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );

  return (
    <>
      <main className="container mx-auto p-4 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Refunds Dashboard</h1>
          <Link href="/" className="text-accent-primary hover:text-text-light">
            &larr; Back to Main Dashboard
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-yellow-400">Requested ({requestedRefunds.length})</h2>
            <div className="space-y-4">
              {requestedRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                  <div className="flex space-x-2 w-full">
                    <button onClick={() => updateRefundStatus(refund, 'denied')} className="w-1/2 bg-accent-danger hover:opacity-90 text-white text-sm font-bold py-1 px-2 rounded">
                      Reject
                    </button>
                    <button onClick={() => updateRefundStatus(refund, 'approved')} className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-2 rounded">
                      Approve →
                    </button>
                  </div>
                </RefundCard>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-blue-400">Approved ({approvedRefunds.length})</h2>
            <div className="space-y-4">
              {approvedRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                  <div className="flex space-x-2 w-full">
                      <button onClick={() => updateRefundStatus(refund, 'requested')} className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-1 px-2 rounded">
                          ← Undo
                      </button>
                      <button onClick={() => updateRefundStatus(refund, 'paid')} className="w-1/2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1 px-2 rounded">
                          Paid →
                      </button>
                  </div>
                </RefundCard>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-green-400">Paid ({paidRefunds.length})</h2>
            <div className="space-y-4">
              {paidRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                    <button onClick={() => updateRefundStatus(refund, 'approved')} className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-1 px-2 rounded">
                          ← Undo
                    </button>
                </RefundCard>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4 text-accent-danger">Denied ({deniedRefunds.length})</h2>
            <div className="space-y-4">
              {deniedRefunds.map((refund) => (
                <RefundCard key={refund.id} refund={refund}>
                    <button onClick={() => updateRefundStatus(refund, 'requested')} className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-1 px-2 rounded">
                          ← Re-open
                    </button>
                </RefundCard>
              ))}
            </div>
          </div>
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