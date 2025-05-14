import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { loadCart, getCartTotals, clearCart } from '../services/cartService';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import DeliveryDetails from '../components/checkout/DeliveryDetails';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentMethods from '../components/checkout/PaymentMethods';
import OrderSuccess from '../components/checkout/OrderSuccess';
import AdminUpiSettings from '../components/checkout/AdminUpiSettings';
import OrderTracking from '../components/checkout/OrderTracking';
import { saveUpiId, getUpiId } from '../services/upiService';

// Create a custom wrapper component for OrderSummary that handles type conversion
const CheckoutOrderSummary = (props) => {
  const { cart, ...rest } = props;
  
  // Convert cart items to format expected by OrderSummary
  const adaptedCart = cart.map(item => ({
    id: Number(item.product.id), // Convert to number
    name: item.product.name,
    price: item.product.price,
    image: item.product.images[0], // Use first image
    category: item.product.category,
    rating: 5, // Default rating
    description: item.product.description,
    brand: item.product.category, // Use category as brand
    inStock: item.product.stock > 0,
    discount: item.product.discount,
    quantity: item.quantity
  }));
  
  return <OrderSummary cart={adaptedCart} {...rest} />;
};

type CheckoutStep = 'delivery' | 'payment' | 'success' | 'tracking';

const Checkout = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>('delivery');
  const [cart, setCart] = useState(loadCart());
  const [progress, setProgress] = useState(33);
  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    saveInfo: false
  });
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [upiId, setUpiId] = useState(getUpiId());
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [orderId, setOrderId] = useState('');
  const { subtotal, totalItems } = getCartTotals(cart);
  const shipping = subtotal > 1000 ? 0 : 99;
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + shipping + tax;

  // Load saved delivery info from localStorage if available
  useEffect(() => {
    const savedInfo = localStorage.getItem('deliveryInfo');
    if (savedInfo) {
      try {
        const parsedInfo = JSON.parse(savedInfo);
        setDeliveryDetails(prev => ({
          ...prev,
          ...parsedInfo,
          saveInfo: true
        }));
      } catch (error) {
        console.error('Failed to parse saved delivery info');
      }
    }
  }, []);

  // Check if cart is empty and redirect to cart page
  useEffect(() => {
    if (cart.length === 0 && step !== 'success' && step !== 'tracking') {
      navigate('/cart');
      toast.error('Your cart is empty. Please add items before checkout.');
    }
  }, [cart, navigate, step]);

  // Update progress based on step
  useEffect(() => {
    switch (step) {
      case 'delivery':
        setProgress(25);
        break;
      case 'payment':
        setProgress(50);
        break;
      case 'success':
        setProgress(75);
        break;
      case 'tracking':
        setProgress(100);
        break;
    }
  }, [step]);

  // Handle delivery form submission
  const handleDeliverySubmit = (details) => {
    setDeliveryDetails(details);
    
    // Save delivery info if user opted in
    if (details.saveInfo) {
      localStorage.setItem('deliveryInfo', JSON.stringify({
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: details.phone,
        address: details.address,
        city: details.city,
        state: details.state,
        zipCode: details.zipCode
      }));
    }
    
    setStep('payment');
  };

  // Handle payment submission
  const handlePaymentSubmit = (paymentType: 'upi' | 'card' | 'apple-pay') => {
    setPaymentMethod(paymentType);
    
    // Generate order ID if not already set
    if (!orderId) {
      setOrderId(`ORD${Date.now().toString().slice(-8)}`);
    }
    
    if (paymentType === 'card' || paymentType === 'apple-pay') {
      // For credit card and Apple Pay payments, we'll transition to success and then to tracking
      clearCart();
      setStep('success');
      
      // Set a timeout to transition to tracking after 5 seconds
      setTimeout(() => {
        setStep('tracking');
      }, 5000);
    } else {
      // For UPI, payment confirmation is handled in the UPI component
      clearCart();
      setStep('success');
      
      // Set a timeout to transition to tracking after 5 seconds
      setTimeout(() => {
        setStep('tracking');
      }, 5000);
    }
  };

  // Handle UPI ID update from admin settings
  const handleUpiIdUpdate = (newUpiId: string) => {
    setUpiId(newUpiId);
    saveUpiId(newUpiId);
  };

  // Toggle admin settings display - in a real app this would be protected
  const toggleAdminSettings = () => {
    setShowAdminSettings(prev => !prev);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Checkout</h1>
        
        {/* Admin settings toggle - in a real app this would be in an admin panel */}
        <div className="mb-4">
          <button 
            onClick={toggleAdminSettings} 
            className="text-sm text-gray-500 underline"
          >
            {showAdminSettings ? 'Hide' : 'Show'} Admin Settings
          </button>
          
          {showAdminSettings && (
            <div className="mt-2 mb-4">
              <AdminUpiSettings 
                currentUpiId={upiId}
                onSave={handleUpiIdUpdate}
              />
            </div>
          )}
        </div>
        
        {/* Progress tracker */}
        <div className="mb-6 md:mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs md:text-sm">
            <div className={`${step === 'delivery' ? 'text-brand-teal font-medium' : ''}`}>
              Delivery
            </div>
            <div className={`${step === 'payment' ? 'text-brand-teal font-medium' : ''}`}>
              Payment
            </div>
            <div className={`${step === 'success' ? 'text-brand-teal font-medium' : ''}`}>
              Confirmation
            </div>
            <div className={`${step === 'tracking' ? 'text-brand-teal font-medium' : ''}`}>
              Tracking
            </div>
          </div>
        </div>
        
        {/* Mobile order summary - only shown in delivery and payment steps */}
        {(step === 'delivery' || step === 'payment') && (
          <div className="md:hidden">
            <CheckoutOrderSummary 
              cart={cart}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
              showUpsells={step === 'delivery'}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          {/* Main content area */}
          <div className="lg:col-span-8">
            {step === 'delivery' && (
              <DeliveryDetails 
                initialValues={deliveryDetails} 
                onSubmit={handleDeliverySubmit} 
              />
            )}
            
            {step === 'payment' && (
              <PaymentMethods 
                onSubmit={handlePaymentSubmit}
                onBack={() => setStep('delivery')}
                totalAmount={total}
                deliveryDetails={deliveryDetails}
              />
            )}
            
            {step === 'success' && (
              <OrderSuccess 
                orderDetails={{
                  id: orderId || Math.floor(100000 + Math.random() * 900000).toString(),
                  date: new Date().toLocaleDateString(),
                  email: deliveryDetails.email,
                  total,
                  paymentMethod
                }}
                deliveryDetails={deliveryDetails}
              />
            )}
            
            {step === 'tracking' && (
              <OrderTracking 
                orderId={orderId || Math.floor(100000 + Math.random() * 900000).toString()}
              />
            )}
          </div>
          
          {/* Order summary sidebar - desktop only */}
          <div className="hidden md:block lg:col-span-4">
            <CheckoutOrderSummary 
              cart={cart}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
              showUpsells={step === 'delivery'}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
