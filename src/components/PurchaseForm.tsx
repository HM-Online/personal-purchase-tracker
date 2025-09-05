'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Corrected import path for consistency

async function sendNotification(message: string) {
  await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

const FORM_DRAFT_KEY = 'purchase_form_draft';

export default function PurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [storeName, setStoreName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [emailUsed, setEmailUsed] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(FORM_DRAFT_KEY);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setStoreName(draft.storeName || ''); setOrderId(draft.orderId || ''); setOrderDate(draft.orderDate || '');
      setTrackingNumber(draft.trackingNumber || ''); setCourier(draft.courier || ''); setAmount(draft.amount || '');
      setPaymentMethod(draft.paymentMethod || ''); setEmailUsed(draft.emailUsed || ''); setShippingAddress(draft.shippingAddress || '');
      setPhoneNumber(draft.phoneNumber || ''); setNotes(draft.notes || '');
    }
  }, []);

  useEffect(() => {
    const draft = { storeName, orderId, orderDate, trackingNumber, courier, amount, paymentMethod, emailUsed, shippingAddress, phoneNumber, notes };
    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
  }, [storeName, orderId, orderDate, trackingNumber, courier, amount, paymentMethod, emailUsed, shippingAddress, phoneNumber, notes]);

  const clearFormAndDraft = () => {
    setStoreName(''); setOrderId(''); setOrderDate(''); setTrackingNumber(''); 
    setCourier(''); setAmount(''); setPaymentMethod(''); setEmailUsed(''); 
    setShippingAddress(''); setPhoneNumber(''); setNotes('');
    localStorage.removeItem(FORM_DRAFT_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in to create a purchase.');
      setIsLoading(false);
      return;
    }

    const { data: newPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        store_name: storeName, order_id: orderId, order_date: orderDate, user_id: user.id,
        amount: amount ? parseFloat(amount) : null, payment_method: paymentMethod, email_used: emailUsed,
        shipping_address: shippingAddress, phone_number: phoneNumber, notes: notes,
      })
      .select()
      .single();

    if (purchaseError) {
      alert('Error saving purchase: ' + purchaseError.message);
      setIsLoading(false);
      return;
    }

    // --- THIS IS THE NEW SAFETY CHECK ---
    if (!newPurchase) {
        alert('Failed to get new purchase details from the database.');
        setIsLoading(false);
        return;
    }

    if (trackingNumber && courier) { // 'newPurchase' is now guaranteed to exist here
      await supabase.from('shipments').insert({
        purchase_id: newPurchase.id,
        tracking_number: trackingNumber,
        courier: courier,
      });
    }
    
    const notificationMessage = `🆕 <b>New Purchase Saved!</b>\n--------------------------------------\n<b>Store:</b> ${storeName}\n<b>Order ID:</b> ${orderId}\n<b>Amount:</b> ${amount || 'N/A'}\n<b>Address:</b> ${shippingAddress}\n<b>Phone:</b> ${phoneNumber}\n<b>Status:</b> ⚪️ Pending Tracking`;
    await sendNotification(notificationMessage);

    setIsLoading(false);
    alert('Success! Purchase has been saved.');
    onSuccess();
    clearFormAndDraft();
  };

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-lg w-full">
      <h2 className="text-xl font-bold mb-4 text-text-light">Add New Purchase</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-text-muted">Store Name</label>
            <input type="text" id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" required disabled={isLoading} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-text-muted">Order ID</label>
            <input type="text" id="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" required disabled={isLoading} autoComplete="off" />
          </div>
        </div>
        <div>
            <label htmlFor="orderDate" className="block text-sm font-medium text-text-muted">Order Date</label>
            <input type="date" id="orderDate" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" required disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-text-muted">Amount</label>
                <input type="number" step="0.01" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading} />
            </div>
            <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-text-muted">Payment Method</label>
                <input type="text" id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading} />
            </div>
        </div>
        <div>
            <label htmlFor="emailUsed" className="block text-sm font-medium text-text-muted">Email Used</label>
            <input type="email" id="emailUsed" value={emailUsed} onChange={(e) => setEmailUsed(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading} />
        </div>
        <div>
            <label htmlFor="shippingAddress" className="block text-sm font-medium text-text-muted">Shipping Address</label>
            <textarea id="shippingAddress" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={3} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading}></textarea>
        </div>
        <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-text-muted">Phone Number</label>
            <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium text-text-muted">Tracking Number</label>
                <input type="text" id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading} autoComplete="off" />
            </div>
            <div>
                <label htmlFor="courier" className="block text-sm font-medium text-text-muted">Courier</label>
                <input type="text" id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading} />
            </div>
        </div>
        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-text-muted">Notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light focus:ring-accent-primary focus:border-accent-primary" disabled={isLoading}></textarea>
        </div>
        <button type="submit" className="w-full bg-accent-primary hover:opacity-90 text-background-dark font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Purchase'}
        </button>
      </form>
    </div>
  );
}