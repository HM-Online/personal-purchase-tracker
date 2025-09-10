'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Purchase } from '@/lib/types';

type PurchaseListProps = {
  purchases: Purchase[];
  onDelete: (purchaseId: string) => void;
};

// Safe helpers
const str = (v: unknown) => (v ?? '').toString();
const lower = (v: unknown) => str(v).toLowerCase();

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

  const getShipmentBadge = (p: Purchase) => {
    const shipments: any[] = Array.isArray((p as any)?.shipments) ? (p as any).shipments : [];
    if (shipments.length === 0) return { label: 'No Shipment', tone: 'bg-gray-700 text-gray-200' };

    const s = lower(shipments[0]?.status);
    if (s === 'delivered') return { label: 'Delivered', tone: 'bg-emerald-700/70 text-emerald-100' };
    if (s === 'out_for_delivery' || s === 'in_transit') return { label: 'In Transit', tone: 'bg-cyan-700/70 text-cyan-100' };
    if (s === 'exception' || s === 'failed_attempt') return { label: 'Exception', tone: 'bg-red-700/70 text-red-100' };
    return { label: str(shipments[0]?.status).replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase()), tone: 'bg-slate-700/70 text-slate-100' };
  };

  const getRefundBadge = (p: Purchase) => {
    const refunds: any[] = Array.isArray((p as any)?.refunds) ? (p as any).refunds : [];
    if (refunds.length === 0) return null;
    const s = lower(refunds[0]?.status);
    if (['paid', 'completed', 'approved', 'resolved', 'refunded', 'closed'].includes(s)) {
      return { label: s === 'paid' ? 'Refund Paid' : 'Refund Complete', tone: 'bg-emerald-700/70 text-emerald-100' };
    }
    return { label: 'Refund in Progress', tone: 'bg-amber-700/70 text-amber-100' };
  };

  // Warranty badge (claims)
  const getClaimBadge = (p: Purchase) => {
    const claims: any[] = Array.isArray((p as any)?.claims) ? (p as any).claims : [];
    if (claims.length === 0) return null;
    const s = lower(claims[0]?.status);
    if (['resolved_closed', 'closed', 'resolved'].includes(s)) {
      return { label: 'Warranty Closed', tone: 'bg-emerald-700/70 text-emerald-100' };
    }
    // anything not closed => in progress
    return { label: 'Warranty In Progress', tone: 'bg-orange-700/70 text-orange-100' };
  };

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
                      Order Date: {purchase.order_date ? new Date(purchase.order_date).toLocaleDateString() : '-'}
                    </p>
                  </Link>

                  <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                    {/* badges */}
                    {ship && <span className={`px-2 py-1 rounded-full text-xs font-medium ${ship.tone}`}>{ship.label}</span>}
                    {refd && <span className={`px-2 py-1 rounded-full text-xs font-medium ${refd.tone}`}>{refd.label}</span>}
                    {warr && <span className={`px-2 py-1 rounded-full text-xs font-medium ${warr.tone}`}>{warr.label}</span>}

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
                        {amount && <p><strong>Amount:</strong> {amount}</p>}
                        {(purchase as any)?.payment_method && <p><strong>Payment:</strong> {(purchase as any).payment_method}</p>}
                        {(purchase as any)?.email_used && <p><strong>Email:</strong> {(purchase as any).email_used}</p>}
                        {(purchase as any)?.shipping_address && <p><strong>Address:</strong> {(purchase as any).shipping_address}</p>}
                        {(purchase as any)?.phone_number && <p><strong>Phone:</strong> {(purchase as any).phone_number}</p>}
                        {(purchase as any)?.notes && <p><strong>Notes:</strong> {(purchase as any).notes}</p>}
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
