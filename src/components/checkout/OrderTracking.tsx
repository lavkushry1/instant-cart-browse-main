// src/components/checkout/OrderTracking.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Order, OrderStatus } from '@/services/orderService'; // Assuming Order type is available
import { Loader2, AlertCircle, Package, Truck, Home, CheckCircle } from 'lucide-react';

// Firebase Client SDK imports
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

let getOrderByIdCF: HttpsCallable<{ orderId: string }, HttpsCallableResult<{ success: boolean; order?: Order; error?: string }>> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    // Ensure this callable function name matches your deployed Cloud Function
    getOrderByIdCF = httpsCallable(functionsClient, 'orders-getOrderByIdCF');
    console.log("OrderTracking: Live httpsCallable for getOrderByIdCF created.");
  } catch (error) {
    console.error("OrderTracking: Error preparing getOrderByIdCF httpsCallable:", error);
  }
} else {
    console.warn("OrderTracking: Firebase functions client not available. Order details will be mocked or fail.");
}

// Fallback mock
const fallbackGetOrderById = async (orderId: string): Promise<HttpsCallableResult<{success: boolean; order?: Order; error?: string}>> => {
    console.warn(`MOCK getOrderByIdCF for ${orderId}`);
    await new Promise(r => setTimeout(r, 500));
    if (orderId.startsWith("ORD")) { // Simulate finding an order
        return { data: { success: true, order: { 
            id: orderId, 
            orderStatus: 'Shipped', 
            // Add other necessary mock Order fields for display
            customerEmail: 'mock@example.com',
            shippingAddress: {firstName: 'Mock', lastName:'User', address:'123 Mock St', city:'Mockville', state:'MS', zipCode:'00000', email:'', phone:''},
            items: [{productId:'p1', productName:'Mock Item', quantity:1, unitPrice:10, finalUnitPrice:10, lineItemTotal:10}],
            subtotal:10, cartDiscountAmount:0, shippingCost:5, taxAmount:1, grandTotal:16,
            paymentMethod: 'card', paymentStatus: 'Paid',
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
        } as unknown as Order } };
    }
    return { data: { success: false, error: "Mock: Order not found" } };
};

interface OrderTrackingProps {
  orderId: string | null; // Can be null initially
}

const trackingStatuses: { id: OrderStatus; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'Pending', label: 'Order Placed', description: 'Your order has been received.', icon: Package },
  { id: 'Processing', label: 'Processing', description: "We're preparing your order.", icon: Loader2 }, // Loader2 might need animate-spin
  { id: 'Shipped', label: 'Shipped', description: 'Your order is on its way.', icon: Truck },
  // { id: 'OutForDelivery', label: 'Out for Delivery', description: 'Arriving soon!', icon: Truck }, // Consider if this is a distinct status from BE
  { id: 'Delivered', label: 'Delivered', description: 'Your order has arrived!', icon: Home },
  { id: 'Cancelled', label: 'Cancelled', description: 'Your order has been cancelled.', icon: AlertCircle },
  { id: 'PaymentFailed', label: 'Payment Failed', description: 'There was an issue with your payment.', icon: AlertCircle },
  // Add other statuses like Refunded if needed
];

const OrderTracking = ({ orderId }: OrderTrackingProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');

  const fetchOrderDetails = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fn = getOrderByIdCF || (() => fallbackGetOrderById(id));
      const result = await fn({ orderId: id });
      if (result.data.success && result.data.order) {
        setOrder(result.data.order);
        // Mock estimated delivery based on order creation or shipped date
        const createDate = new Date(result.data.order.createdAt?.toDate ? result.data.order.createdAt.toDate() : result.data.order.createdAt);
        const delivery = new Date(createDate);
        delivery.setDate(createDate.getDate() + (result.data.order.orderStatus === 'Shipped' || result.data.order.orderStatus === 'Delivered' ? 3 : 5));
        setEstimatedDelivery(delivery.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      } else {
        setError(result.data.error || 'Order not found or could not be loaded.');
        setOrder(null);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch order details.');
      console.error("Error fetching order details:", e);
      setOrder(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setIsLoading(false);
      setError("No order ID provided for tracking.");
    }
  }, [orderId, fetchOrderDetails]);

  if (isLoading) return <div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading order tracking...</div>;
  if (error) return <div className="p-6 text-center text-red-500"><AlertCircle className="inline mr-2"/>{error}</div>;
  if (!order) return <div className="p-6 text-center text-muted-foreground">Order details not available.</div>;

  const currentStatusIndex = trackingStatuses.findIndex(s => s.id === order.orderStatus);
  const progressPercentage = currentStatusIndex >=0 ? ((currentStatusIndex + 1) / trackingStatuses.filter(s => !['Cancelled', 'PaymentFailed'].includes(s.id)).length) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Order Tracking</CardTitle>
        <CardDescription>Order ID: <span className="font-mono">{order.id}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Status: <span className="text-blue-600 font-semibold">{order.orderStatus}</span></p>
            {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'PaymentFailed' && estimatedDelivery && (
              <p className="text-sm text-muted-foreground">Est. Delivery: {estimatedDelivery}</p>
            )}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-4">
          {trackingStatuses.map((status, index) => {
            const isActive = status.id === order.orderStatus;
            const isCompleted = currentStatusIndex >= index && !['Cancelled', 'PaymentFailed'].includes(status.id) && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'PaymentFailed';
            const Icon = status.icon;

            if (['Cancelled', 'PaymentFailed'].includes(order.orderStatus) && order.orderStatus !== status.id) {
                return null; // Don't show other statuses if order is cancelled or payment failed, only the final one.
            }

            return (
              <div key={status.id} className={`flex items-start space-x-3 p-3 rounded-md ${
                isActive ? 'bg-blue-50 border border-blue-200' : ''
              }`}>
                <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted && status.id !== order.orderStatus ? <CheckCircle size={16}/> : <Icon size={16} className={isActive && status.id === 'Processing' ? 'animate-spin' : ''}/>}
                </div>
                <div>
                  <div className={`font-medium ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'}`}>{status.label}</div>
                  <p className="text-sm text-muted-foreground">{status.description}</p>
                  {status.id === 'Shipped' && (order.trackingNumber || order.shippingCarrier) && (isActive || isCompleted) && (
                    <p className="text-xs mt-1 text-gray-500">
                      {order.shippingCarrier && <span>Carrier: {order.shippingCarrier} | </span>}
                      {order.trackingNumber && <span>Tracking: {order.trackingNumber}</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Can add more details like items summary here if needed */}
      </CardContent>
    </Card>
  );
};

export default OrderTracking;
