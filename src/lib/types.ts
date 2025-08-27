// src/lib/types.ts

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

export type Purchase = {
  id: string;
  created_at: string;
  store_name: string;
  order_id: string;
  order_date: string;
  user_id: string;
  shipments: Shipment[];
};