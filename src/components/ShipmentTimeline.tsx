// src/components/ShipmentTimeline.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Shipment, Checkpoint } from '@/lib/types';

export default function ShipmentTimeline({ shipments }: { shipments: Shipment[] }) {
  if (!shipments || shipments.length === 0) {
    return <div className="text-neutral-400">No shipment information available for this purchase.</div>;
  }

  const shipment = shipments[0];

  // --- Edit/Delete state ---
  const [isEditing, setIsEditing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string>(shipment?.tracking_number ?? '');
  const [courier, setCourier] = useState<string>(shipment?.courier ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Helper function to format status text nicely
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // --- Actions ---
  const handleSave = async () => {
    if (!shipment) return;
    const id = (shipment as any)?.id;
    if (!id) {
      alert('Cannot update: missing shipment id.');
      return;
    }
    if (!trackingNumber.trim() || !courier.trim()) {
      alert('Please enter both Tracking Number and Courier.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('shipments')
        .update({
          tracking_number: trackingNumber.trim(),
          courier: courier.trim(),
        })
        .eq('id', id);

      if (error) throw error;
      setIsEditing(false);
      // Simple & safe: reload to reflect changes everywhere
      window.location.reload();
    } catch (err: any) {
      alert(`Failed to update tracking: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shipment) return;
    const id = (shipment as any)?.id;
    if (!id) {
      alert('Cannot delete: missing shipment id.');
      return;
    }
    const ok = window.confirm('Delete this tracking record? This action cannot be undone.');
    if (!ok) return;

    try {
      setDeleting(true);
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert(`Failed to delete tracking: ${err?.message || err}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Top info + actions */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {/* Left: tracking info OR edit form */}
        {!isEditing ? (
          <div>
            <p>
              <strong>Tracking Number:</strong> {shipment.tracking_number || '—'}
            </p>
            <p>
              <strong>Courier:</strong> {shipment.courier || '—'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 p-2 text-white placeholder-neutral-500 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="e.g., 1Z999AA10123456784"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Courier</label>
              <input
                type="text"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 p-2 text-white placeholder-neutral-500 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="e.g., DHL / UPS / FedEx"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTrackingNumber(shipment?.tracking_number ?? '');
                  setCourier(shipment?.courier ?? '');
                }}
                className="inline-flex items-center rounded-md border border-neutral-700 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-900 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Right: action buttons (only when not editing) */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center rounded-md border border-neutral-700 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-900 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/50"
            >
              Edit Tracking
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-red-500/70"
            >
              {deleting ? 'Deleting…' : 'Delete Tracking'}
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-neutral-700 ml-3 pt-2">
        {shipment.checkpoints && shipment.checkpoints.length > 0 ? (
          shipment.checkpoints.map((checkpoint: Checkpoint, index: number) => (
            <div key={index} className="mb-8 ml-6">
              <span className="absolute flex items-center justify-center w-6 h-6 bg-neutral-900 rounded-full -left-3 ring-8 ring-neutral-950" />
              <h3 className="font-semibold text-white">{checkpoint.description}</h3>
              <p className="text-sm text-neutral-400">{checkpoint.location}</p>
              <time className="block text-xs font-normal text-neutral-500">
                {new Date(checkpoint.time).toLocaleString()}
              </time>
            </div>
          ))
        ) : (
          <div className="mb-8 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-neutral-900 rounded-full -left-3 ring-8 ring-neutral-950">
              <svg
                className="w-2.5 h-2.5 text-cyan-300"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z" />
                <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
              </svg>
            </span>
            <h3 className="flex items-center mb-1 text-lg font-semibold text-white">
              {formatStatus(shipment.status || 'in_transit')}
            </h3>
            <p className="text-base font-normal text-neutral-400">
              This is the current status of the shipment. Live scan data will appear here once available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
