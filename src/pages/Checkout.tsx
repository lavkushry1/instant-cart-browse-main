import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useOffers } from '@/contexts/OfferContext';
import { CartItem as ServiceCartItem, Offer as OfferType } from '@/services/offerService';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import DeliveryDetails from '../components/checkout/DeliveryDetails';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentMethods from '../components/checkout/PaymentMethods';
import OrderSuccess from '../components/checkout/OrderSuccess';
import AdminUpiSettings from '../components/checkout/AdminUpiSettings';
import OrderTracking from '../components/checkout/OrderTracking';
import { saveUpiId, getUpiId } from '../services/upiService';
import { Tag } from 'lucide-react';

interface CheckoutOrderSummaryProps {
  cart: any[]; 
  subtotal: number; 
  discount?: number; 
  shipping: number;
  tax: number;
  total: number; 
  appliedOffers?: OfferType[];
  showUpsells?: boolean;
}

const CheckoutOrderSummaryWrapper: React.FC<CheckoutOrderSummaryProps> = (props) => {
  const { cart, subtotal, discount, shipping, tax, total, appliedOffers, showUpsells } = props;
  const adaptedCart = cart.map(item => ({
    id: Number(item.product?.id || item.id),
    name: item.product?.name || 'Unknown Product',
    price: item.product?.price || 0, 
    image: item.product?.images?.[0] || '',
    category: item.product?.category || 'N/A',
    rating: 5, 
    description: item.product?.description || '',
    brand: item.product?.category || 'N/A',
    inStock: (item.product?.stock || 0) > 0,
    discount: item.product?.discount || 0, 
    quantity: item.quantity || 0,
  }));
  return <OrderSummary cart={adaptedCart} subtotal={subtotal} discount={discount} shipping={shipping} tax={tax} total={total} appliedOffers={appliedOffers} showUpsells={showUpsells} />;
};

type CheckoutStep = 'delivery' | 'payment' | 'success' | 'tracking';

// Define a more specific type for delivery details if not already globally defined
export interface DeliveryDetailsType {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; city: string; state: string; zipCode: string;
    saveInfo?: boolean; // Optional, as it's a user preference for saving
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: routeState } = location;

  const { cart: cartFromHook, clearCart } = useCart();
  const { calculateCartWithOffers, isLoadingOffers, errorOffers } = useOffers();

  const [step, setStep] = useState<CheckoutStep>('delivery');
  const [progress, setProgress] = useState(25);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsType>(() => {
    const savedInfo = localStorage.getItem('deliveryInfo');
    if (savedInfo) {
      try { return { ...JSON.parse(savedInfo), saveInfo: true }; }
      catch (e) { console.error('Failed to parse saved delivery info', e); }
    }
    return {
      firstName: '', lastName: '', email: '', phone: '',
      address: '', city: '', state: '', zipCode: '', saveInfo: false
    };
  });
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [upiId, setUpiId] = useState(getUpiId()); // This might be better managed via site settings context
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [orderId, setOrderId] = useState('');

  const serviceCartItems: ServiceCartItem[] = useMemo(() => cartFromHook.map(item => ({
    productId: item.product.id,
    unitPrice: item.product.price,
    quantity: item.quantity,
    categoryId: item.product.category,
  })), [cartFromHook]);

  const { 
    items: processedCartItemsWithOffers, 
    subTotal: offerAdjustedSubtotal, 
    discount: totalDiscount, 
    total: offerAdjustedCartTotal,
    appliedOffers 
  } = useMemo(() => {
    if (isLoadingOffers || errorOffers) { 
        const fallbackSubtotal = serviceCartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        return { items: serviceCartItems.map(item => ({...item, discountedPrice: item.unitPrice, itemDiscount: 0})), subTotal: fallbackSubtotal, discount: 0, total: fallbackSubtotal, appliedOffers: [] };
    }
    return calculateCartWithOffers(serviceCartItems);
  }, [serviceCartItems, calculateCartWithOffers, isLoadingOffers, errorOffers]);

  const displaySubtotal = offerAdjustedSubtotal;
  const displayDiscount = totalDiscount;
  const shipping = displaySubtotal > 1000 ? 0 : 99;
  const taxRate = 0.18;
  const taxableAmount = displaySubtotal - displayDiscount;
  const tax = taxableAmount > 0 ? taxableAmount * taxRate : 0;
  const finalTotalForPayment = offerAdjustedCartTotal + shipping + tax;

  useEffect(() => {
    if (cartFromHook.length === 0 && step !== 'success' && step !== 'tracking') {
      navigate('/cart');
      toast.error('Your cart is empty. Please add items before checkout.');
    }
  }, [cartFromHook, navigate, step]);

  useEffect(() => {
    switch (step) {
      case 'delivery': setProgress(25); break;
      case 'payment': setProgress(50); break;
      case 'success': setProgress(75); break;
      case 'tracking': setProgress(100); break;
    }
  }, [step]);

  const handleDeliverySubmit = (details: DeliveryDetailsType) => {
    setDeliveryDetails(details);
    if (details.saveInfo) {
      // Save only necessary fields, exclude saveInfo itself from being saved as true always
      const { saveInfo, ...infoToSave } = details;
      localStorage.setItem('deliveryInfo', JSON.stringify(infoToSave));
    }
    setStep('payment');
  };

  // Callback for PaymentMethods to update deliveryDetails if changed by AddressCorrection
  const handleDeliveryDetailsUpdateFromPaymentStep = useCallback((updatedDetails: Partial<DeliveryDetailsType>) => {
    setDeliveryDetails(prev => ({ ...prev, ...updatedDetails }));
    // Optionally re-save to localStorage if saveInfo was true
    if (deliveryDetails.saveInfo) {
        const { saveInfo, ...infoToSave } = { ...deliveryDetails, ...updatedDetails };
        localStorage.setItem('deliveryInfo', JSON.stringify(infoToSave));
    }
    toast.info("Delivery address updated.");
  }, [deliveryDetails]);

  const handlePaymentSubmit = (paymentType: 'upi' | 'card' | 'apple-pay', paymentDetails?: any) => {
    setPaymentMethod(paymentType);
    const currentOrderId = orderId || `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;
    setOrderId(currentOrderId);
    
    console.log('Order to be submitted (Checkout.tsx):', {
        orderId: currentOrderId, deliveryDetails, paymentType, paymentDetails, 
        items: processedCartItemsWithOffers, displaySubtotal, displayDiscount, shipping, tax, finalTotalForPayment, appliedOffers
    });
    // TODO: Call createOrderBE Cloud Function here with all the assembled order data.

    clearCart(); 
    setStep('success');
    setTimeout(() => setStep('tracking'), 5000);
  };
  
  const handleUpiIdUpdate = (newUpiId: string) => { setUpiId(newUpiId); saveUpiId(newUpiId); };
  const toggleAdminSettings = () => setShowAdminSettings(prev => !prev);

  if (isLoadingOffers && !routeState?.finalTotal) return <Layout><div className="p-6 text-center">Loading checkout details...</div></Layout>;
  if (errorOffers && !routeState?.finalTotal) return <Layout><div className="p-6 text-center text-red-500">Error calculating offers: {errorOffers}. Please try again.</div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Checkout</h1>
        {/* Admin Settings Toggle ... */}
        <div className="mb-6 md:mb-8">
          <Progress value={progress} className="h-2" />
          {/* Progress labels ... */}
        </div>
        
        {(step === 'delivery' || step === 'payment') && (
          <div className="md:hidden mb-6">
            <CheckoutOrderSummaryWrapper cart={processedCartItemsWithOffers} subtotal={displaySubtotal} discount={displayDiscount} shipping={shipping} tax={tax} total={finalTotalForPayment} appliedOffers={appliedOffers} showUpsells={step === 'delivery'}/>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          <div className="lg:col-span-8">
            {step === 'delivery' && (
              <DeliveryDetails initialValues={deliveryDetails} onSubmit={handleDeliverySubmit} />
            )}
            {step === 'payment' && (
              <PaymentMethods 
                onSubmit={handlePaymentSubmit}
                onBack={() => setStep('delivery')}
                totalAmount={finalTotalForPayment}
                deliveryDetails={deliveryDetails}
                onDeliveryDetailsUpdate={handleDeliveryDetailsUpdateFromPaymentStep} // Pass callback
              />
            )}
            {step === 'success' && (
              <OrderSuccess orderDetails={{ id: orderId, date: new Date().toLocaleDateString(), email: deliveryDetails?.email || 'N/A', total: finalTotalForPayment, paymentMethod }} deliveryDetails={deliveryDetails} />
            )}
            {step === 'tracking' && (
              <OrderTracking orderId={orderId} />
            )}
          </div>
          <div className="hidden md:block lg:col-span-4">
            {(step === 'delivery' || step === 'payment') && (
                <CheckoutOrderSummaryWrapper cart={processedCartItemsWithOffers} subtotal={displaySubtotal} discount={displayDiscount} shipping={shipping} tax={tax} total={finalTotalForPayment} appliedOffers={appliedOffers} showUpsells={step === 'delivery'} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
