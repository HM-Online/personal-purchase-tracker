'use client';

import { useState, useEffect } from 'react';
import type { Claim } from '@/lib/types';

// Define the shape of the data that the form will submit
export type ClaimFormData = {
  reason: string;
  rma_number: string;
  tracking_number_to_seller: string;
};

// Define the props that the parent component will pass to this modal
type ClaimModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ClaimFormData) => void;
  existingClaim?: Claim | null; // For editing later
};

export default function ClaimModal({ isOpen, onClose, onSubmit, existingClaim }: ClaimModalProps) {
  // State for each of our form fields
  const [reason, setReason] = useState('');
  const [rmaNumber, setRmaNumber] = useState('');
  const [trackingToSeller, setTrackingToSeller] = useState('');

  useEffect(() => {
    if (existingClaim) {
      // Logic to pre-fill the form when editing (for the future)
      setReason(existingClaim.reason || '');
      setRmaNumber(existingClaim.rma_number || '');
      setTrackingToSeller(existingClaim.tracking_number_to_seller || '');
    } else {
      // Reset the form when creating a new claim
      setReason('');
      setRmaNumber('');
      setTrackingToSeller('');
    }
  }, [isOpen, existingClaim]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      reason,
      rma_number: rmaNumber,
      tracking_number_to_seller: trackingToSeller,
    });
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      {/* Modal Panel */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md z-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{existingClaim ? 'Edit Claim' : 'Start a New Warranty Claim'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-300">Reason for Claim</label>
            <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2" required />
          </div>
          <div>
            <label htmlFor="rmaNumber" className="block text-sm font-medium text-gray-300">RMA Number (if any)</label>
            <input type="text" id="rmaNumber" value={rmaNumber} onChange={(e) => setRmaNumber(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2" />
          </div>
          <div>
            <label htmlFor="trackingToSeller" className="block text-sm font-medium text-gray-300">Tracking Number (to Seller)</label>
            <input type="text" id="trackingToSeller" value={trackingToSeller} onChange={(e) => setTrackingToSeller(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Save Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}