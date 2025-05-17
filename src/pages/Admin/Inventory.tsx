import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Warehouse, Truck, Package } from 'lucide-react';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { StockAdjustmentForm } from '@/components/inventory/StockAdjustmentForm';
import { InventoryHistory } from '@/components/inventory/InventoryHistory';
import { PurchaseOrderForm } from '@/components/inventory/PurchaseOrderForm';
import { SupplierForm } from '@/components/inventory/SupplierForm';
import { 
  getAllInventoryItems, 
  getInventoryItemById,
  getAllWarehouses,
  getAllSuppliers,
  getAllInventoryMovements,
  updateStockQuantity,
  savePurchaseOrder,
  saveSupplier
} from '@/services/inventoryService';
import {
  InventoryItem,
  Supplier,
  MovementType,
  InventoryMovement
} from '@/types/inventory';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';

const AdminInventory = () => {
  // State for inventory items
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  
  // State for selected item actions
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
  const [isItemHistoryOpen, setIsItemHistoryOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load all inventory data
  const loadData = () => {
    setInventoryItems(getAllInventoryItems());
    setWarehouses(getAllWarehouses());
    setSuppliers(getAllSuppliers());
    setMovements(getAllInventoryMovements());
  };
  
  // Handle stock adjustment
  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsStockAdjustmentOpen(true);
  };
  
  // Handle stock adjustment submission
  const handleStockAdjustmentSubmit = (
    itemId: string,
    quantity: number,
    type: MovementType,
    reason: string,
    notes?: string
  ) => {
    // Get the most current version of the item
    const currentItem = getInventoryItemById(itemId);
    if (!currentItem) return;
    
    try {
      // Update stock quantity
      updateStockQuantity(
        currentItem.productId,
        quantity,
        reason,
        type,
        'admin', // assuming admin user
        notes
      );
      
      // Reload data
      loadData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      // Handle error - show notification etc.
    }
  };
  
  // Handle create purchase order
  const handleCreatePurchaseOrder = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsPurchaseOrderOpen(true);
  };
  
  // Handle purchase order submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePurchaseOrderSubmit = (values: any) => {
    try {
      // Create purchase order items with subtotal and total calculations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderItems = values.items.map((item: any) => {
        const subtotal = item.quantity * item.unitCost;
        return {
          id: uuidv4(),
          productId: item.productId,
          sku: item.sku,
          quantity: item.quantity,
          receivedQuantity: 0,
          unitCost: item.unitCost,
          subtotal,
          total: subtotal, // Could add tax here if needed
        };
      });
      
      // Calculate total cost
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalCost = orderItems.reduce((sum: number, item: any) => sum + item.total, 0);
      
      // Save purchase order
      savePurchaseOrder({
        supplierId: values.supplierId,
        warehouseId: values.warehouseId,
        status: 'draft',
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: values.expectedDeliveryDate.toISOString(),
        totalCost,
        paymentStatus: 'pending',
        items: orderItems,
        notes: values.notes,
        createdBy: 'admin', // assuming admin user
      });
      
      // Reload data
      loadData();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      // Handle error - show notification etc.
    }
  };
  
  // Handle view history
  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsItemHistoryOpen(true);
  };
  
  // Handle add supplier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddSupplier = (values: any) => {
    try {
      // Save supplier
      saveSupplier({
        ...values,
        id: uuidv4(), // Generate ID for new supplier
      });
      
      // Reload suppliers
      setSuppliers(getAllSuppliers());
    } catch (error) {
      console.error('Error adding supplier:', error);
      // Handle error - show notification etc.
    }
  };
  
  // Filter movements for selected item
  const getItemMovements = () => {
    if (!selectedItem) return [];
    
    return movements.filter(m => m.inventoryItemId === selectedItem.id);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => setIsAddSupplierOpen(true)}
          >
            <Truck className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="inventory">
        <TabsList className="mb-4">
          <TabsTrigger value="inventory" className="flex items-center">
            <Package className="mr-2 h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" /> Suppliers
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center">
            <Warehouse className="mr-2 h-4 w-4" /> Warehouses
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" /> Movement History
          </TabsTrigger>
        </TabsList>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your inventory items, stock levels, and locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable 
                items={inventoryItems}
                warehouses={warehouses}
                onAdjustStock={handleAdjustStock}
                onCreatePurchaseOrder={handleCreatePurchaseOrder}
                onViewHistory={handleViewHistory}
                onEdit={() => {}} // TODO: Implement edit functionality
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>
                  Manage your inventory suppliers and vendor relationships
                </CardDescription>
              </div>
              <Button 
                className="flex items-center"
                onClick={() => setIsAddSupplierOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.code}</TableCell>
                        <TableCell>{supplier.contactPerson}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>
                          {supplier.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{supplier.leadTime || '-'} days</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No suppliers found. Add your first supplier to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Warehouses Tab */}
        <TabsContent value="warehouses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Warehouses</CardTitle>
                <CardDescription>
                  Manage your warehouses and inventory locations
                </CardDescription>
              </div>
              <Button className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Warehouse
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.length > 0 ? (
                    warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.code}</TableCell>
                        <TableCell>
                          {`${warehouse.address.city}, ${warehouse.address.state}`}
                        </TableCell>
                        <TableCell>{warehouse.contactPerson}</TableCell>
                        <TableCell>
                          {warehouse.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No warehouses found. Add your first warehouse to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Movement History Tab */}
        <TabsContent value="movements">
          <InventoryHistory movements={movements} />
        </TabsContent>
      </Tabs>
      
      {/* Stock Adjustment Form */}
      {selectedItem && (
        <StockAdjustmentForm
          item={selectedItem}
          isOpen={isStockAdjustmentOpen}
          onClose={() => setIsStockAdjustmentOpen(false)}
          onSubmit={handleStockAdjustmentSubmit}
        />
      )}
      
      {/* Purchase Order Form */}
      {isPurchaseOrderOpen && (
        <PurchaseOrderForm
          isOpen={isPurchaseOrderOpen}
          onClose={() => setIsPurchaseOrderOpen(false)}
          onSubmit={handlePurchaseOrderSubmit}
          suppliers={suppliers}
          warehouses={warehouses}
          inventoryItems={inventoryItems}
          defaultItem={selectedItem || undefined}
        />
      )}
      
      {/* Supplier Form */}
      <SupplierForm
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSubmit={handleAddSupplier}
      />
      
      {/* Item History Dialog */}
      {selectedItem && (
        <Dialog open={isItemHistoryOpen} onOpenChange={setIsItemHistoryOpen}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>History for {selectedItem.sku}</DialogTitle>
              <DialogDescription>
                View all inventory movements and transactions for this item
              </DialogDescription>
            </DialogHeader>
            <InventoryHistory 
              movements={getItemMovements()} 
              sku={selectedItem.sku}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminInventory; 