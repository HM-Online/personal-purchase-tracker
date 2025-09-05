export type Checkpoint = {
  time: string;
  description: string;
  location: string;
};

export type Shipment = {
  id: string;
  purchase_id: string;
  tracking_number: string;
  courier: string;
  status: string;
  checkpoints: Checkpoint[];
};

export type Refund = {
    id: string;
    purchase_id: string;
    status: 'requested' | 'approved' | 'paid' | 'denied';
    created_at: string;
    approved_at: string | null;
    paid_at: string | null;
    amount: number | null;
    platform: string | null;
    reason: string | null;
    rma_number: string | null;
    refund_start_date: string | null;
    return_tracking_number: string | null;
    return_courier: string | null;
};

export type Claim = {
    id: string;
    purchase_id: string;
    status: 'initiated' | 'item_sent' | 'item_received_by_seller' | 'resolution_offered' | 'resolved_closed' | 'denied';
    created_at: string;
    updated_at: string;
    reason: string | null;
    rma_number: string | null;
    tracking_number_to_seller: string | null;
    tracking_number_from_seller: string | null;
    resolution_details: string | null;
};

// --- THIS IS THE CORRECTED TYPE ---
export type Purchase = {
  id: string;
  created_at: string;
  store_name: string;
  order_id: string;
  order_date: string;
  user_id: string;
  // All the detailed fields are now included
  amount: number | null;
  payment_method: string | null;
  email_used: string | null;
  shipping_address: string | null;
  phone_number: string | null;
  notes: string | null;
  // Nested types
  shipments: Shipment[];
  refunds: Refund[];
  claims: Claim[];
};