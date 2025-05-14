import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Filter, Edit, Trash2, Eye, ArrowUpDown, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';
import { Order, OrderStatus, GetOrdersOptionsBE, OrderUpdateData } from '@/services/orderService'; // Backend types

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// Define callable functions
let getAllOrdersAdminCF: any;
let updateOrderStatusAdminCF: any;
let deleteOrderAdminCF: any; // Assuming a generic delete, or could be admin specific
// let getOrderByIdAdminCF: any; // For detailed view, if needed beyond list display

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllOrdersAdminCF = httpsCallable(functionsClient, 'orders-getAllOrdersAdminCF');
    updateOrderStatusAdminCF = httpsCallable(functionsClient, 'orders-updateOrderStatusCF');
    deleteOrderAdminCF = httpsCallable(functionsClient, 'orders-deleteOrderCF'); // Assuming simple delete for now
    // getOrderByIdAdminCF = httpsCallable(functionsClient, 'orders-getOrderByIdCF');
  } catch (error) { console.error("AdminOrders: Error preparing httpsCallable functions:", error); }
}

// Mock for Cloud Function calls
const callOrderFunctionMock = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING Cloud Function call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'orders-getAllOrdersAdminCF') {
        const mockOrders: Order[] = [
            { id: 'ord123', customerEmail: 'user1@example.com', customerName: 'User One', total: 150, status: 'Pending', paymentStatus: 'Paid', createdAt: new Date().toISOString(), items: [], shippingAddress: {} as any, subtotal: 150, cartDiscountAmount:0, shippingCost:0, taxAmount:0, grandTotal: 150, paymentMethod:'card', orderStatus: 'Pending', updatedAt: new Date().toISOString() },
            { id: 'ord456', customerEmail: 'user2@example.com', customerName: 'User Two', total: 250, status: 'Shipped', paymentStatus: 'Paid', createdAt: new Date(Date.now() - 86400000).toISOString(), items:[], shippingAddress: {} as any, subtotal:250, cartDiscountAmount:0, shippingCost:0, taxAmount:0, grandTotal:250, paymentMethod:'upi', orderStatus: 'Shipped', updatedAt: new Date().toISOString() },
        ];
        return { data: { success: true, orders: mockOrders, totalCount: mockOrders.length } };
    }
    if (name === 'orders-updateOrderStatusCF') return { data: { success: true, order: { id: payload.orderId, status: payload.newStatus, ...payload } } };
    if (name === 'orders-deleteOrderCF') return { data: { success: true, message: 'Order deleted (mock)' } };
    return { data: { success: false, error: 'Unknown mock order function' } };
};

const formatDate = (dateInput: any) => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const getStatusBadge = (status: OrderStatus) => { /* ... as before ... */ return <Badge>{status}</Badge>};
const getPaymentBadge = (status: string) => { /* ... as before ... */ return <Badge variant="secondary">{status}</Badge>};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortField, setSortField] = useState<keyof Order | string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Processing'); // Default for update dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For details view
  
  const [dialogsOpen, setDialogsOpen] = useState({ delete: false, statusUpdate: false, details: false });

  const fetchOrders = useCallback(async (options: GetOrdersOptionsBE = {}) => {
    setIsLoading(true);
    try {
      const effectiveOptions = { ...options, orderStatus: statusFilter === 'all' ? undefined : statusFilter };
      const result = getAllOrdersAdminCF 
        ? await getAllOrdersAdminCF(effectiveOptions) 
        : await callOrderFunctionMock('orders-getAllOrdersAdminCF', effectiveOptions);
      
      if (result.data.success && result.data.orders) {
        setOrders(result.data.orders);
      } else {
        toast.error(result.data.error || 'Failed to load orders');
        setOrders([]);
      }
    } catch (error: any) { toast.error(`Failed to load orders: ${error.message}`); setOrders([]); }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Filtering and Sorting logic (client-side for now on fetched data)
  const processedOrders = useMemo(() => {
    let filtered = [...orders];
    if (searchQuery.trim() !== '') {
      const lcQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(lcQuery) || 
        (o as any).customerName?.toLowerCase().includes(lcQuery) || // Assuming customerName exists
        o.customerEmail.toLowerCase().includes(lcQuery)
      );
    }
    // Sorting
    filtered.sort((a,b) => { /* ... existing sort logic ... */ return 0; });
    return filtered;
  }, [orders, searchQuery, sortField, sortDirection]);

  const handleSort = (field: keyof Order | string) => { /* ... as before ... */ };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete || !deleteOrderAdminCF) { toast.error("Function not ready or order not selected."); return; }
    try {
      const result = await deleteOrderAdminCF({ orderId: orderToDelete.id });
      if (result.data.success) {
        toast.success('Order deleted successfully');
        fetchOrders(); // Re-fetch to update list
      } else { toast.error(result.data.error || 'Failed to delete order'); }
    } catch (error: any) { toast.error(`Failed to delete order: ${error.message}`); }
    setDialogsOpen(prev => ({...prev, delete: false})); setOrderToDelete(null);
  };

  const handleStatusUpdateConfirm = async () => {
    if (!orderToUpdate || !updateOrderStatusAdminCF) { toast.error("Function not ready or order not selected."); return; }
    try {
      const result = await updateOrderStatusAdminCF({ orderId: orderToUpdate.id, newStatus });
      if (result.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders(); // Re-fetch
      } else { toast.error(result.data.error || 'Failed to update order status'); }
    } catch (error: any) { toast.error(`Failed to update order status: ${error.message}`); }
    setDialogsOpen(prev => ({...prev, statusUpdate: false})); setOrderToUpdate(null);
  };
  
  // UI Openers
  const openDeleteDialog = (order: Order) => { setOrderToDelete(order); setDialogsOpen(prev => ({...prev, delete: true})); };
  const openStatusUpdateDialog = (order: Order) => { setOrderToUpdate(order); setNewStatus(order.orderStatus); setDialogsOpen(prev => ({...prev, statusUpdate: true})); };
  const openDetailsDialog = (order: Order) => { setSelectedOrder(order); setDialogsOpen(prev => ({...prev, details: true})); };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading orders...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Orders</CardTitle>
            <CardDescription>Manage customer orders and track order status.</CardDescription>
          </CardHeader>
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatus | 'all')} className="px-6">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Pending">Pending</TabsTrigger>
              <TabsTrigger value="Processing">Processing</TabsTrigger>
              {/* ... other status tabs ... */}
            </TabsList>
          </Tabs>
          <CardContent>
            <div className="mb-6"><Input placeholder="Search by Order ID, Customer..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
            {processedOrders.length === 0 ? <p>No orders match filters.</p> : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader> {/* ... Table Headers with Sort ... */} </TableHeader>
                  <TableBody>
                    {processedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{(order as any).customerName || order.customerEmail}</TableCell>
                        <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                        <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                        <TableCell>₹{order.grandTotal.toFixed(2)}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(order)}><Eye size={16}/></Button>
                          <Button variant="ghost" size="sm" onClick={() => openStatusUpdateDialog(order)}><Edit size={16}/></Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => openDeleteDialog(order)}><Trash2 size={16}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Delete Dialog */}
        <Dialog open={dialogsOpen.delete} onOpenChange={(isOpen) => setDialogsOpen(prev => ({...prev, delete: isOpen}))}>
            <DialogContent> {/* ... Delete Dialog Content ... */} 
                <DialogFooter><Button variant="outline" onClick={() => setDialogsOpen(prev => ({...prev, delete: false}))}>Cancel</Button><Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        {/* Status Update Dialog */}
        <Dialog open={dialogsOpen.statusUpdate} onOpenChange={(isOpen) => setDialogsOpen(prev => ({...prev, statusUpdate: isOpen}))}>
            <DialogContent> 
                <DialogHeader><DialogTitle>Update Order Status for #{orderToUpdate?.id}</DialogTitle></DialogHeader>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.values(OrderStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                <DialogFooter><Button variant="outline" onClick={() => setDialogsOpen(prev => ({...prev, statusUpdate: false}))}>Cancel</Button><Button onClick={handleStatusUpdateConfirm}>Update Status</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        {/* Order Details Dialog (simplified content) */}
        <Dialog open={dialogsOpen.details} onOpenChange={(isOpen) => setDialogsOpen(prev => ({...prev, details: isOpen}))}>
            <DialogContent className="max-w-3xl">
                 <DialogHeader><DialogTitle>Order Details #{selectedOrder?.id}</DialogTitle></DialogHeader>
                 {selectedOrder && <pre>{JSON.stringify(selectedOrder, null, 2)}</pre>}
            </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
