'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Purchase, Shipment } from '@/lib/types';
import Link from 'next/link';
import ShipmentTimeline from '@/components/ShipmentTimeline';
import RefundModal, { RefundFormData } from '@/components/RefundModal';
import ClaimModal, { ClaimFormData } from '@/components/ClaimModal';

async function sendNotification(message: string) {
  await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

// --- NEW SUB-COMPONENT FOR THE TRACKING FORM ---
const AddTrackingForm = ({ purchaseId, onSave }: { purchaseId: string, onSave: () => void }) => {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courier, setCourier] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber || !courier) {
            alert('Please provide both a tracking number and a courier.');
            return;
        }
        setIsSaving(true);

        // 1. Save the new shipment to our database
        const { error: insertError } = await supabase.from('shipments').insert({
            purchase_id: purchaseId,
            tracking_number: trackingNumber,
            courier: courier,
        });

        if (insertError) {
            alert('Error saving tracking info: ' + insertError.message);
            setIsSaving(false);
            return;
        }

        // 2. Tell Ship24 to start tracking this number via our API
        try {
            const response = await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracking_number: trackingNumber, courier: courier }),
            });
            if (!response.ok) {
              throw new Error('Ship24 API call failed');
            }
        } catch (error) {
            console.error('Failed to initiate tracking with Ship24', error);
        }
        
        setIsSaving(false);
        alert('Tracking information saved and activated!');
        onSave(); // This tells the main page to refresh its data
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2 text-text-light">Add Tracking Information</h3>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                    <label htmlFor="trackingNumber" className="block text-sm font-medium text-text-muted">Tracking Number</label>
                    <input type="text" id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" required />
                </div>
                <div className="flex-grow w-full">
                    <label htmlFor="courier" className="block text-sm font-medium text-text-muted">Courier</label>
                    <input type="text" id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" required />
                </div>
                <button type="submit" disabled={isSaving} className="bg-accent-primary hover:opacity-90 text-background-dark font-bold py-2 px-4 rounded-md h-10 w-full md:w-auto">
                    {isSaving ? 'Saving...' : 'Save Tracking'}
                </button>
            </form>
        </div>
    );
};


export default function PurchaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPurchaseDetails = useCallback(async () => {
    if (!id) return;
    // We don't set loading to true on re-fetches
    const { data, error } = await supabase
      .from('purchases')
      .select('*, shipments(*, checkpoints(*)), refunds(*), claims(*)') 
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching purchase details:', error);
      setError('Failed to load purchase details.');
    } else {
      setPurchase(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchPurchaseDetails();
  }, [fetchPurchaseDetails]);

  const handleStatusChange = async (shipmentId: string, newStatus: Shipment['status']) => {
    const { error } = await supabase.from('shipments').update({ status: newStatus }).eq('id', shipmentId);
    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      const statusText = newStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const message = `✍️ <b>Manual Status Update!</b>\n--------------------------------------\n<b>Store:</b> ${purchase?.store_name}\n<b>Order ID:</b> ${purchase?.order_id}\n<b>New Status:</b> ${statusText}`;
      await sendNotification(message);
      fetchPurchaseDetails();
    }
  };

  const handleSaveRefund = async (formData: RefundFormData) => {
    if (!purchase) return;
    setIsSaving(true);
    const { error } = await supabase.from('refunds').insert({ purchase_id: purchase.id, status: 'requested', ...formData, refund_start_date: formData.refund_start_date || new Date() });
    if (error) { alert('Error starting refund: ' + error.message); } 
    else {
      const message = `⚠️ <b>Refund Requested!</b>\n--------------------------------------\n<b>Store:</b> ${purchase.store_name}\n<b>Order ID:</b> ${purchase.order_id}\n<b>Amount:</b> ${formData.amount || 'N/A'}`;
      await sendNotification(message);
      alert('Refund process started successfully!');
      setIsRefundModalOpen(false);
      fetchPurchaseDetails();
    }
    setIsSaving(false);
  };

  const handleSaveClaim = async (formData: ClaimFormData) => {
    if (!purchase) return;
    setIsSaving(true);
    const { error } = await supabase.from('claims').insert({ purchase_id: purchase.id, status: 'initiated', ...formData });
    if (error) { alert('Error starting claim: ' + error.message); } 
    else {
      const message = `🔧 <b>Warranty Claim Initiated!</b>\n--------------------------------------\n<b>Store:</b> ${purchase.store_name}\n<b>Order ID:</b> ${purchase.order_id}\n<b>Reason:</b> ${formData.reason}`;
      await sendNotification(message);
      alert('Claim process started successfully!');
      setIsClaimModalOpen(false);
      fetchPurchaseDetails();
    }
    setIsSaving(false);
  };

  if (loading) return <div className="text-center p-8 text-text-light">Loading purchase details...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!purchase) return <div className="text-center p-8 text-text-light">Purchase not found.</div>;

  const existingRefund = purchase.refunds && purchase.refunds.length > 0 ? purchase.refunds[0] : null;
  const existingClaim = purchase.claims && purchase.claims.length > 0 ? purchase.claims[0] : null;
  const mainShipment = purchase.shipments && purchase.shipments.length > 0 ? purchase.shipments[0] : null;
  const shipmentStatuses = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed_attempt', 'exception', 'return_in_progress', 'return_delivered'];

  return (
    <>
      <main className="container mx-auto p-4 text-text-light">
          <Link href="/" className="text-accent-primary hover:text-text-light mb-4 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-3xl font-bold mb-4">Purchase Details: <span className="text-accent-primary">{purchase.store_name}</span></h1>
          
          <div className="bg-surface-dark p-6 rounded-lg mb-6">
              <h2 className="text-xl font-bold mb-2">Order Information</h2>
              <p><strong>Order ID:</strong> {purchase.order_id}</p>
              <p><strong>Order Date:</strong> {new Date(purchase.order_date).toLocaleDateString()}</p>
          </div>

          <div className="bg-surface-dark p-6 rounded-lg mb-6">
              <h2 className="text-xl font-bold mb-2">Return / Refund Status</h2>
              {existingRefund ? <p className="font-bold text-lg capitalize">Status: <span className="text-yellow-400">{existingRefund.status}</span></p> : <button onClick={() => setIsRefundModalOpen(true)} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Start Refund Process</button>}
          </div>

          <div className="bg-surface-dark p-6 rounded-lg mb-6">
              <h2 className="text-xl font-bold mb-2">Warranty Claim Status</h2>
              {existingClaim ? <p className="font-bold text-lg capitalize">Status: <span className="text-orange-400">{existingClaim.status.replace(/_/g, ' ')}</span></p> : <button onClick={() => setIsClaimModalOpen(true)} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Start Warranty Claim</button>}
          </div>
          
          <div className="bg-surface-dark p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold">Shipment Timeline</h2>
              {mainShipment && (
                <select 
                  value={mainShipment.status}
                  onChange={(e) => handleStatusChange(mainShipment.id, e.target.value as Shipment['status'])}
                  className="bg-background-dark border-gray-600 rounded-md p-2 text-text-light text-sm"
                >
                  {shipmentStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* --- THIS IS THE NEW CONDITIONAL LOGIC --- */}
            {mainShipment ? (
                <ShipmentTimeline shipments={purchase.shipments} />
            ) : (
                <AddTrackingForm purchaseId={purchase.id} onSave={fetchPurchaseDetails} />
            )}
          </div>
      </main>
      
      <RefundModal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} onSubmit={handleSaveRefund} existingRefund={null} />
      <ClaimModal isOpen={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)} onSubmit={handleSaveClaim} existingClaim={null} />
    </>
  );
}