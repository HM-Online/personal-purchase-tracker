'use client';

import { useState } from 'react';
import Link from 'next/link'; // 1. We import the Link component

export type Purchase = {
  id: string;
  created_at: string;
  store_name: string;
  order_id: string;
  order_date: string;
  user_id: string;
  shipments: {
    tracking_number: string;
    courier: string;
  }[];
};

export default function PurchaseList({ purchases }: { purchases: Purchase[] }) {
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  const handleTrack = async (trackingNumber: string, courier: string) => {
    setTrackingInfo(`Fetching data for ${trackingNumber}...`);
    // ... (rest of the function is the same, so I'm omitting it for clarity)
    // You can just paste the whole code block.
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_number: trackingNumber, courier: courier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch tracking info.');
      console.log('Tracking data received:', data);
      setTrackingInfo(data);
    } catch (error: any) {
      console.error(error);
      setTrackingInfo(`Error: ${error.message}`);
    }
  };

  if (purchases.length === 0) {
    return <p className="text-gray-400">No purchases yet. Add one above!</p>;
  }

  return (
    <div className="w-full max-w-lg mt-8">
      <h2 className="text-xl font-bold mb-4">Your Purchases</h2>
      <ul className="space-y-4">
        {purchases.map((purchase) => (
          // 2. We wrap the list item content with the Link component
          <li key={purchase.id} className="bg-gray-800 rounded-lg shadow hover:bg-gray-700 transition-colors duration-200">
            <Link href={`/purchase/${purchase.id}`} className="block p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{purchase.store_name}</p>
                  <p className="text-sm text-gray-400">Order ID: {purchase.order_id}</p>
                  <p className="text-sm text-gray-400">Order Date: {new Date(purchase.order_date).toLocaleDateString()}</p>
                </div>
                {purchase.shipments && purchase.shipments.length > 0 && (
                  <button 
                      onClick={(e) => { 
                          e.preventDefault(); // Prevent link navigation when clicking the button
                          handleTrack(purchase.shipments[0].tracking_number, purchase.shipments[0].courier);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm z-10"
                  >
                      Track
                  </button>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {trackingInfo && (
        <div className="mt-6 p-4 bg-gray-900 rounded">
            <h3 className="font-bold mb-2">Tracking Result:</h3>
            <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(trackingInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}