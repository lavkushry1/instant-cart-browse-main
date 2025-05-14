import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import Layout from '../components/layout/Layout';
// import { loadCart, getCartTotals, clearCart } from '../services/cartService'; // cartService direct use replaced by useCart
import { useCart } from '@/hooks/useCart'; // Import useCart hook
import { useOffers } from '@/contexts/OfferContext'; // Import useOffers hook
import { CartItem as ServiceCartItem, Offer as OfferType } from '@/services/offerService'; // Import types
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import DeliveryDetails from '../components/checkout/DeliveryDetails';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentMethods from '../components/checkout/PaymentMethods';
import OrderSuccess from '../components/checkout/OrderSuccess';
// AdminUpiSettings and OrderTracking might not be directly relevant to offer calculation but are kept
import AdminUpiSettings from '../components/checkout/AdminUpiSettings';
import OrderTracking from '../components/checkout/OrderTracking';
import { saveUpiId, getUpiId } from '../services/upiService';
import { Tag } from 'lucide-react'; // Icon for offers

// Adapting the CheckoutOrderSummary to potentially receive offer-adjusted props
interface CheckoutOrderSummaryProps {
  cart: any[]; // Keep as any for now, ideally should be typed based on OrderSummary expectation
  subtotal: number; // This will be the original subtotal before cart-wide discounts
  discount?: number; // Total discount from offers
  shipping: number;
  tax: number;
  total: number; // This will be the final total after all discounts, shipping, and tax
  appliedOffers?: OfferType[];
  showUpsells?: boolean;
}

const CheckoutOrderSummaryWrapper: React.FC<CheckoutOrderSummaryProps> = (props) => {
  const { cart, subtotal, discount, shipping, tax, total, appliedOffers, showUpsells } = props;
  
  // Convert cart items. This adaptation might need to change based on how OrderSummary displays individual item prices (original vs discounted)
  const adaptedCart = cart.map(item => ({
    id: Number(item.product?.id || item.id), // Handle different id sources
    name: item.product?.name || 'Unknown Product',
    price: item.product?.price || 0, // This should be the original price for display
    image: item.product?.images?.[0] || '',
    category: item.product?.category || 'N/A',
    rating: 5, 
    description: item.product?.description || '',
    brand: item.product?.category || 'N/A',
    inStock: (item.product?.stock || 0) > 0,
    discount: item.product?.discount || 0, // Original product-level discount, not the offer discount
    quantity: item.quantity || 0,
    // If OrderSummary needs to show item-level applied offers or discounted price, adapt here
    // e.g. discountedPrice: item.discountedPrice (if available from processedCartItems)
  }));
  
  // Pass all relevant props to the actual OrderSummary component
  // OrderSummary itself would need to be updated to display these (subtotal, discount, total, appliedOffers)
  return (
    <OrderSummary 
        cart={adaptedCart} 
        subtotal={subtotal} 
        discount={discount}
        shipping={shipping}
        tax={tax}
        total={total}
        appliedOffers={appliedOffers}
        showUpsells={showUpsells}
    />
  );
};

type CheckoutStep = 'delivery' | 'payment' | 'success' | 'tracking';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: routeState } = location; // state from navigate('/checkout', { state: { ... } })

  const { cart: cartFromHook, clearCart } = useCart(); // Using useCart hook
  const { calculateCartWithOffers, isLoadingOffers, errorOffers } = useOffers();

  const [step, setStep] = useState<CheckoutStep>('delivery');
  const [progress, setProgress] = useState(33);
  const [deliveryDetails, setDeliveryDetails] = useState(/* ... initial delivery details ... */);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [upiId, setUpiId] = useState(getUpiId());
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Transform cart items for offer calculation
  const serviceCartItems: ServiceCartItem[] = useMemo(() => cartFromHook.map(item => ({
    productId: item.product.id,
    unitPrice: item.product.price,
    quantity: item.quantity,
    categoryId: item.product.category,
  })), [cartFromHook]);

  // Calculate totals with offers
  const { 
    items: processedCartItemsWithOffers, 
    subTotal: offerAdjustedSubtotal, 
    discount: totalDiscount, 
    total: offerAdjustedCartTotal, // Total after offers, before shipping/tax
    appliedOffers 
  } = useMemo(() => {
    if (isLoadingOffers || errorOffers) { // If offers can't be loaded, calculate without them
        const fallbackSubtotal = serviceCartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        return {
            items: serviceCartItems.map(item => ({...item, discountedPrice: item.unitPrice, itemDiscount: 0})),
            subTotal: fallbackSubtotal,
            discount: 0,
            total: fallbackSubtotal,
            appliedOffers: [],
        };
    }
    return calculateCartWithOffers(serviceCartItems);
  }, [serviceCartItems, calculateCartWithOffers, isLoadingOffers, errorOffers]);

  // Determine final totals for display and payment
  const displaySubtotal = offerAdjustedSubtotal; // Sum of original prices from cart calculation
  const displayDiscount = totalDiscount;
  const shipping = displaySubtotal > 1000 ? 0 : 99; // Shipping based on original subtotal
  const taxRate = 0.18;
  const taxableAmount = displaySubtotal - displayDiscount; // Tax on discounted amount
  const tax = taxableAmount > 0 ? taxableAmount * taxRate : 0;
  const finalTotalForPayment = offerAdjustedCartTotal + shipping + tax;

  useEffect(() => {
    // If totals are passed from cart page via route state, prioritize them (optional)
    // This can be useful if cart page does complex pre-calculation not easily redone here
    // However, recalculating on checkout ensures data consistency if cart can be modified indirectly
    // For robustness, we are relying on direct calculation using useCart and useOffers here.
    // If routeState?.finalTotal was to be used, you'd set a state variable here.
  }, [routeState]);

  useEffect(() => {
    if (cartFromHook.length === 0 && step !== 'success' && step !== 'tracking') {
      navigate('/cart');
      toast.error('Your cart is empty. Please add items before checkout.');
    }
  }, [cartFromHook, navigate, step]);

  useEffect(() => {
    // Progress bar update logic (remains the same)
    switch (step) {
      case 'delivery': setProgress(25); break;
      case 'payment': setProgress(50); break;
      case 'success': setProgress(75); break;
      case 'tracking': setProgress(100); break;
    }
  }, [step]);

  const handleDeliverySubmit = (details: any) => {
    setDeliveryDetails(details);
    if (details.saveInfo) {
      localStorage.setItem('deliveryInfo', JSON.stringify(/*...*/));
    }
    setStep('payment');
  };

  const handlePaymentSubmit = (paymentType: 'upi' | 'card' | 'apple-pay') => {
    setPaymentMethod(paymentType);
    const currentOrderId = orderId || `ORD${Date.now().toString().slice(-8)}`;
    setOrderId(currentOrderId);
    
    // TODO: Here you would typically save the order to your backend with all details:
    // deliveryDetails, processedCartItemsWithOffers, displaySubtotal, displayDiscount,
    // shipping, tax, finalTotalForPayment, appliedOffers, paymentMethod, currentOrderId.

    clearCart(); // Clear cart from useCart hook
    setStep('success');
    setTimeout(() => setStep('tracking'), 5000);
  };
  
  const handleUpiIdUpdate = (newUpiId: string) => {
    setUpiId(newUpiId);
    saveUpiId(newUpiId);
  };

  const toggleAdminSettings = () => setShowAdminSettings(prev => !prev);

  if (isLoadingOffers && !routeState?.finalTotal) { // Show loading if offers are loading and no precomputed total from cart
    return <Layout><div className="container mx-auto px-4 py-8 min-h-screen text-center">Loading checkout details...</div></Layout>;
  }
  if (errorOffers && !routeState?.finalTotal) {
    return <Layout><div className="container mx-auto px-4 py-8 min-h-screen text-center text-red-500">Error calculating offers: {errorOffers}. Please try again.</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Checkout</h1>
        
        {/* Admin Settings Toggle - Kept for completeness */}
        <div className="mb-4">
          <button onClick={toggleAdminSettings} className="text-sm text-gray-500 underline">
            {showAdminSettings ? 'Hide' : 'Show'} Admin Settings
          </button>
          {showAdminSettings && (
            <div className="mt-2 mb-4"><AdminUpiSettings currentUpiId={upiId} onSave={handleUpiIdUpdate}/></div>
          )}
        </div>
        
        <div className="mb-6 md:mb-8">
          <Progress value={progress} className="h-2" />
          {/* Progress labels */}
        </div>
        
        {(step === 'delivery' || step === 'payment') && (
          <div className="md:hidden mb-6">
            <CheckoutOrderSummaryWrapper 
              cart={processedCartItemsWithOffers} // Pass processed items
              subtotal={displaySubtotal}
              discount={displayDiscount}
              shipping={shipping}
              tax={tax}
              total={finalTotalForPayment}
              appliedOffers={appliedOffers}
              showUpsells={step === 'delivery'}
            />
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
                totalAmount={finalTotalForPayment} // Pass the final offer-adjusted total
                deliveryDetails={deliveryDetails}
              />
            )}
            {step === 'success' && (
              <OrderSuccess 
                orderDetails={{
                  id: orderId,
                  date: new Date().toLocaleDateString(),
                  email: deliveryDetails?.email || 'N/A',
                  total: finalTotalForPayment,
                  paymentMethod,
                  // You might want to include appliedOffers here too
                }}
                deliveryDetails={deliveryDetails}
              />
            )}
            {step === 'tracking' && (
              <OrderTracking orderId={orderId} />
            )}
          </div>
          
          <div className="hidden md:block lg:col-span-4">
            {(step === 'delivery' || step === 'payment') && (
                <CheckoutOrderSummaryWrapper 
                  cart={processedCartItemsWithOffers} // Pass processed items
                  subtotal={displaySubtotal}       // Original subtotal
                  discount={displayDiscount}       // Total discount amount
                  shipping={shipping}
                  tax={tax}
                  total={finalTotalForPayment}     // Grand total
                  appliedOffers={appliedOffers}    // List of applied offers
                  showUpsells={step === 'delivery'}
                />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
