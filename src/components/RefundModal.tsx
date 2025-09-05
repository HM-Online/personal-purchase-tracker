'use client';

import { useState, useEffect } from 'react';
import type { Refund } from '@/lib/types';

// THE FIX: We add the missing date properties here
export type RefundFormData = {
  amount: number | null;
  platform: string;
  reason: string;
  rma_number: string;
  refund_start_date: string;
  approved_at: string | null;
  paid_at: string | null;
  return_tracking_number: string;
  return_courier: string;
};

type RefundModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: RefundFormData) => void;
  existingRefund?: Refund | null;
};

export default function RefundModal({ isOpen, onClose, onSubmit, existingRefund }: RefundModalProps) {
  const [amount, setAmount] = useState('');
  const [platform, setPlatform] = useState('');
  const [reason, setReason] = useState('');
  const [rmaNumber, setRmaNumber] = useState('');
  const [refundStartDate, setRefundStartDate] = useState('');
  const [approvedAt, setApprovedAt] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [returnTrackingNumber, setReturnTrackingNumber] = useState('');
  const [returnCourier, setReturnCourier] = useState('');

  useEffect(() => {
    const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    if (existingRefund) {
      setAmount(existingRefund.amount?.toString() || '');
      setPlatform(existingRefund.platform || '');
      setReason(existingRefund.reason || '');
      setRmaNumber(existingRefund.rma_number || '');
      setRefundStartDate(formatDateForInput(existingRefund.refund_start_date || existingRefund.created_at));
      setApprovedAt(formatDateForInput(existingRefund.approved_at));
      setPaidAt(formatDateForInput(existingRefund.paid_at));
      setReturnTrackingNumber(existingRefund.return_tracking_number || '');
      setReturnCourier(existingRefund.return_courier || '');
    } else {
      setAmount(''); setPlatform(''); setReason(''); setRmaNumber(''); 
      setRefundStartDate(new Date().toISOString().split('T')[0]); 
      setApprovedAt(''); setPaidAt('');
      setReturnTrackingNumber(''); setReturnCourier('');
    }
  }, [isOpen, existingRefund]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: amount ? parseFloat(amount) : null,
      platform,
      reason,
      rma_number: rmaNumber,
      refund_start_date: refundStartDate,
      approved_at: approvedAt || null,
      paid_at: paidAt || null,
      return_tracking_number: returnTrackingNumber,
      return_courier: returnCourier,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
      <div className="bg-surface-dark p-6 rounded-lg shadow-2xl w-full max-w-lg z-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-light">{existingRefund ? 'Edit Refund' : 'Start a New Refund'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-light text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-text-muted">Amount</label>
              <input type="number" step="0.01" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
            </div>
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-text-muted">Payment Method</label>
               <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light">
                <option value="">Select...</option>
                <option value="Original Payment">Original Payment</option>
                <option value="Card">Card</option>
                <option value="Gift Balance">Gift Balance</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-text-muted">Reason for Refund</label>
            <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rmaNumber" className="block text-sm font-medium text-text-muted">RMA Number</label>
              <input type="text" id="rmaNumber" value={rmaNumber} onChange={(e) => setRmaNumber(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
            </div>
            <div>
              <label htmlFor="refundStartDate" className="block text-sm font-medium text-text-muted">Refund Start Date</label>
              <input type="date" id="refundStartDate" value={refundStartDate} onChange={(e) => setRefundStartDate(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-base font-semibold text-text-light mb-2">Return Shipment Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="returnTrackingNumber" className="block text-sm font-medium text-text-muted">Return Tracking Number</label>
                  <input type="text" id="returnTrackingNumber" value={returnTrackingNumber} onChange={(e) => setReturnTrackingNumber(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
                </div>
                <div>
                  <label htmlFor="returnCourier" className="block text-sm font-medium text-text-muted">Return Courier</label>
                  <input type="text" id="returnCourier" value={returnCourier} onChange={(e) => setReturnCourier(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
                </div>
            </div>
          </div>
          {existingRefund && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
              <div>
                <label htmlFor="approvedAt" className="block text-sm font-medium text-text-muted">Approved Date</label>
                <input type="date" id="approvedAt" value={approvedAt} onChange={(e) => setApprovedAt(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
              </div>
              <div>
                <label htmlFor="paidAt" className="block text-sm font-medium text-text-muted">Paid Date</label>
                <input type="date" id="paidAt" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="mt-1 block w-full bg-background-dark border-gray-600 rounded-md p-2 text-text-light" />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="bg-accent-primary hover:opacity-90 text-background-dark font-bold py-2 px-4 rounded-lg">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}