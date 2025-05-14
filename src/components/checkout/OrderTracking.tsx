import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OrderTrackingProps {
  orderId: string;
}

const OrderTracking = ({ orderId }: OrderTrackingProps) => {
  const [currentStatus, setCurrentStatus] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  
  // Order tracking states
  const statuses = [
    { id: 0, label: 'Order Placed', description: 'Your order has been received' },
    { id: 1, label: 'Processing', description: 'We\'re processing your order' },
    { id: 2, label: 'Shipped', description: 'Your order has been shipped' },
    { id: 3, label: 'Out for Delivery', description: 'Your order is out for delivery' },
    { id: 4, label: 'Delivered', description: 'Your order has been delivered' }
  ];
  
  // Calculate delivery date (3-5 days from now)
  useEffect(() => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3 + Math.floor(Math.random() * 3));
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    setEstimatedDelivery(deliveryDate.toLocaleDateString(undefined, options));
  }, []);
  
  // Simulate order status progression
  useEffect(() => {
    if (currentStatus < statuses.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStatus(prev => prev + 1);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStatus, statuses.length]);
  
  // Calculate progress percentage
  const progressPercentage = (currentStatus / (statuses.length - 1)) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Track Your Order</CardTitle>
        <div className="text-sm text-muted-foreground">
          Order ID: {orderId}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="space-y-2">
          {statuses.map((status) => (
            <div key={status.id} className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                status.id <= currentStatus 
                  ? 'bg-brand-teal text-white' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {status.id < currentStatus ? '✓' : status.id + 1}
              </div>
              <div>
                <div className={`font-medium ${
                  status.id <= currentStatus ? 'text-brand-teal' : 'text-gray-500'
                }`}>
                  {status.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {status.description}
                </div>
                {status.id === 2 && currentStatus >= 2 && (
                  <div className="text-xs mt-1 text-gray-500">
                    Tracking ID: TRACK-{Math.floor(100000 + Math.random() * 900000)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="text-sm font-medium">Estimated Delivery</div>
          <div className="text-brand-teal font-semibold">{estimatedDelivery}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTracking; 