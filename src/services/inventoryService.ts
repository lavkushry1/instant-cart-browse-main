import { 
  InventoryItem, 
  InventoryMovement, 
  Warehouse, 
  Supplier, 
  PurchaseOrder,
  InventoryAlert,
  InventoryReport,
  MovementType,
  PurchaseOrderStatus,
  AlertType
} from '@/types/inventory';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const DEFAULT_WAREHOUSE: Warehouse = {
  id: 'wh-001',
  name: 'Main Warehouse',
  code: 'WH-MAIN',
  address: {
    street: '123 Storage Ave',
    city: 'Warehouse City',
    state: 'WH',
    zipCode: '12345',
    country: 'USA'
  },
  contactPerson: 'John Stockman',
  contactEmail: 'john@warehouse.com',
  contactPhone: '555-123-4567',
  isActive: true,
  isDefault: true
};

// Storage keys
const INVENTORY_ITEMS_KEY = 'instant-cart-inventory-items';
const INVENTORY_MOVEMENTS_KEY = 'instant-cart-inventory-movements';
const WAREHOUSES_KEY = 'instant-cart-warehouses';
const SUPPLIERS_KEY = 'instant-cart-suppliers';
const PURCHASE_ORDERS_KEY = 'instant-cart-purchase-orders';
const INVENTORY_ALERTS_KEY = 'instant-cart-inventory-alerts';

// Helper methods to load and save data
const loadData = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} data:`, error);
    return defaultValue;
  }
};

const saveData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} data:`, error);
  }
};

// Initialize warehouse if none exists
const initializeWarehouse = (): void => {
  const warehouses = loadData<Warehouse>(WAREHOUSES_KEY, []);
  if (warehouses.length === 0) {
    saveData<Warehouse>(WAREHOUSES_KEY, [DEFAULT_WAREHOUSE]);
  }
};

// Call this when the app loads
initializeWarehouse();

// ----------------------------------------
// Inventory Items Management
// ----------------------------------------

/**
 * Get all inventory items
 */
export const getAllInventoryItems = (): InventoryItem[] => {
  return loadData<InventoryItem>(INVENTORY_ITEMS_KEY, []);
};

/**
 * Get inventory item by ID
 */
export const getInventoryItemById = (id: string): InventoryItem | undefined => {
  const items = getAllInventoryItems();
  return items.find(item => item.id === id);
};

/**
 * Get inventory item by product ID
 */
export const getInventoryItemByProductId = (productId: string): InventoryItem | undefined => {
  const items = getAllInventoryItems();
  return items.find(item => item.productId === productId);
};

/**
 * Create or update inventory item
 */
export const saveInventoryItem = (item: Partial<InventoryItem> & { productId: string }): InventoryItem => {
  const items = getAllInventoryItems();
  const now = new Date().toISOString();
  
  // Check if item already exists
  const existingIndex = items.findIndex(i => (item.id && i.id === item.id) || i.productId === item.productId);
  
  if (existingIndex >= 0) {
    // Update existing item
    const updatedItem: InventoryItem = {
      ...items[existingIndex],
      ...item,
      availableQuantity: (item.quantity || items[existingIndex].quantity) - 
                         (item.reservedQuantity || items[existingIndex].reservedQuantity),
      lastUpdated: now,
      status: determineInventoryStatus({
        ...items[existingIndex],
        ...item
      })
    };
    
    items[existingIndex] = updatedItem;
    saveData<InventoryItem>(INVENTORY_ITEMS_KEY, items);
    
    // Check for low stock alerts
    checkAndCreateAlerts(updatedItem);
    
    return updatedItem;
  } else {
    // Create new item
    const defaultWarehouse = loadData<Warehouse>(WAREHOUSES_KEY, [DEFAULT_WAREHOUSE])[0];
    
    const newItem: InventoryItem = {
      id: uuidv4(),
      sku: item.sku || `SKU-${item.productId.substring(0, 8)}`,
      quantity: item.quantity || 0,
      reservedQuantity: item.reservedQuantity || 0,
      availableQuantity: (item.quantity || 0) - (item.reservedQuantity || 0),
      lowStockThreshold: item.lowStockThreshold || 5,
      reorderPoint: item.reorderPoint || 3,
      reorderQuantity: item.reorderQuantity || 10,
      warehouseId: item.warehouseId || defaultWarehouse.id,
      locationCode: item.locationCode,
      lastUpdated: now,
      status: determineInventoryStatus({
        quantity: item.quantity || 0,
        lowStockThreshold: item.lowStockThreshold || 5,
        reservedQuantity: item.reservedQuantity || 0
      } as InventoryItem),
      ...item
    };
    
    items.push(newItem);
    saveData<InventoryItem>(INVENTORY_ITEMS_KEY, items);
    
    // Check for low stock alerts
    checkAndCreateAlerts(newItem);
    
    return newItem;
  }
};

/**
 * Determine inventory status based on quantity and thresholds
 */
const determineInventoryStatus = (item: InventoryItem): 'in_stock' | 'low_stock' | 'out_of_stock' => {
  const availableQty = item.quantity - item.reservedQuantity;
  
  if (availableQty <= 0) {
    return 'out_of_stock';
  } else if (availableQty <= item.lowStockThreshold) {
    return 'low_stock';
  } else {
    return 'in_stock';
  }
};

/**
 * Update stock quantity
 */
export const updateStockQuantity = (
  productId: string, 
  quantityChange: number, 
  reason: string,
  movementType: MovementType,
  userId: string,
  referenceId?: string,
  notes?: string
): InventoryItem => {
  // Get inventory item
  const item = getInventoryItemByProductId(productId);
  
  if (!item) {
    throw new Error(`Inventory item for product ${productId} not found`);
  }
  
  // Update quantity
  const updatedItem = saveInventoryItem({
    ...item,
    quantity: item.quantity + quantityChange
  });
  
  // Record movement
  recordInventoryMovement({
    inventoryItemId: item.id,
    productId,
    type: movementType,
    quantity: Math.abs(quantityChange),
    reason,
    referenceId,
    notes,
    performedBy: userId
  });
  
  return updatedItem;
};

/**
 * Reserve stock for an order
 */
export const reserveStock = (
  productId: string, 
  quantity: number, 
  orderId: string,
  userId: string
): InventoryItem => {
  const item = getInventoryItemByProductId(productId);
  
  if (!item) {
    throw new Error(`Inventory item for product ${productId} not found`);
  }
  
  if (item.availableQuantity < quantity) {
    throw new Error(`Not enough available stock for product ${productId}`);
  }
  
  // Update reserved quantity
  const updatedItem = saveInventoryItem({
    ...item,
    reservedQuantity: item.reservedQuantity + quantity
  });
  
  // Record movement
  recordInventoryMovement({
    inventoryItemId: item.id,
    productId,
    type: 'stock_adjusted',
    quantity,
    reason: 'Stock reserved for order',
    referenceId: orderId,
    performedBy: userId
  });
  
  return updatedItem;
};

/**
 * Release reserved stock
 */
export const releaseReservedStock = (
  productId: string,
  quantity: number,
  orderId: string,
  userId: string,
  reason: string
): InventoryItem => {
  const item = getInventoryItemByProductId(productId);
  
  if (!item) {
    throw new Error(`Inventory item for product ${productId} not found`);
  }
  
  // Update reserved quantity
  const updatedItem = saveInventoryItem({
    ...item,
    reservedQuantity: Math.max(0, item.reservedQuantity - quantity)
  });
  
  // Record movement
  recordInventoryMovement({
    inventoryItemId: item.id,
    productId,
    type: 'stock_adjusted',
    quantity,
    reason,
    referenceId: orderId,
    performedBy: userId
  });
  
  return updatedItem;
};

/**
 * Fulfill order (remove reserved stock)
 */
export const fulfillOrder = (
  productId: string,
  quantity: number,
  orderId: string,
  userId: string
): InventoryItem => {
  const item = getInventoryItemByProductId(productId);
  
  if (!item) {
    throw new Error(`Inventory item for product ${productId} not found`);
  }
  
  if (item.reservedQuantity < quantity) {
    throw new Error(`Not enough reserved stock for product ${productId}`);
  }
  
  // Update quantities
  const updatedItem = saveInventoryItem({
    ...item,
    quantity: item.quantity - quantity,
    reservedQuantity: item.reservedQuantity - quantity
  });
  
  // Record movement
  recordInventoryMovement({
    inventoryItemId: item.id,
    productId,
    type: 'order_fulfilled',
    quantity,
    reason: 'Order fulfilled',
    referenceId: orderId,
    performedBy: userId
  });
  
  return updatedItem;
};

// ----------------------------------------
// Inventory Movements Management
// ----------------------------------------

/**
 * Get all inventory movements
 */
export const getAllInventoryMovements = (): InventoryMovement[] => {
  return loadData<InventoryMovement>(INVENTORY_MOVEMENTS_KEY, []);
};

/**
 * Get inventory movements by product ID
 */
export const getInventoryMovementsByProductId = (productId: string): InventoryMovement[] => {
  const movements = getAllInventoryMovements();
  return movements.filter(movement => movement.productId === productId);
};

/**
 * Record inventory movement
 */
export const recordInventoryMovement = (movement: Omit<InventoryMovement, 'id' | 'timestamp'>): InventoryMovement => {
  const movements = getAllInventoryMovements();
  
  const newMovement: InventoryMovement = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...movement
  };
  
  movements.push(newMovement);
  saveData<InventoryMovement>(INVENTORY_MOVEMENTS_KEY, movements);
  
  return newMovement;
};

// ----------------------------------------
// Warehouses Management
// ----------------------------------------

/**
 * Get all warehouses
 */
export const getAllWarehouses = (): Warehouse[] => {
  return loadData<Warehouse>(WAREHOUSES_KEY, [DEFAULT_WAREHOUSE]);
};

/**
 * Get warehouse by ID
 */
export const getWarehouseById = (id: string): Warehouse | undefined => {
  const warehouses = getAllWarehouses();
  return warehouses.find(warehouse => warehouse.id === id);
};

/**
 * Save warehouse
 */
export const saveWarehouse = (warehouse: Partial<Warehouse> & { name: string }): Warehouse => {
  const warehouses = getAllWarehouses();
  
  const existingIndex = warehouses.findIndex(w => 
    (warehouse.id && w.id === warehouse.id) || w.name === warehouse.name
  );
  
  if (existingIndex >= 0) {
    // Update existing warehouse
    warehouses[existingIndex] = {
      ...warehouses[existingIndex],
      ...warehouse
    };
  } else {
    // Create new warehouse
    const newWarehouse: Warehouse = {
      id: uuidv4(),
      code: warehouse.code || `WH-${warehouse.name.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 1000)}`,
      address: warehouse.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      contactPerson: warehouse.contactPerson || '',
      contactEmail: warehouse.contactEmail || '',
      contactPhone: warehouse.contactPhone || '',
      isActive: warehouse.isActive !== undefined ? warehouse.isActive : true,
      isDefault: warehouse.isDefault || false,
      ...warehouse
    };
    
    // If this is set as default, update other warehouses
    if (newWarehouse.isDefault) {
      warehouses.forEach(w => {
        if (w.id !== newWarehouse.id) {
          w.isDefault = false;
        }
      });
    }
    
    warehouses.push(newWarehouse);
  }
  
  saveData<Warehouse>(WAREHOUSES_KEY, warehouses);
  return warehouses.find(w => 
    (warehouse.id && w.id === warehouse.id) || w.name === warehouse.name
  ) as Warehouse;
};

// ----------------------------------------
// Suppliers Management
// ----------------------------------------

/**
 * Get all suppliers
 */
export const getAllSuppliers = (): Supplier[] => {
  return loadData<Supplier>(SUPPLIERS_KEY, []);
};

/**
 * Get supplier by ID
 */
export const getSupplierById = (id: string): Supplier | undefined => {
  const suppliers = getAllSuppliers();
  return suppliers.find(supplier => supplier.id === id);
};

/**
 * Save supplier
 */
export const saveSupplier = (supplier: Partial<Supplier> & { name: string }): Supplier => {
  const suppliers = getAllSuppliers();
  
  const existingIndex = suppliers.findIndex(s => 
    (supplier.id && s.id === supplier.id) || s.name === supplier.name
  );
  
  if (existingIndex >= 0) {
    // Update existing supplier
    suppliers[existingIndex] = {
      ...suppliers[existingIndex],
      ...supplier
    };
  } else {
    // Create new supplier
    const newSupplier: Supplier = {
      id: uuidv4(),
      code: supplier.code || `SUP-${Math.floor(Math.random() * 10000)}`,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      isActive: supplier.isActive !== undefined ? supplier.isActive : true,
      ...supplier
    };
    
    suppliers.push(newSupplier);
  }
  
  saveData<Supplier>(SUPPLIERS_KEY, suppliers);
  return suppliers.find(s => 
    (supplier.id && s.id === supplier.id) || s.name === supplier.name
  ) as Supplier;
};

// ----------------------------------------
// Purchase Orders Management
// ----------------------------------------

/**
 * Get all purchase orders
 */
export const getAllPurchaseOrders = (): PurchaseOrder[] => {
  return loadData<PurchaseOrder>(PURCHASE_ORDERS_KEY, []);
};

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = (id: string): PurchaseOrder | undefined => {
  const orders = getAllPurchaseOrders();
  return orders.find(order => order.id === id);
};

/**
 * Create or update purchase order
 */
export const savePurchaseOrder = (
  order: Partial<PurchaseOrder> & { supplierId: string; warehouseId: string }
): PurchaseOrder => {
  const orders = getAllPurchaseOrders();
  const now = new Date().toISOString();
  
  const existingIndex = orders.findIndex(o => order.id && o.id === order.id);
  
  if (existingIndex >= 0) {
    // Update existing order
    const updatedOrder: PurchaseOrder = {
      ...orders[existingIndex],
      ...order,
      updatedAt: now
    };
    
    orders[existingIndex] = updatedOrder;
    saveData<PurchaseOrder>(PURCHASE_ORDERS_KEY, orders);
    return updatedOrder;
  } else {
    // Create new order
    const newOrder: PurchaseOrder = {
      id: uuidv4(),
      status: 'draft',
      orderDate: now,
      expectedDeliveryDate: order.expectedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalCost: order.totalCost || 0,
      paymentStatus: order.paymentStatus || 'pending',
      items: order.items || [],
      createdBy: order.createdBy || 'system',
      createdAt: now,
      updatedAt: now,
      ...order
    };
    
    orders.push(newOrder);
    saveData<PurchaseOrder>(PURCHASE_ORDERS_KEY, orders);
    return newOrder;
  }
};

/**
 * Update purchase order status
 */
export const updatePurchaseOrderStatus = (
  orderId: string, 
  status: PurchaseOrderStatus,
  userId: string
): PurchaseOrder => {
  const order = getPurchaseOrderById(orderId);
  
  if (!order) {
    throw new Error(`Purchase order ${orderId} not found`);
  }
  
  const updatedOrder = savePurchaseOrder({
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    createdBy: userId
  });
  
  // If the order is received, update inventory
  if (status === 'fully_received' || status === 'partially_received') {
    // Process received items
    order.items.forEach(item => {
      const receivedQty = status === 'fully_received' ? 
        item.quantity : 
        item.receivedQuantity;
      
      if (receivedQty > 0) {
        try {
          updateStockQuantity(
            item.productId,
            receivedQty,
            'Stock received from purchase order',
            'stock_received',
            userId,
            orderId
          );
        } catch (error) {
          console.error(`Error updating stock for product ${item.productId}:`, error);
        }
      }
    });
    
    // If fully received, set delivery date
    if (status === 'fully_received') {
      updatedOrder.deliveredDate = new Date().toISOString();
      savePurchaseOrder(updatedOrder);
    }
  }
  
  return updatedOrder;
};

// ----------------------------------------
// Alerts Management
// ----------------------------------------

/**
 * Check and create alerts
 */
const checkAndCreateAlerts = (item: InventoryItem): void => {
  const alerts = loadData<InventoryAlert>(INVENTORY_ALERTS_KEY, []);
  const now = new Date().toISOString();
  
  // Check for low stock
  if (item.availableQuantity <= item.lowStockThreshold && item.availableQuantity > 0) {
    // Check if alert already exists
    const existingAlert = alerts.find(a => 
      a.productId === item.productId && 
      a.type === 'low_stock' && 
      a.status !== 'resolved'
    );
    
    if (!existingAlert) {
      alerts.push({
        id: uuidv4(),
        productId: item.productId,
        inventoryItemId: item.id,
        type: 'low_stock',
        message: `Product is low on stock. Available: ${item.availableQuantity}, Threshold: ${item.lowStockThreshold}`,
        status: 'active',
        createdAt: now,
        isRead: false
      });
    }
  }
  
  // Check for out of stock
  if (item.availableQuantity <= 0) {
    // Check if alert already exists
    const existingAlert = alerts.find(a => 
      a.productId === item.productId && 
      a.type === 'out_of_stock' && 
      a.status !== 'resolved'
    );
    
    if (!existingAlert) {
      alerts.push({
        id: uuidv4(),
        productId: item.productId,
        inventoryItemId: item.id,
        type: 'out_of_stock',
        message: `Product is out of stock.`,
        status: 'active',
        createdAt: now,
        isRead: false
      });
    }
  }
  
  // Check for reorder point
  if (item.availableQuantity <= item.reorderPoint) {
    // Check if alert already exists
    const existingAlert = alerts.find(a => 
      a.productId === item.productId && 
      a.type === 'reorder_point_reached' && 
      a.status !== 'resolved'
    );
    
    if (!existingAlert) {
      alerts.push({
        id: uuidv4(),
        productId: item.productId,
        inventoryItemId: item.id,
        type: 'reorder_point_reached',
        message: `Product has reached reorder point. Available: ${item.availableQuantity}, Reorder Point: ${item.reorderPoint}, Suggested Order Quantity: ${item.reorderQuantity}`,
        status: 'active',
        createdAt: now,
        isRead: false
      });
    }
  }
  
  // Save updates
  saveData<InventoryAlert>(INVENTORY_ALERTS_KEY, alerts);
};

/**
 * Get all inventory alerts
 */
export const getAllInventoryAlerts = (): InventoryAlert[] => {
  return loadData<InventoryAlert>(INVENTORY_ALERTS_KEY, []);
};

/**
 * Get active inventory alerts
 */
export const getActiveInventoryAlerts = (): InventoryAlert[] => {
  const alerts = getAllInventoryAlerts();
  return alerts.filter(alert => alert.status !== 'resolved');
};

/**
 * Update alert status
 */
export const updateAlertStatus = (alertId: string, status: 'active' | 'in_progress' | 'resolved'): InventoryAlert => {
  const alerts = getAllInventoryAlerts();
  
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }
  
  alert.status = status;
  if (status === 'resolved') {
    alert.resolvedAt = new Date().toISOString();
  }
  
  saveData<InventoryAlert>(INVENTORY_ALERTS_KEY, alerts);
  return alert;
};

/**
 * Mark alert as read
 */
export const markAlertAsRead = (alertId: string): InventoryAlert => {
  const alerts = getAllInventoryAlerts();
  
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }
  
  alert.isRead = true;
  saveData<InventoryAlert>(INVENTORY_ALERTS_KEY, alerts);
  return alert;
};

// ----------------------------------------
// Reports Management
// ----------------------------------------

/**
 * Generate inventory report
 */
export const generateInventoryReport = (
  name: string,
  type: 'stock_levels' | 'inventory_valuation' | 'movement_history' | 'low_stock' | 'slow_moving' | 'inventory_forecast' | 'custom',
  parameters: Record<string, any>,
  userId: string
): InventoryReport => {
  const now = new Date().toISOString();
  
  // Generate report data
  let reportData: any = {};
  
  switch (type) {
    case 'stock_levels':
      reportData = getAllInventoryItems();
      break;
    case 'low_stock':
      reportData = getAllInventoryItems().filter(item => item.status === 'low_stock' || item.status === 'out_of_stock');
      break;
    case 'movement_history':
      reportData = getAllInventoryMovements();
      if (parameters.productId) {
        reportData = reportData.filter((m: InventoryMovement) => m.productId === parameters.productId);
      }
      if (parameters.startDate && parameters.endDate) {
        reportData = reportData.filter((m: InventoryMovement) => {
          const movementDate = new Date(m.timestamp);
          return movementDate >= new Date(parameters.startDate) && movementDate <= new Date(parameters.endDate);
        });
      }
      break;
    // Add other report types as needed
    default:
      reportData = { error: 'Report type not implemented' };
  }
  
  // Create report record
  const reports = loadData<InventoryReport>('instant-cart-inventory-reports', []);
  
  const newReport: InventoryReport = {
    id: uuidv4(),
    name,
    type,
    parameters,
    createdBy: userId,
    createdAt: now,
    downloadUrl: `/reports/${type}-${now}.json` // This would be a real URL in a production system
  };
  
  reports.push(newReport);
  saveData<InventoryReport>('instant-cart-inventory-reports', reports);
  
  // In a real system, we would save the report data to a file or database
  console.log('Report data:', reportData);
  
  return newReport;
};

// ----------------------------------------
// Product Stock Status Utilities
// ----------------------------------------

/**
 * Get stock status for multiple products
 */
export const getProductsStockStatus = (productIds: string[]): Record<string, { 
  inStock: boolean, 
  quantity: number,
  availableQuantity: number,
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'
}> => {
  const items = getAllInventoryItems();
  const result: Record<string, any> = {};
  
  productIds.forEach(productId => {
    const item = items.find(i => i.productId === productId);
    
    if (item) {
      result[productId] = {
        inStock: item.availableQuantity > 0,
        quantity: item.quantity,
        availableQuantity: item.availableQuantity,
        status: item.status
      };
    } else {
      // No inventory record, assuming out of stock
      result[productId] = {
        inStock: false,
        quantity: 0,
        availableQuantity: 0,
        status: 'out_of_stock'
      };
    }
  });
  
  return result;
};

/**
 * Check if a product is in stock
 */
export const isProductInStock = (productId: string): boolean => {
  const item = getInventoryItemByProductId(productId);
  return item ? item.availableQuantity > 0 : false;
};

/**
 * Get available quantity for a product
 */
export const getProductAvailableQuantity = (productId: string): number => {
  const item = getInventoryItemByProductId(productId);
  return item ? item.availableQuantity : 0;
}; 