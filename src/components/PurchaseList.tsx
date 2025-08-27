'use client';

import Link from 'next/link';
import type { Purchase } from '../lib/types';

// Export the type so other files can use it
export type { Purchase };

export default function PurchaseList({ purchases }: { purchases: Purchase[] }) {

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
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}