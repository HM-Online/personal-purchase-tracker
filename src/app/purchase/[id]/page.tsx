'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Purchase, Shipment } from '@/lib/types';
import Link from 'next/link';
import ShipmentTimeline from '@/components/ShipmentTimeline';
import RefundModal, { RefundFormData } from '@/components/RefundModal';
import ClaimModal, { ClaimFormData } from '@/components/ClaimModal';
import { toast } from 'react-hot-toast';

async function sendNotification(message: string) {
  await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

/** Add Tracking (same logic, with toasts) */
const AddTrackingForm = ({
  purchaseId,
  onSave,
}: {
  purchaseId: string;
  onSave: () => void;
}) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber || !courier) {
      toast.error('Please provide both a tracking number and a courier.');
      return;
    }
    setIsSaving(true);

    const { error: insertError } = await supabase.from('shipments').insert({
      purchase_id: purchaseId,
      tracking_number: trackingNumber,
      courier: courier,
    });

    if (insertError) {
      toast.error(insertError.message);
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_number: trackingNumber, courier }),
      });
      if (!response.ok) throw new Error('Ship24 API call failed');
    } catch (error: any) {
      // Not fatal for UI; tracking is stored locally anyway
      console.error('Failed to initiate tracking with Ship24', error);
    }

    setIsSaving(false);
    toast.success('Tracking information saved and activated!');
    onSave();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        <span className="text-cyan-400">➕</span> Add Tracking Information
      </h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-neutral-300/90 mb-1">
            Tracking Number
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
            placeholder="e.g., 1Z999AA10123456784"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-neutral-300/90 mb-1">
            Courier
          </label>
          <input
            type="text"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
            placeholder="e.g., DHL / UPS / FedEx"
            required
          />
        </div>

        <div className="md:col-span-1">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-10 rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-500 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/60 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
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
    const { error } = await supabase
      .from('shipments')
      .update({ status: newStatus })
      .eq('id', shipmentId);
    if (error) {
      { toast.error(error.message); }
    } else {
      const statusText = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const message = `✍️ <b>Manual Status Update!</b>\n--------------------------------------\n<b>Store:</b> ${purchase?.store_name}\n<b>Order ID:</b> ${purchase?.order_id}\n<b>New Status:</b> ${statusText}`;
      await sendNotification(message);
      toast.success('Shipment status updated');
      fetchPurchaseDetails();
    }
  };

  const handleSaveRefund = async (formData: RefundFormData) => {
    if (!purchase) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('refunds')
      .insert({
        purchase_id: purchase.id,
        status: 'requested',
        ...formData,
        refund_start_date: formData.refund_start_date || new Date(),
      });
    if (error) {
      toast.error(error.message);
    } else {
      const message = `⚠️ <b>Refund Requested!</b>\n--------------------------------------\n<b>Store:</b> ${purchase.store_name}\n<b>Order ID:</b> ${purchase.order_id}\n<b>Amount:</b> ${formData.amount || 'N/A'}`;
      await sendNotification(message);
      toast.success('Refund process started');
      setIsRefundModalOpen(false);
      fetchPurchaseDetails();
    }
    setIsSaving(false);
  };

  const handleSaveClaim = async (formData: ClaimFormData) => {
    if (!purchase) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('claims')
      .insert({ purchase_id: purchase.id, status: 'initiated', ...formData });
    if (error) {
      toast.error(error.message);
    } else {
      const message = `🔧 <b>Warranty Claim Initiated!</b>\n--------------------------------------\n<b>Store:</b> ${purchase.store_name}\n<b>Order ID:</b> ${purchase.order_id}\n<b>Reason:</b> ${formData.reason}`;
      await sendNotification(message);
      toast.success('Claim process started');
      setIsClaimModalOpen(false);
      fetchPurchaseDetails();
    }
    setIsSaving(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f680,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
        Loading purchase details...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f680,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
        {error}
      </div>
    );
  if (!purchase)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f680,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
        Purchase not found.
      </div>
    );

  const existingRefund = purchase.refunds && purchase.refunds.length > 0 ? purchase.refunds[0] : null;
  const existingClaim = purchase.claims && purchase.claims.length > 0 ? purchase.claims[0] : null;
  const mainShipment =
    purchase.shipments && purchase.shipments.length > 0 ? purchase.shipments[0] : null;

  const fmtAmount =
    typeof purchase.amount === 'number' ? purchase.amount.toFixed(2) : undefined;

  const titleCase = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getPrimaryStatus = () => {
    const r = existingRefund?.status?.toLowerCase();
    const terminalRefund = new Set(['paid', 'approved', 'denied', 'completed', 'refunded', 'closed']);
    if (r && !terminalRefund.has(r)) {
      return { label: 'Refund in Progress', tone: 'warning' as const };
    }
    const s = mainShipment?.status ? titleCase(mainShipment.status) : null;
    if (s) {
      const tone =
        mainShipment?.status === 'delivered'
          ? ('success' as const)
          : ['exception', 'failed_attempt'].includes(mainShipment?.status ?? '')
          ? ('danger' as const)
          : mainShipment?.status?.startsWith('return')
          ? ('warning' as const)
          : ('info' as const);
      return { label: s, tone };
    }
    return { label: 'No Shipment', tone: 'neutral' as const };
  };

  const Badge = ({
    label,
    tone,
  }: {
    label: string;
    tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  }) => {
    const map: Record<
      'success' | 'info' | 'warning' | 'danger' | 'neutral',
      string
    > = {
      success: 'bg-green-500/15 text-green-300 border-green-400/20',
      info: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/20',
      warning: 'bg-orange-500/15 text-orange-300 border-orange-400/20',
      danger: 'bg-red-500/15 text-red-300 border-red-400/20',
      neutral: 'bg-white/10 text-neutral-300 border-white/10',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${map[tone]}`}
      >
        {label}
      </span>
    );
  };

  const primaryStatus = getPrimaryStatus();

  return (
    <>
      <main className="min-h-screen text-white bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b82f6AA,transparent_60%),linear-gradient(180deg,#0b1224,#0c1020_40%,#0a0f1a)]">
        {/* Sticky header */}
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-cyan-300 hover:text-white transition hover:shadow-[0_0_10px] hover:shadow-cyan-500/60 rounded px-2 py-1 whitespace-nowrap"
            >
              ← Back to Dashboard
            </Link>

            <div className="min-w-0 flex-1 flex items-center gap-3 justify-center">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                Purchase Details: <span className="text-cyan-300">{purchase.store_name}</span>
              </h1>
              <Badge label={primaryStatus.label} tone={primaryStatus.tone} />
            </div>

            <div className="w-[120px]" />
          </div>
        </header>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
          {/* Order Info */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-cyan-400">📦</span> Order Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-neutral-200">
              <p><span className="text-neutral-400">Store:</span> {purchase.store_name}</p>
              <p><span className="text-neutral-400">Order ID:</span> {purchase.order_id}</p>
              <p>
                <span className="text-neutral-400">Order Date:</span>{' '}
                {new Date(purchase.order_date).toLocaleDateString()}
              </p>
              {fmtAmount && (<p><span className="text-neutral-400">Amount:</span> {fmtAmount}</p>)}
              {purchase.payment_method && (<p><span className="text-neutral-400">Payment Method:</span> {purchase.payment_method}</p>)}
              {purchase.email_used && (<p className="truncate"><span className="text-neutral-400">Email:</span> {purchase.email_used}</p>)}
              {purchase.phone_number && (<p className="truncate"><span className="text-neutral-400">Phone:</span> {purchase.phone_number}</p>)}
              {(() => {
                const main = mainShipment;
                return (
                  <>
                    {main?.tracking_number && (<p className="truncate"><span className="text-neutral-400">Tracking #:</span> {main.tracking_number}</p>)}
                    {main?.courier && (<p className="truncate"><span className="text-neutral-400">Courier:</span> {main.courier}</p>)}
                  </>
                );
              })()}
            </div>

            {purchase.shipping_address && (
              <div className="mt-4">
                <p className="text-neutral-400 mb-1">Shipping Address</p>
                <div className="whitespace-pre-line text-neutral-200">{purchase.shipping_address}</div>
              </div>
            )}

            {purchase.notes && (
              <div className="mt-4">
                <p className="text-neutral-400 mb-1">Notes</p>
                <div className="whitespace-pre-line text-neutral-200">{purchase.notes}</div>
              </div>
            )}
          </section>

          {/* Refund */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-orange-300">↩️</span> Return / Refund Status
            </h2>
            {existingRefund ? (
              <p className="font-semibold text-base">
                Status:{' '}
                <span className="capitalize text-yellow-300">{existingRefund.status}</span>
              </p>
            ) : (
              <button
                onClick={() => setIsRefundModalOpen(true)}
                disabled={isSaving}
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-orange-500/60"
              >
                Start Refund Process
              </button>
            )}
          </section>

          {/* Warranty */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-purple-300">🛡️</span> Warranty Claim Status
            </h2>
            {existingClaim ? (
              <p className="font-semibold text-base">
                Status:{' '}
                <span className="capitalize text-purple-200">
                  {existingClaim.status.replace(/_/g, ' ')}
                </span>
              </p>
            ) : (
              <button
                onClick={() => setIsClaimModalOpen(true)}
                disabled={isSaving}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-purple-500/60"
              >
                Start Warranty Claim
              </button>
            )}
          </section>

          {/* Shipment */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-cyan-300">🚚</span> Shipment Timeline
              </h2>

              {mainShipment && (
                <select
                  value={mainShipment.status}
                  onChange={(e) =>
                    handleStatusChange(mainShipment.id, e.target.value as Shipment['status'])
                  }
                  className="bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-cyan-400 focus:ring-cyan-400"
                >
                  {[
                    'pending',
                    'in_transit',
                    'out_for_delivery',
                    'delivered',
                    'failed_attempt',
                    'exception',
                    'return_in_progress',
                    'return_delivered',
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {mainShipment ? (
              <ShipmentTimeline shipments={purchase.shipments} />
            ) : (
              <AddTrackingForm purchaseId={purchase.id} onSave={fetchPurchaseDetails} />
            )}
          </section>
        </div>
      </main>

            <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onSubmit={handleSaveRefund}
        existingRefund={null}
      />

      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSubmit={handleSaveClaim}
        existingClaim={null}
      />
    </>
  );
}
