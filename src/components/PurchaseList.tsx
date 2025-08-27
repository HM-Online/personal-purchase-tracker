'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Purchase } from '../lib/types'; // Import our new central Purchase type

// Export the type so other files can use it
export type { Purchase };

export default function PurchaseList({ purchases }: { purchases: Purchase[] }) {
  // The state can still be 'any' for now, as the API response is complex
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  const handleTrack = async (trackingNumber: string, courier: string) => {
    setTrackingInfo(`Fetching data for ${trackingNumber}...`);
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
                          e.preventDefault();
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