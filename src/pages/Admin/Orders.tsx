import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Filter, Edit, Trash2, Eye, ArrowUpDown, X, FileText, Loader2, ShoppingBag } from 'lucide-react'; // Added ShoppingBag
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
import { Order, OrderStatus, GetOrdersOptionsBE, OrderUpdateData } from '@/services/orderService'; 

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

// Define direct response types for Cloud Functions
interface GetAllOrdersAdminResponse { success: boolean; orders?: Order[]; totalCount?: number; error?: string; }
interface UpdateOrderStatusAdminResponse { success: boolean; order?: Order; error?: string; }
interface DeleteOrderAdminResponse { success: boolean; message?: string; error?: string; }

let getAllOrdersAdminCF: HttpsCallable<GetOrdersOptionsBE | undefined, GetAllOrdersAdminResponse> | undefined;
let updateOrderStatusAdminCF: HttpsCallable<{ orderId: string; newStatus: OrderStatus; trackingNumber?: string; shippingCarrier?: string }, UpdateOrderStatusAdminResponse> | undefined;
let deleteOrderAdminCF: HttpsCallable<{ orderId: string }, DeleteOrderAdminResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllOrdersAdminCF = httpsCallable(functionsClient, 'orders-getAllOrdersAdminCF');
    updateOrderStatusAdminCF = httpsCallable(functionsClient, 'orders-updateOrderStatusCF');
    deleteOrderAdminCF = httpsCallable(functionsClient, 'orders-deleteOrderCF');
    console.log("AdminOrders: Live httpsCallable references created.");
  } catch (error) { 
    console.error("AdminOrders: Error preparing httpsCallable functions:", error);
    toast.error("Error initializing connection to order service.");
  }
} else {
    console.warn("AdminOrders: Firebase functions client not available. Operations will use mocks or fail.");
}

// Fallback mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fallbackOrderCall = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING Order CF call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'getAllOrdersAdminCF') return { data: { success: true, orders: [], totalCount: 0 } };
    if (name === 'updateOrderStatusCF') return { data: { success: true, order: { id: payload.orderId, orderStatus: payload.newStatus } } };
    if (name === 'deleteOrderCF') return { data: { success: true, message: 'Order deleted (mock)' } };
    return { data: { success: false, error: 'Unknown mock order function' } };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDate = (dateInput: any): string => { /* ... */ return new Date(dateInput?.toDate ? dateInput.toDate() : dateInput).toLocaleString(); };
const getStatusBadge = (status: OrderStatus) => { /* ... */ return <Badge>{status}</Badge>; };
const getPaymentBadge = (status: string) => { /* ... */ return <Badge variant="secondary">{status}</Badge>; };

// Define order statuses for select dropdown
const ALL_ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded', 'PaymentFailed'];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  // ... other states: sortField, sortDirection, dialogsOpen, orderToDelete, orderToUpdate, newStatus, selectedOrder
  const [dialogsOpen, setDialogsOpen] = useState({ delete: false, statusUpdate: false, details: false });
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Processing');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);


  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const options: GetOrdersOptionsBE = { orderStatus: statusFilter === 'all' ? undefined : statusFilter, sortBy: 'createdAt', sortOrder: 'desc' };
    try {
      const fn = getAllOrdersAdminCF || ((opts: GetOrdersOptionsBE | undefined) => fallbackOrderCall('getAllOrdersAdminCF', opts));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await fn(options);
      const responseData = result.data as GetAllOrdersAdminResponse;

      if (responseData.success && responseData.orders) setOrders(responseData.orders);
      else { toast.error(responseData.error || 'Failed to load orders'); setOrders([]); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Failed to load orders: ' + e.message); setOrders([]); }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const processedOrders = useMemo(() => { /* ... client side search/sort for now ... */ return orders; }, [orders /*, sortField, sortDirection*/]);

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    const fn = deleteOrderAdminCF || (() => fallbackOrderCall('deleteOrderCF', { orderId: orderToDelete.id }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await fn({ orderId: orderToDelete.id });
      const responseData = result.data as DeleteOrderAdminResponse;

      if (responseData.success) { toast.success('Order deleted!'); fetchOrders(); }
      else toast.error(responseData.error || 'Delete failed.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Delete error: ' + e.message); }
    setDialogsOpen(prev => ({...prev, delete: false})); setOrderToDelete(null);
  };

  const handleStatusUpdateConfirm = async () => {
    if (!orderToUpdate) return;
    const fn = updateOrderStatusAdminCF || (() => fallbackOrderCall('updateOrderStatusCF', { orderId: orderToUpdate!.id, newStatus }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await fn({ orderId: orderToUpdate!.id, newStatus });
      const responseData = result.data as UpdateOrderStatusAdminResponse;

      if (responseData.success) { toast.success('Status updated to ' + newStatus); fetchOrders(); }
      else toast.error(responseData.error || 'Update failed.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Update error: ' + e.message); }
    setDialogsOpen(prev => ({...prev, statusUpdate: false})); setOrderToUpdate(null);
  };

  const openDeleteDialog = (order: Order) => { setOrderToDelete(order); setDialogsOpen(p => ({...p, delete: true})); };
  const openStatusUpdateDialog = (order: Order) => { setOrderToUpdate(order); setNewStatus(order.orderStatus); setDialogsOpen(p => ({...p, statusUpdate: true})); };
  const openDetailsDialog = (order: Order) => { setSelectedOrder(order); setDialogsOpen(p => ({...p, details: true})); };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="container py-10">
        <Card>
          <CardHeader><CardTitle className="text-2xl font-bold">Orders</CardTitle><CardDescription>Manage customer orders.</CardDescription></CardHeader>
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatus | 'all')} className="px-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 md:grid-cols-7 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              {ALL_ORDER_STATUSES.map(s => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <CardContent>
            <div className="mb-6"><Input placeholder="Search by Order ID, Customer Email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
            {processedOrders.length === 0 ? <p className="text-center py-4">No orders found.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{processedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.substring(0,8)}...</TableCell>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <TableCell>{(order as any).customerName || order.customerEmail}</TableCell>
                    <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                    <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                    <TableCell>₹{order.grandTotal.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetailsDialog(order)}><Eye size={16}/></Button>
                      <Button variant="ghost" size="icon" onClick={() => openStatusUpdateDialog(order)}><Edit size={16}/></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => openDeleteDialog(order)}><Trash2 size={16}/></Button>
                    </TableCell>
                  </TableRow>))}
                </TableBody>
              </Table>)}
          </CardContent>
        </Card>
        {/* Dialogs */}
        <Dialog open={dialogsOpen.delete} onOpenChange={(isOpen) => setDialogsOpen(p => ({...p, delete: isOpen}))}>
          <DialogContent><DialogHeader><DialogTitle>Delete Order #{orderToDelete?.id.substring(0,8)}</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setDialogsOpen(p=>({...p,delete:false}))}>Cancel</Button><Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button></DialogFooter></DialogContent>
        </Dialog>
        <Dialog open={dialogsOpen.statusUpdate} onOpenChange={(isOpen) => setDialogsOpen(p => ({...p, statusUpdate: isOpen}))}>
          <DialogContent>
            <DialogHeader><DialogTitle>Update Status for #{orderToUpdate?.id.substring(0,8)}</DialogTitle></DialogHeader>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ALL_ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <DialogFooter className="mt-4"><Button variant="outline" onClick={()=>setDialogsOpen(p=>({...p,statusUpdate:false}))}>Cancel</Button><Button onClick={handleStatusUpdateConfirm}>Update</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={dialogsOpen.details} onOpenChange={(isOpen) => setDialogsOpen(p => ({...p, details: isOpen}))}>
          <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Order #{selectedOrder?.id.substring(0,8)}</DialogTitle></DialogHeader>{selectedOrder && <pre className="text-xs overflow-auto p-2 bg-gray-50 rounded max-h-[60vh]">{JSON.stringify(selectedOrder, null, 2)}</pre>}</DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
export default AdminOrders;
