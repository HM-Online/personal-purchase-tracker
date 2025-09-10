'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  onSuccess: () => void;
};

export default function PurchaseForm({ onSuccess }: Props) {
  const [storeName, setStoreName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDate, setOrderDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailUsed, setEmailUsed] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setStoreName('');
    setOrderId('');
    setOrderDate('');
    setAmount('');
    setPaymentMethod('');
    setPhoneNumber('');
    setEmailUsed('');
    setShippingAddress('');
    setNotes('');
    setTrackingNumber('');
    setCourier('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !orderId || !orderDate) {
      alert('Please fill Store Name, Order ID, and Order Date.');
      return;
    }

    setIsSaving(true);

    // Build row payload (only layout changed — fields stay the same)
    const payload: any = {
      store_name: storeName,
      order_id: orderId,
      order_date: new Date(orderDate),
      amount: amount ? Number(amount) : null,
      payment_method: paymentMethod || null,
      phone_number: phoneNumber || null,
      email_used: emailUsed || null,
      shipping_address: shippingAddress || null,
      notes: notes || null,
    };

    try {
      // Insert purchase first
      const { data, error } = await supabase
        .from('purchases')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;

      // If tracking provided, create a shipment row
      if (data?.id && (trackingNumber || courier)) {
        const { error: shipErr } = await supabase.from('shipments').insert({
          purchase_id: data.id,
          tracking_number: trackingNumber || null,
          courier: courier || null,
        });
        if (shipErr) throw shipErr;
      }

      alert('Purchase saved successfully!');
      reset();
      onSuccess();
    } catch (err: any) {
      alert('Error adding purchase: ' + (err?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-dark rounded-lg shadow-md p-4 md:p-6"
    >
      <h2 className="text-xl font-bold mb-4 text-text-light">Add New Purchase</h2>

      {/* Row 1: Store Name - Order ID - Order Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Store Name</label>
          <input
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Order ID</label>
          <input
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Order Date</label>
          <input
            type="date"
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Amount - Payment Method - Phone Number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Amount</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Payment Method</label>
          <input
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Phone Number</label>
          <input
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder=""
          />
        </div>
      </div>

      {/* Row 3: Email Used - Shipping Address - Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Email Used</label>
          <input
            type="email"
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={emailUsed}
            onChange={(e) => setEmailUsed(e.target.value)}
            placeholder=""
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-text-muted">Shipping Address</label>
          <textarea
            rows={3}
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder=""
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-text-muted">Notes</label>
          <textarea
            rows={3}
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=""
          />
        </div>
      </div>

      {/* Row 4: Tracking Number - Courier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Tracking Number</label>
          <input
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Courier</label>
          <input
            className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder=""
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-accent-primary hover:opacity-90 text-background-dark font-bold py-2 px-4 rounded-md"
        >
          {isSaving ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>
    </form>
  );
}
