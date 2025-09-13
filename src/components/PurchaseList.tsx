'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Purchase } from '@/lib/types';

type PurchaseListProps = {
  purchases: Purchase[];
  onDelete: (purchaseId: string) => void;
};

// ---- Safe helpers -----------------------------------------------------------
const str = (v: unknown) => (v ?? '').toString();
const lower = (v: unknown) => str(v).toLowerCase();

// Title case for statuses like "in_transit"
const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

// Tone classes (match your palette)
const TONES = {
  neutral: 'bg-slate-700/70 text-slate-100',
  info: 'bg-cyan-700/70 text-cyan-100',
  success: 'bg-emerald-700/70 text-emerald-100',
  warning: 'bg-amber-700/70 text-amber-100',
  danger: 'bg-red-700/70 text-red-100',
  gray: 'bg-gray-700 text-gray-200',
} as const;

type Badge = { label: string; tone: string };

// ---- Badge computation ------------------------------------------------------

// Shipment badge: prefer first shipment (your current layout uses [0])
function getShipmentBadge(p: Purchase): Badge {
  const shipments: any[] = Array.isArray((p as any)?.shipments) ? (p as any).shipments : [];
  if (shipments.length === 0) return { label: 'No Shipment', tone: TONES.gray };

  const s = lower(shipments[0]?.status);
  if (s === 'delivered') return { label: 'Delivered', tone: TONES.success };
  if (s === 'out_for_delivery' || s === 'in_transit') return { label: 'In Transit', tone: TONES.info };
  if (s === 'exception' || s === 'failed_attempt') return { label: 'Exception', tone: TONES.danger };
  if (s.startsWith('return')) return { label: titleCase(s), tone: TONES.warning };

  return { label: titleCase(str(shipments[0]?.status)), tone: TONES.neutral };
}

// Refund badge (handles multiple refunds)
function getRefundBadge(p: Purchase): Badge | null {
  const refunds: any[] = Array.isArray((p as any)?.refunds) ? (p as any).refunds : [];
  if (refunds.length === 0) return null;

  const terminal = new Set(['paid', 'completed', 'approved', 'resolved', 'refunded', 'closed']);
  // If ANY refund is still not terminal -> in progress
  const anyInProgress = refunds.some((r) => !terminal.has(lower(r?.status)));
  if (anyInProgress) return { label: 'Refund in Progress', tone: TONES.warning };

  // Else show complete
  const anyPaid = refunds.some((r) => lower(r?.status) === 'paid');
  if (anyPaid) return { label: 'Refund Paid', tone: TONES.success };

  return { label: 'Refund Complete', tone: TONES.success };
}

// Claim badge (handles multiple claims)
function getClaimBadge(p: Purchase): Badge | null {
  const claims: any[] = Array.isArray((p as any)?.claims) ? (p as any).claims : [];
  if (claims.length === 0) return null;

  const closed = new Set(['resolved_closed', 'closed', 'resolved']);
  const anyOpen = claims.some((c) => !closed.has(lower(c?.status)));
  if (anyOpen) return { label: 'Warranty In Progress', tone: TONES.warning };

  return { label: 'Warranty Closed', tone: TONES.success };
}

export default function PurchaseList({ purchases, onDelete }: PurchaseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!purchases || purchases.length === 0) {
    return (
      <div className="text-center text-text-muted bg-surface-dark p-6 rounded-lg w-full shadow-lg">
        <p>No purchases found.</p>
        <p className="text-sm">Try clearing your filters or adding a new purchase!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ul className="space-y-4">
        {purchases.map((purchase) => {
          const isExpanded = purchase.id === expandedId;

          const ship = getShipmentBadge(purchase);
          const refd = getRefundBadge(purchase);
          const warr = getClaimBadge(purchase);

          // Safe numbers
          const amountRaw = (purchase as any)?.amount;
          const amount =
            typeof amountRaw === 'number'
              ? amountRaw.toFixed(2)
              : amountRaw
              ? Number(amountRaw).toFixed(2)
              : null;

          return (
            <motion.li
              key={purchase.id}
              layout
              className="bg-surface-dark rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <Link href={`/purchase/${purchase.id}`} className="flex-grow min-w-0">
                    <p className="font-bold text-lg text-text-light truncate">{purchase.store_name}</p>
                    <p className="text-sm text-text-muted truncate">Order ID: {purchase.order_id}</p>
                    <p className="text-sm text-text-muted">
                      Order Date:{' '}
                      {purchase.order_date ? new Date(purchase.order_date).toLocaleDateString() : '-'}
                    </p>
                  </Link>

                  <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                    {/* Badges */}
                    {ship && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ship.tone}`}>
                        {ship.label}
                      </span>
                    )}
                    {refd && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${refd.tone}`}>
                        {refd.label}
                      </span>
                    )}
                    {warr && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${warr.tone}`}>
                        {warr.label}
                      </span>
                    )}

                    {/* expand/collapse */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
                      className="p-1 text-text-muted hover:text-accent-primary"
                      aria-label="Toggle details"
                    >
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </motion.svg>
                    </button>

                    {/* delete */}
                    <button
                      onClick={() => onDelete(purchase.id)}
                      className="p-1 text-text-muted hover:text-accent-danger font-bold text-xl leading-none"
                      aria-label="Delete purchase"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-gray-600 pt-4"
                    >
                      <div className="text-sm space-y-2 text-text-muted">
                        {amount && (
                          <p>
                            <strong>Amount:</strong> {amount}
                          </p>
                        )}
                        {(purchase as any)?.payment_method && (
                          <p>
                            <strong>Payment:</strong> {(purchase as any).payment_method}
                          </p>
                        )}
                        {(purchase as any)?.email_used && (
                          <p>
                            <strong>Email:</strong> {(purchase as any).email_used}
                          </p>
                        )}
                        {(purchase as any)?.shipping_address && (
                          <p>
                            <strong>Address:</strong> {(purchase as any).shipping_address}
                          </p>
                        )}
                        {(purchase as any)?.phone_number && (
                          <p>
                            <strong>Phone:</strong> {(purchase as any).phone_number}
                          </p>
                        )}
                        {(purchase as any)?.notes && (
                          <p>
                            <strong>Notes:</strong> {(purchase as any).notes}
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
