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

  // --- Edit/Delete state (unchanged logic) ---
  const [isEditing, setIsEditing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string>(shipment?.tracking_number ?? '');
  const [courier, setCourier] = useState<string>(shipment?.courier ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Helper function to format status text nicely
  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // --- Actions (unchanged logic) ---
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
      // Keep it simple/safe: reload to reflect everywhere
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

  // Small chip components for a cleaner header (UI only)
  const Chip = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-neutral-200">
      {icon ? <span className="text-cyan-300">{icon}</span> : null}
      <span className="font-medium truncate">{children}</span>
    </div>
  );

  const StatusPill = ({ label }: { label: string }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
      {label}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top: info + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: chips or edit form */}
        {!isEditing ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Chip icon={<span>#</span>}>
              {shipment.tracking_number || '—'}
            </Chip>
            <Chip icon={<span>🏷️</span>}>
              {shipment.courier || '—'}
            </Chip>
            <StatusPill label={formatStatus(shipment.status || 'in_transit')} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-white placeholder-neutral-500 focus:border-cyan-400 focus:ring-cyan-400"
                placeholder="e.g., 1Z999AA10123456784"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Courier</label>
              <input
                type="text"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-white placeholder-neutral-500 focus:border-cyan-400 focus:ring-cyan-400"
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
                className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 transition"
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
              className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/50"
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
      <div className="relative pl-5">
        {/* vertical line */}
        <div className="absolute left-1 top-0 h-full w-px bg-white/10" />
        {shipment.checkpoints && shipment.checkpoints.length > 0 ? (
          shipment.checkpoints.map((checkpoint: Checkpoint, index: number) => (
            <div key={index} className="relative mb-6">
              {/* dot */}
              <span className="absolute left-0 mt-1 flex h-3.5 w-3.5 translate-x-[-6px] items-center justify-center rounded-full bg-cyan-600 ring-4 ring-black/40" />
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <h3 className="text-sm font-semibold text-white">{checkpoint.description}</h3>
                {checkpoint.location && (
                  <p className="text-xs text-neutral-400">{checkpoint.location}</p>
                )}
                <time className="mt-1 block text-[11px] text-neutral-500">
                  {new Date(checkpoint.time).toLocaleString()}
                </time>
              </div>
            </div>
          ))
        ) : (
          <div className="relative mb-2">
            <span className="absolute left-0 mt-1 flex h-3.5 w-3.5 translate-x-[-6px] items-center justify-center rounded-full bg-cyan-600 ring-4 ring-black/40" />
            <div className="rounded-md border border-white/10 bg-white/5 p-3">
              <h3 className="text-sm font-semibold text-white">
                {formatStatus(shipment.status || 'in_transit')}
              </h3>
              <p className="text-xs text-neutral-400">
                This is the current status of the shipment. Live scan data will appear here once
                available.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
