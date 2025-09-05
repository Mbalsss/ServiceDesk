// types/equipment.ts
export interface Equipment {
  id: string;
  name: string;
  description?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  location?: string;
  assigned_to?: string;
  category?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  purchase_price?: number;
  current_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentFormData {
  name: string;
  description?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  location?: string;
  assigned_to?: string;
  category?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  purchase_price?: number;
  current_value?: number;
  notes?: string;
}

export type EquipmentStatus = 'active' | 'inactive' | 'maintenance' | 'retired';