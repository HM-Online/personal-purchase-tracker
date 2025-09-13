'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Shipment, Checkpoint } from '@/lib/types';
import EditTrackingModal from './EditTrackingModal';
import { toast } from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';

export default function ShipmentTimeline({ shipments }: { shipments: Shipment[] }) {
  if (!shipments || shipments.length === 0) {
    return <div className="text-neutral-400">No shipment information available for this purchase.</div>;
  }

  const shipment = shipments[0];

  // UI state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Actions
  const doDelete = async () => {
    if (!shipment) return;
    const id = (shipment as any)?.id;
    if (!id) {
      toast.error('Cannot delete: missing shipment id.');
      return;
    }
    try {
      setDeleting(true);
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tracking deleted');
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete tracking');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleSaveFromModal = async (data: { tracking_number: string; courier: string }) => {
    const id = (shipment as any)?.id;
    if (!id) {
      toast.error('Cannot update: missing shipment id.');
      return;
    }
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          tracking_number: data.tracking_number,
          courier: data.courier,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Tracking updated');
      setIsEditOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update tracking');
    }
  };

  // Small chip components
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
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Chip icon={<span>#</span>}>{shipment.tracking_number || '—'}</Chip>
          <Chip icon={<span>🏷️</span>}>{shipment.courier || '—'}</Chip>
          <StatusPill label={formatStatus(shipment.status || 'in_transit')} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 transition-shadow hover:shadow-[0_0_8px] hover:shadow-cyan-500/50"
          >
            Edit Tracking
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-shadow hover:shadow-[0_0_8px] hover:shadow-red-500/70"
          >
            {deleting ? 'Deleting…' : 'Delete Tracking'}
          </button>
        </div>
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

      {/* Modals */}
      <EditTrackingModal
        isOpen={isEditOpen}
        initialTrackingNumber={shipment?.tracking_number || ''}
        initialCourier={shipment?.courier || ''}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSaveFromModal}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete tracking?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
        processing={deleting}
      />
    </div>
  );
}
