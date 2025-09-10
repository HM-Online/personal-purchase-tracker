'use client';

import { useEffect, useState } from 'react';

export type ClaimFormData = {
  reason: string;
  rma_number?: string | null;
  tracking_number_to_seller?: string | null;
  tracking_courier_to_seller?: string | null;   // NEW
  return_start_date?: string | null;            // NEW (ISO date string YYYY-MM-DD)
};

type ClaimModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClaimFormData) => void;
  existingClaim?: {
    reason?: string | null;
    rma_number?: string | null;
    tracking_number_to_seller?: string | null;
    tracking_courier_to_seller?: string | null;
    return_start_date?: string | null;
  } | null;
};

export default function ClaimModal({ isOpen, onClose, onSubmit, existingClaim }: ClaimModalProps) {
  const [reason, setReason] = useState('');
  const [rma, setRma] = useState('');
  const [tracking, setTracking] = useState('');
  const [courier, setCourier] = useState('');          // NEW
  const [returnStart, setReturnStart] = useState('');  // NEW (YYYY-MM-DD)

  useEffect(() => {
    if (existingClaim) {
      setReason(existingClaim.reason ?? '');
      setRma(existingClaim.rma_number ?? '');
      setTracking(existingClaim.tracking_number_to_seller ?? '');
      setCourier(existingClaim.tracking_courier_to_seller ?? '');
      setReturnStart(existingClaim.return_start_date ?? '');
    } else {
      setReason('');
      setRma('');
      setTracking('');
      setCourier('');
      setReturnStart('');
    }
  }, [existingClaim, isOpen]);

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      reason: reason.trim(),
      rma_number: rma.trim() || null,
      tracking_number_to_seller: tracking.trim() || null,
      tracking_courier_to_seller: courier.trim() || null,     // NEW
      return_start_date: returnStart || null,                  // NEW
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-dark border border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Edit Claim</h2>
          <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Reason for Claim</label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">RMA Number (if any)</label>
            <input
              value={rma}
              onChange={(e) => setRma(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
              placeholder="RMA123456"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Tracking Number (to Seller)</label>
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
                placeholder="1Zxxxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Tracking Courier (to Seller)</label>
              <input
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
                placeholder="UPS / FedEx / USPS"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Return Start Date</label>
            <input
              type="date"
              value={returnStart}
              onChange={(e) => setReturnStart(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg">
              Save Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
