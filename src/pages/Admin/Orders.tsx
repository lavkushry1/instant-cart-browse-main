import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Filter, Edit, Trash2, Eye, ArrowUpDown, X, FileText, Loader2, ShoppingBag, Printer, StickyNote } from 'lucide-react'; // Added Printer, StickyNote
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea for notes
import { Label } from '@/components/ui/label'; // Added Label for notes
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
  const [internalNote, setInternalNote] = useState(''); // State for new internal note


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
        <Dialog open={dialogsOpen.details} onOpenChange={(isOpen) => { setDialogsOpen(p => ({...p, details: isOpen})); if (!isOpen) setInternalNote(''); }}>
          <DialogContent className="max-w-3xl"> {/* Increased width for better layout */}
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.id.substring(0,8)}...</DialogTitle>
              <DialogDescription>
                Date: {selectedOrder ? formatDate(selectedOrder.createdAt) : 'N/A'} | Status: {selectedOrder ? selectedOrder.orderStatus : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-3"> {/* Added padding and scroll */}
                {/* Customer and Shipping Info */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Customer & Shipping</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Customer:</strong> {(selectedOrder as any).customerName || selectedOrder.customerEmail}</p>
                      <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                      <p><strong>Shipping Address:</strong></p>
                      <address className="not-italic">
                        {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}<br />
                        {selectedOrder.shippingAddress.address}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                        {selectedOrder.shippingAddress.country || 'N/A'}
                      </address>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Order Items ({selectedOrder.items.length})</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map(item => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.finalUnitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.lineItemTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-right font-bold mt-2">Grand Total: ₹{selectedOrder.grandTotal.toFixed(2)}</div>
                  </CardContent>
                </Card>

                {/* Internal Order Notes */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center"><StickyNote className="mr-2 h-5 w-5" />Internal Order Notes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                      {/* Placeholder for existing notes - In a real app, these would be fetched and mapped */}
                      <p>No notes yet.</p>
                      {/* Example of how notes might look:
                      <div className="border-b pb-2 mb-2">
                        <p className="font-medium">Admin User A - 2024-05-20 10:30 AM</p>
                        <p>Customer called to confirm shipping address.</p>
                      </div>
                      */}
                    </div>
                    <div>
                      <Label htmlFor="internal-note" className="sr-only">Add New Note</Label>
                      <Textarea 
                        id="internal-note"
                        placeholder="Add an internal note for this order (e.g., special handling instructions, customer communication log)..." 
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (internalNote.trim()) {
                          toast.success('Note saved (demo)');
                          // In a real app, you would save the note here.
                          // For demo, we could add it to a local state if we wanted to show it immediately above.
                          setInternalNote(''); // Clear textarea after "saving"
                        } else {
                          toast.error('Note cannot be empty.');
                        }
                      }}
                    >
                      <StickyNote className="mr-2 h-4 w-4" /> Save Note
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => toast.info('Printing invoice (demo)...')}
                    className="flex-1"
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast.info('Printing packing slip (demo)...')}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Print Packing Slip
                  </Button>
                </div>

              </div>
            )}
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setDialogsOpen(p => ({...p, details: false}))}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
export default AdminOrders;
