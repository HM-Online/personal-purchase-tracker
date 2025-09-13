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

  // ---- Shared input styles (no layout change) ----
  const inputBase =
    'mt-1 block w-full bg-background-dark border border-gray-600 rounded-md px-3 text-text-light h-10 focus:ring-accent-primary focus:border-accent-primary placeholder:text-text-muted/70';
  const textAreaBase =
    'mt-1 block w-full bg-background-dark border border-gray-600 rounded-md px-3 py-2 text-text-light focus:ring-accent-primary focus:border-accent-primary placeholder:text-text-muted/70';

  return (
    <form onSubmit={handleSubmit} className="bg-surface-dark rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl font-bold mb-4 text-text-light">Add New Purchase</h2>

      {/* Row 1: Store Name - Order ID - Order Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Store Name</label>
          <input
            className={inputBase}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g., Amazon, Temu"
            autoComplete="organization"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Order ID</label>
          <input
            className={inputBase}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g., 123-4567890-1234567"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Order Date</label>
          <input
            type="date"
            className={inputBase}
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            aria-describedby="order-date-hint"
          />
          <p id="order-date-hint" className="mt-1 text-xs text-text-muted">
            Use the purchase date shown on your receipt.
          </p>
        </div>
      </div>

      {/* Row 2: Amount - Payment Method - Phone Number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Amount</label>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            className={`${inputBase} text-right`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Payment Method</label>
          <input
            className={inputBase}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            placeholder="e.g., Visa •••• 4242 / PayPal"
            autoComplete="cc-name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Phone Number</label>
          <input
            className={inputBase}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Row 3: Email Used - Shipping Address - Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Email Used</label>
          <input
            type="email"
            className={inputBase}
            value={emailUsed}
            onChange={(e) => setEmailUsed(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-text-muted">Shipping Address</label>
          <textarea
            rows={3}
            className={textAreaBase}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Street, City, ZIP, Country"
            autoComplete="street-address"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-text-muted">Notes</label>
          <textarea
            rows={3}
            className={textAreaBase}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional (e.g., color/size, gift note)"
          />
        </div>
      </div>

      {/* Row 4: Tracking Number - Courier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-text-muted">Tracking Number</label>
          <input
            className={inputBase}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g., 1Z999AA10123456784"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted">Courier</label>
          <input
            className={inputBase}
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="e.g., DHL / UPS / FedEx"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-accent-primary hover:opacity-90 text-background-dark font-bold py-2 px-4 rounded-md h-10"
        >
          {isSaving ? 'Saving...' : 'Save Purchase'}
        </button>
      </div>
    </form>
  );
}
