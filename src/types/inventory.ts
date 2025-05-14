export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  warehouseId: string;
  locationCode?: string;
  lastUpdated: string;
  status: InventoryStatus;
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  referenceId?: string; // Order ID, Supplier ID, etc.
  notes?: string;
  performedBy: string;
  timestamp: string;
}

export type MovementType = 
  | 'stock_received' 
  | 'stock_adjusted'
  | 'order_fulfilled'
  | 'returned'
  | 'damaged'
  | 'transfer';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: WarehouseAddress;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface WarehouseAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  taxId?: string;
  isActive: boolean;
  paymentTerms?: string;
  leadTime?: number; // in days
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveredDate?: string;
  totalCost: number;
  paymentStatus: PaymentStatus;
  items: PurchaseOrderItem[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus = 
  | 'draft' 
  | 'sent_to_supplier' 
  | 'confirmed' 
  | 'partially_received' 
  | 'fully_received' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  subtotal: number;
  tax?: number;
  total: number;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  inventoryItemId: string;
  type: AlertType;
  message: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string;
  isRead: boolean;
}

export type AlertType = 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'reorder_point_reached' 
  | 'expiring_soon' 
  | 'inconsistency';

export type AlertStatus = 
  | 'active' 
  | 'in_progress' 
  | 'resolved';

export interface InventoryReport {
  id: string;
  name: string;
  type: ReportType;
  parameters: Record<string, any>;
  createdBy: string;
  createdAt: string;
  downloadUrl?: string;
  scheduleId?: string;
}

export type ReportType = 
  | 'stock_levels' 
  | 'inventory_valuation' 
  | 'movement_history' 
  | 'low_stock' 
  | 'slow_moving' 
  | 'inventory_forecast' 
  | 'custom'; 