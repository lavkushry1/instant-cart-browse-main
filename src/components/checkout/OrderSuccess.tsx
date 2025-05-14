import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from "lucide-react";

interface OrderSuccessProps {
  orderDetails: {
    id: string;
    date: string;
    email: string;
    total: number;
    paymentMethod: 'upi' | 'card' | 'apple-pay';
  };
  deliveryDetails: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const OrderSuccess = ({ orderDetails, deliveryDetails }: OrderSuccessProps) => {
  const navigate = useNavigate();
  
  // Estimate delivery date (5 days from now)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const deliveryDate = estimatedDelivery.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Thank You for Your Order!</h2>
      <p className="text-gray-600 mb-8">
        Your order has been placed and is being processed.
      </p>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
        <h3 className="font-semibold text-lg mb-4">Order Details</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Order Number</p>
            <p className="font-medium">{orderDetails.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Order Date</p>
            <p className="font-medium">{orderDetails.date}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{orderDetails.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Payment Method</p>
            <p className="font-medium">
              {orderDetails.paymentMethod === 'upi' 
                ? 'UPI Payment' 
                : orderDetails.paymentMethod === 'apple-pay'
                  ? 'Apple Pay'
                  : 'Credit/Debit Card'
              }
            </p>
          </div>
          <div>
            <p className="text-gray-500">Total Amount</p>
            <p className="font-medium">₹{orderDetails.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Estimated Delivery</p>
            <p className="font-medium">{deliveryDate}</p>
          </div>
        </div>
        
        <hr className="my-4" />
        
        <h4 className="font-medium mb-2">Shipping Address</h4>
        <p>
          {deliveryDetails.firstName} {deliveryDetails.lastName}<br />
          {deliveryDetails.address}<br />
          {deliveryDetails.city}, {deliveryDetails.state} {deliveryDetails.zipCode}
        </p>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">
        We've sent a confirmation email to {orderDetails.email}.<br />
        You'll receive updates as your order is processed.
      </p>
      
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
        <Button 
          className="bg-brand-teal hover:bg-brand-dark"
          onClick={() => navigate('/products')}
        >
          Browse More Products
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
