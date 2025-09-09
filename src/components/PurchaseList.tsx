// src/components/PurchaseList.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Purchase } from '@/lib/types';

type PurchaseListProps = {
  purchases: Purchase[];
  onDelete: (purchaseId: string) => void;
};

// --- Helpers to derive a primary status (same concept as detail page) ---
function titleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

function getStatusForPurchase(p: Purchase): { label: string; tone: Tone } {
  const shipments: any[] = Array.isArray((p as any)?.shipments) ? (p as any).shipments : [];
  const refunds: any[] = Array.isArray((p as any)?.refunds) ? (p as any).refunds : [];

  // Refund-first: if a refund exists and isn't terminal, show "Refund in Progress"
  if (refunds.length > 0) {
    const r = (refunds[0]?.status || '').toLowerCase();
    const terminalRefund = new Set(['paid', 'approved', 'denied', 'completed', 'refunded', 'closed']);
    if (r && !terminalRefund.has(r)) {
      return { label: 'Refund in Progress', tone: 'warning' };
    }
  }

  // Shipment-based badge
  if (shipments.length > 0) {
    // Any delivered?
    if (shipments.some((s) => (s?.status || '').toLowerCase() === 'delivered')) {
      return { label: 'Delivered', tone: 'success' };
    }
    // Any exception/failed?
    if (shipments.some((s) => ['exception', 'failed_attempt'].includes((s?.status || '').toLowerCase()))) {
      return { label: 'Delivery Issue', tone: 'danger' };
    }
    // Any return in progress?
    if (shipments.some((s) => (s?.status || '').toLowerCase().startsWith('return'))) {
      return { label: 'Return in Progress', tone: 'warning' };
    }
    // Default for having a shipment
    const first = shipments[0];
    return { label: first?.status ? titleCase(first.status) : 'In Transit', tone: 'info' };
  }

  // No shipments
  return { label: 'No Shipment', tone: 'neutral' };
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  const map: Record<Tone, string> = {
    success: 'bg-green-500/15 text-green-300 border-green-400/20',
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/20',
    warning: 'bg-orange-500/15 text-orange-300 border-orange-400/20',
    danger: 'bg-red-500/15 text-red-300 border-red-400/20',
    neutral: 'bg-white/10 text-neutral-300 border-white/10',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${map[tone]}`}
    >
      {label}
    </span>
  );
}

export default function PurchaseList({ purchases, onDelete }: PurchaseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (purchases.length === 0) {
    return (
      <div className="text-center text-neutral-300/90 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-xl w-full shadow-md">
        <p>No purchases found.</p>
        <p className="text-sm">Try clearing your filters or adding a new purchase!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-white">Your Purchases</h2>
      <ul className="space-y-4">
        {purchases.map((purchase) => {
          const isExpanded = purchase.id === expandedId;
          const badge = getStatusForPurchase(purchase);

          return (
            <motion.li
              key={purchase.id}
              layout
              className={[
                "relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md overflow-hidden",
                "hover:shadow-[0_0_16px] hover:shadow-cyan-500/10 transition",
              ].join(" ")}
            >
              <div className="p-4">
                {/* Top row: left = basic info link, right = badge + actions */}
                <div className="flex justify-between items-start gap-3">
                  <Link href={`/purchase/${purchase.id}`} className="flex-grow min-w-0 group">
                    <p className="font-semibold text-lg text-white truncate group-hover:text-cyan-200 transition">
                      {purchase.store_name}
                    </p>
                    <p className="text-sm text-neutral-300/90 truncate">
                      Order ID: {purchase.order_id}
                    </p>
                    <p className="text-sm text-neutral-300/90">
                      Order Date: {new Date(purchase.order_date).toLocaleDateString()}
                    </p>
                  </Link>

                  <div className="flex items-start gap-2 flex-shrink-0 pl-2">
                    {/* Status badge */}
                    <Badge label={badge.label} tone={badge.tone} />

                    {/* Chevron + delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
                        className="p-1 text-neutral-300/90 hover:text-cyan-300"
                        aria-label="Toggle details"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <motion.svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          className="w-5 h-5"
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </motion.svg>
                      </button>

                      <button
                        onClick={() => onDelete(purchase.id)}
                        className="p-1 text-neutral-300/90 hover:text-red-400 font-bold text-xl leading-none"
                        aria-label="Delete purchase"
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                      className="border-t border-white/10 pt-4"
                    >
                      <div className="text-sm space-y-2 text-neutral-300/90">
                        {(purchase as any)?.amount != null && (
                          <p>
                            <strong className="text-neutral-200">Amount:</strong>{' '}
                            {Number((purchase as any).amount).toFixed(2)}
                          </p>
                        )}
                        {(purchase as any)?.payment_method && (
                          <p>
                            <strong className="text-neutral-200">Payment:</strong>{' '}
                            {(purchase as any).payment_method}
                          </p>
                        )}
                        {(purchase as any)?.email_used && (
                          <p>
                            <strong className="text-neutral-200">Email:</strong>{' '}
                            {(purchase as any).email_used}
                          </p>
                        )}
                        {(purchase as any)?.shipping_address && (
                          <p className="whitespace-pre-line">
                            <strong className="text-neutral-200">Address:</strong>{' '}
                            {(purchase as any).shipping_address}
                          </p>
                        )}
                        {(purchase as any)?.phone_number && (
                          <p>
                            <strong className="text-neutral-200">Phone:</strong>{' '}
                            {(purchase as any).phone_number}
                          </p>
                        )}
                        {(purchase as any)?.notes && (
                          <p className="whitespace-pre-line">
                            <strong className="text-neutral-200">Notes:</strong>{' '}
                            {(purchase as any).notes}
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
