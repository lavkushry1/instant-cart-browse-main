// src/components/checkout/OrderTracking.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Order, OrderStatus } from '@/services/orderService';
import { Loader2, AlertCircle, Package, Truck, Home, CheckCircle, MapPin, CalendarDays } from 'lucide-react';

interface OrderTrackingProps {
  orderDetails: Order | null;
}

const trackingStatuses: { id: OrderStatus | string; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'Pending', label: 'Order Placed', description: 'Received and awaiting processing.', icon: Package },
  { id: 'Processing', label: 'Processing', description: "Preparing your order for shipment.", icon: Loader2 },
  { id: 'Shipped', label: 'Shipped', description: 'On its way to you.', icon: Truck },
  { id: 'Delivered', label: 'Delivered', description: 'Successfully delivered!', icon: Home },
  { id: 'Cancelled', label: 'Order Cancelled', description: 'This order has been cancelled.', icon: AlertCircle },
  { id: 'PaymentFailed', label: 'Payment Failed', description: 'Payment issue with this order.', icon: AlertCircle },
  { id: 'Refunded', label: 'Order Refunded', description: 'This order has been refunded.', icon: AlertCircle },
];

interface ShipmentHistoryEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

const generateMockShipmentHistory = (order: Order): ShipmentHistoryEvent[] => {
  if (!order || !order.createdAt) return [];
  const history: ShipmentHistoryEvent[] = [];
  const orderDate = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt.toDate ? order.createdAt.toDate() : new Date();

  history.push({ timestamp: orderDate, status: "Order Placed", location: "Warehouse, Origin City", description: "Order confirmation received." });

  if (order.orderStatus === 'Processing' || order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
    const processingDate = new Date(orderDate);
    processingDate.setHours(orderDate.getHours() + 2); // 2 hours later
    history.push({ timestamp: processingDate, status: "Processing", location: "Warehouse, Origin City", description: "Items picked and packed." });
  }
  if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
    const shippedDate = new Date(orderDate);
    shippedDate.setDate(orderDate.getDate() + 1); // 1 day later
    shippedDate.setHours(9);
    history.push({ 
        timestamp: shippedDate, 
        status: "Shipped", 
        location: "Origin Hub, Origin City", 
        description: `Package dispatched. Carrier: ${order.shippingCarrier || 'DemoTrans'}, Tracking: ${order.trackingNumber || 'NA'}` 
    });
    const transitDate = new Date(shippedDate);
    transitDate.setDate(shippedDate.getDate() + 1); // Next day
    transitDate.setHours(14);
    history.push({ timestamp: transitDate, status: "In Transit", location: "Destination Hub, Destination City", description: "Arrived at sort facility near you." });
  }
  if (order.orderStatus === 'Delivered') {
    const deliveredDate = new Date(orderDate);
    deliveredDate.setDate(orderDate.getDate() + (order.shippingCarrier === 'Express' ? 2 : 3)); // 2-3 days later
    deliveredDate.setHours(11);
    history.push({ timestamp: deliveredDate, status: "Delivered", location: `${order.shippingAddress.city}, ${order.shippingAddress.state}`, description: "Package delivered successfully." });
  }
  return history.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()); // Show newest first
};

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderDetails }) => {
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistoryEvent[]>([]);

  useEffect(() => {
    if (orderDetails) {
      const createDate = typeof orderDetails.createdAt === 'string' 
        ? new Date(orderDetails.createdAt) 
        : orderDetails.createdAt.toDate ? orderDetails.createdAt.toDate() : new Date();
      const delivery = new Date(createDate);
      let deliveryDays = 5;
      if (orderDetails.orderStatus === 'Shipped') deliveryDays = 3;
      if (orderDetails.orderStatus === 'Delivered') deliveryDays = 0;
      delivery.setDate(createDate.getDate() + deliveryDays);
      setEstimatedDelivery(delivery.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
      setShipmentHistory(generateMockShipmentHistory(orderDetails));
    }
  }, [orderDetails]);

  if (!orderDetails) return <Card className="w-full max-w-2xl mx-auto"><CardHeader><CardTitle>Order Tracking</CardTitle></CardHeader><CardContent><p>No order details.</p></CardContent></Card>;

  const order = orderDetails;
  const linearStatuses = trackingStatuses.filter(s => !['Cancelled', 'PaymentFailed', 'Refunded'].includes(s.id));
  const currentStatusIdx = linearStatuses.findIndex(s => s.id === order.orderStatus);
  const isNonLinear = ['Cancelled', 'PaymentFailed', 'Refunded'].includes(order.orderStatus);
  const progress = isNonLinear ? 100 : currentStatusIdx !== -1 ? ((currentStatusIdx + 1) / linearStatuses.length) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6 mb-6">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Track Your Order: #{order.id.substring(0, 12)}...</CardTitle>
        <CardDescription>
          Current Status: <span className="font-semibold text-blue-600">{order.orderStatus}</span>
          {!isNonLinear && order.orderStatus !== 'Delivered' && estimatedDelivery && ` - Est. Delivery: ${estimatedDelivery}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Progress value={progress} className="h-2" />
        <div className="space-y-5">
          {trackingStatuses.map((statusInfo, index) => {
            const isCurrent = statusInfo.id === order.orderStatus;
            const isCompleted = !isNonLinear && currentStatusIdx > linearStatuses.findIndex(s => s.id === statusInfo.id);
            const Icon = statusInfo.icon;
            if (isNonLinear && statusInfo.id !== order.orderStatus) return null;
            if (!isNonLinear && linearStatuses.findIndex(s => s.id === statusInfo.id) === -1) return null; // only show linear path

            return (
              <div key={statusInfo.id} className={`flex items-start space-x-4 p-3 rounded-md ${
                isCurrent ? 'bg-blue-50 border-l-4 border-blue-500' : isCompleted ? 'opacity-60' : 'opacity-40' 
              }`}>
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle size={20}/> : <Icon size={18} className={isCurrent && statusInfo.id === 'Processing' ? 'animate-spin' : ''}/>}
                </div>
                <div>
                  <div className={`font-semibold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-800'}`}>{statusInfo.label}</div>
                  <p className="text-sm text-gray-600">{statusInfo.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        {shipmentHistory.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-lg font-semibold mb-4">Shipment History</h4>
            <ul className="space-y-4">
              {shipmentHistory.map((event, idx) => (
                <li key={idx} className="relative pl-8 border-l border-gray-200 hover:bg-gray-50 py-2 pr-2">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                  <p className="text-xs text-gray-400 flex items-center"><CalendarDays size={14} className="mr-1.5"/>{event.timestamp.toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</p>
                  <p className="font-medium text-sm text-gray-700">{event.status}</p>
                  <p className="text-xs text-gray-500 flex items-center"><MapPin size={14} className="mr-1.5"/>{event.location}</p>
                  {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {order.items && order.items.length > 0 && (
            <div className="mt-6 pt-4 border-t">
                <h4 className="text-md font-semibold mb-3">Order Items Summary</h4>
                <ul className="space-y-1 text-sm">
                    {order.items.map((item, idx) => (
                        <li key={`${item.productId}-${idx}`} className="flex justify-between">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span>₹{item.lineItemTotal.toFixed(2)}</span>
                        </li> ))}
                </ul>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Grand Total:</span><span>₹{order.grandTotal.toFixed(2)}</span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
export default OrderTracking;
