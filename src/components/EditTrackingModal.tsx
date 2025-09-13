'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  isOpen: boolean;
  initialTrackingNumber?: string;
  initialCourier?: string;
  onClose: () => void;
  onSubmit: (data: { tracking_number: string; courier: string }) => void | Promise<void>;
};

const COURIER_OPTIONS = [
  'Mondial Relay',
  'UPS',
  'DHL',
  'FedEx',
  'Colissimo',
  'Other (Manual Enter)',
] as const;

export default function EditTrackingModal({
  isOpen,
  initialTrackingNumber = '',
  initialCourier = '',
  onClose,
  onSubmit,
}: Props) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [courierChoice, setCourierChoice] = useState<string>('');
  const [customCourier, setCustomCourier] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // initialize form when opened
  useEffect(() => {
    if (!isOpen) return;
    setTrackingNumber(initialTrackingNumber || '');
    // If initial courier matches known option, select it; otherwise "Other" + fill custom field
    const normalized = (initialCourier || '').trim();
    const match = COURIER_OPTIONS.find(
      (c) => c.toLowerCase() === normalized.toLowerCase()
    );
    if (match) {
      setCourierChoice(match);
      setCustomCourier('');
    } else {
      setCourierChoice('Other (Manual Enter)');
      setCustomCourier(normalized);
    }
    setSaving(false);
  }, [isOpen, initialTrackingNumber, initialCourier]);

  const finalCourier = useMemo(() => {
    return courierChoice === 'Other (Manual Enter)' ? (customCourier || '').trim() : courierChoice;
  }, [courierChoice, customCourier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      alert('Please enter a Tracking Number.');
      return;
    }
    if (!finalCourier) {
      alert('Please choose a courier or enter one manually.');
      return;
    }
    try {
      setSaving(true);
      await onSubmit({
        tracking_number: trackingNumber.trim(),
        courier: finalCourier,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => !saving && onClose()}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Tracking</h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-neutral-300 hover:text-white"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300/90 mb-1">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., 1Z999AA10123456784"
              className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300/90 mb-1">
              Courier
            </label>
            <select
              value={courierChoice}
              onChange={(e) => setCourierChoice(e.target.value)}
              className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-cyan-400 focus:ring-cyan-400"
            >
              <option value="" disabled>
                Select courier…
              </option>
              {COURIER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {courierChoice === 'Other (Manual Enter)' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300/90 mb-1">
                Enter Courier Name
              </label>
              <input
                type="text"
                value={customCourier}
                onChange={(e) => setCustomCourier(e.target.value)}
                placeholder="Type courier service name…"
                className="block w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-cyan-400"
              />
            </div>
          )}

          <div className="pt-2 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
