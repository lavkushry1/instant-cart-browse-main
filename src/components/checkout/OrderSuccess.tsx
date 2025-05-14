// src/components/checkout/OrderSuccess.tsx
import React from 'react'; // Added React import
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from "lucide-react";
import { Order } from '@/services/orderService'; // Import the main Order type
import { DeliveryDetailsType } from '@/pages/Checkout'; // Import DeliveryDetailsType

interface OrderSuccessProps {
  // orderDetails is now the full Order object (or relevant parts from it)
  orderDetails: Pick<Order, 'id' | 'customerEmail' | 'grandTotal' | 'paymentMethod' | 'createdAt'>; // Example subset
  // Or pass the full Order object: orderDetails: Order;
  deliveryDetails: DeliveryDetailsType;
}

// Helper to format date from various possible Timestamp/string formats
const formatDateForDisplay = (dateInput: any) => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : 
               dateInput.toDate ? dateInput.toDate() : 
               dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toLocaleDateString('en-IN', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

const OrderSuccess: React.FC<OrderSuccessProps> = ({ orderDetails, deliveryDetails }) => {
  const navigate = useNavigate();
  
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const deliveryDateStr = estimatedDelivery.toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold mb-3">Thank You for Your Order!</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Your order <span className="font-semibold text-gray-700">#{orderDetails.id.substring(0,12)}...</span> has been placed and is being processed.
      </p>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left shadow-inner">
        <h3 className="font-semibold text-lg mb-4 border-b pb-3">Order Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><p className="text-gray-500">Order Number</p><p className="font-medium truncate">{orderDetails.id}</p></div>
          <div><p className="text-gray-500">Order Date</p><p className="font-medium">{formatDateForDisplay(orderDetails.createdAt)}</p></div>
          <div><p className="text-gray-500">Email</p><p className="font-medium truncate">{orderDetails.customerEmail}</p></div>
          <div><p className="text-gray-500">Payment Method</p><p className="font-medium capitalize">{orderDetails.paymentMethod.replace('-',' ')}</p></div>
          <div><p className="text-gray-500">Total Amount</p><p className="font-medium">₹{orderDetails.grandTotal.toFixed(2)}</p></div>
          <div><p className="text-gray-500">Estimated Delivery</p><p className="font-medium">{deliveryDateStr}</p></div>
        </div>
        
        <hr className="my-6" />
        
        <h4 className="font-semibold text-md mb-2">Shipping Address</h4>
        <address className="text-sm not-italic">
          {deliveryDetails.firstName} {deliveryDetails.lastName}<br />
          {deliveryDetails.address}<br />
          {deliveryDetails.city}, {deliveryDetails.state} {deliveryDetails.zipCode}
        </address>
      </div>
      
      <p className="text-sm text-gray-500 mb-8">
        We've sent a confirmation email to {orderDetails.customerEmail}.<br />
        You will receive further updates as your order progresses.
      </p>
      
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/')}>Continue Shopping</Button>
        {/* <Button className="bg-brand-teal hover:bg-brand-dark" onClick={() => navigate('/account/orders')}>View My Orders</Button> */}
      </div>
    </div>
  );
};

export default OrderSuccess;
