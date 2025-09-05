'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Purchase } from '@/lib/types';

type PurchaseListProps = {
  purchases: Purchase[];
  onDelete: (purchaseId: string) => void;
};

export default function PurchaseList({ purchases, onDelete }: PurchaseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (purchases.length === 0) {
    return (
      <div className="text-center text-text-muted bg-surface-dark p-6 rounded-lg w-full shadow-lg">
        <p>No purchases found.</p>
        <p className="text-sm">Try clearing your filters or adding a new purchase!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-text-light">Your Purchases</h2>
      <ul className="space-y-4">
        {purchases.map((purchase) => {
          const isExpanded = purchase.id === expandedId;
          const detailsId = `purchase-details-${purchase.id}`;

          return (
            <motion.li
              key={purchase.id}
              layout
              className="bg-surface-dark rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start gap-3">
                  {/* Left: primary info (readability polish) */}
                  <Link href={`/purchase/${purchase.id}`} className="flex-grow min-w-0">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-white truncate">
                        {purchase.store_name}
                      </p>

                      <p className="text-sm font-medium text-accent-primary truncate">
                        {purchase.order_id}
                      </p>

                      <p className="text-xs text-text-muted leading-snug">
                        Order Date: {new Date(purchase.order_date).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>

                  {/* Right: actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Expand/Collapse toggle with smooth CSS rotation */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
                      className="p-1 text-text-muted hover:text-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 rounded"
                      aria-label="Toggle details"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transform transition-transform duration-200 ease-in-out ${
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        }`}
                      >
                        {/* Chevron-down */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(purchase.id)}
                      className="p-1 text-text-muted hover:text-accent-danger font-bold text-xl leading-none focus:outline-none focus:ring-2 focus:ring-accent-danger/40 rounded"
                      aria-label="Delete purchase"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={detailsId}
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-gray-600 pt-4"
                    >
                      <div className="text-sm space-y-2 text-text-muted">
                        {purchase.amount !== null && purchase.amount !== undefined && (
                          <p>
                            <strong className="text-text-light">Amount:</strong>{' '}
                            {purchase.amount.toFixed(2)}
                          </p>
                        )}
                        {purchase.payment_method && (
                          <p>
                            <strong className="text-text-light">Payment:</strong>{' '}
                            {purchase.payment_method}
                          </p>
                        )}
                        {purchase.email_used && (
                          <p className="truncate">
                            <strong className="text-text-light">Email:</strong>{' '}
                            {purchase.email_used}
                          </p>
                        )}
                        {purchase.shipping_address && (
                          <p className="truncate">
                            <strong className="text-text-light">Address:</strong>{' '}
                            {purchase.shipping_address}
                          </p>
                        )}
                        {purchase.phone_number && (
                          <p className="truncate">
                            <strong className="text-text-light">Phone:</strong>{' '}
                            {purchase.phone_number}
                          </p>
                        )}
                        {purchase.notes && (
                          <p className="whitespace-pre-line">
                            <strong className="text-text-light">Notes:</strong>{' '}
                            {purchase.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
