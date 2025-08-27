'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// This is the new function that will call our backend notifier
async function sendNotification(message: string) {
  await fetch('/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
}

export default function PurchaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [storeName, setStoreName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        store_name: storeName,
        order_id: orderId,
        order_date: orderDate,
        user_id: user.id,
      })
      .select()
      .single();

    if (purchaseError) {
      alert('Error saving purchase: ' + purchaseError.message);
      setIsLoading(false);
      return;
    }

    if (trackingNumber && courier && newPurchase) {
      const { error: shipmentError } = await supabase.from('shipments').insert({
        purchase_id: newPurchase.id,
        tracking_number: trackingNumber,
        courier: courier,
      });

      if (shipmentError) {
        alert('Purchase saved, but failed to add shipment: ' + shipmentError.message);
      }
    }
    
    // --- THIS IS THE NEW PART ---
    // After everything is saved, format and send the notification.
    const notificationMessage = `
    🆕 <b>New Purchase Saved!</b>
    --------------------------------------
    <b>Store:</b> ${storeName}
    <b>Order ID:</b> ${orderId}
    <b>Date:</b> ${new Date(orderDate).toLocaleDateString()}
    <b>Status:</b> ⚪️ Pending Tracking
    `;
    await sendNotification(notificationMessage);
    // --- END OF NEW PART ---

    setIsLoading(false);
    alert('Success! Purchase has been saved.');
    onSuccess();
    setStoreName('');
    setOrderId('');
    setOrderDate('');
    setTrackingNumber('');
    setCourier('');
  };

  // The JSX part of the form is unchanged
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">Add New Purchase</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="storeName" className="block text-sm font-medium text-gray-300">Store Name</label>
          <input type="text" id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="orderId" className="block text-sm font-medium text-gray-300">Order ID</label>
          <input type="text" id="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="orderDate" className="block text-sm font-medium text-gray-300">Order Date</label>
          <input type="date" id="orderDate" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-300">Tracking Number (Optional)</label>
          <input type="text" id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="courier" className="block text-sm font-medium text-gray-300">Courier (Optional)</label>
          <input type="text" id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" disabled={isLoading} />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Purchase'}
        </button>
      </form>
    </div>
  );
}