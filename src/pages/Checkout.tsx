import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart, CartItem as HookCartItem } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/contexts/OfferContext';
import { CartItem as ServiceCartItem, Offer as OfferType } from '@/services/offerService';
import { OrderCreationData, OrderItem as BEOrderItem, OrderAddress as BEOrderAddress, Order } from '@/services/orderService';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import DeliveryDetails from '../components/checkout/DeliveryDetails';
import OrderSummary from '../components/checkout/OrderSummary';
import PaymentMethods from '../components/checkout/PaymentMethods';
import OrderSuccess from '../components/checkout/OrderSuccess';
import OrderTracking from '../components/checkout/OrderTracking';
import CheckoutUpsellDisplay, { UpsellProduct } from '../components/checkout/CheckoutUpsellDisplay';

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

let createOrderOnlineCF: HttpsCallable<OrderCreationData, HttpsCallableResult<{ success: boolean; order?: Order; error?: string }>> | undefined;
if (functionsClient && Object.keys(functionsClient).length > 0) {
  try { createOrderOnlineCF = httpsCallable(functionsClient, 'orders-createOrderCF'); } catch (e) { console.error(e); }
}
const fallbackCreateOrderCall = async (orderData: OrderCreationData): Promise<HttpsCallableResult<{success: boolean; order?: Order; error?: string}>> => {
    console.warn("MOCK createOrderCF call:", orderData);
    await new Promise(r => setTimeout(r, 1000));
    const mockOrder: Order = {
        id: `MOCK_ORD_${Date.now()}`,
        ...orderData,
        orderStatus: 'Pending',
        createdAt: new Date().toISOString(), // In real scenario, this would be a Firestore Timestamp
        updatedAt: new Date().toISOString(), // In real scenario, this would be a Firestore Timestamp
        // Ensure all required fields of Order are present for mock
        paymentStatus: orderData.paymentStatus || 'Paid',
    } as unknown as Order; // Cast needed due to partial data and timestamp differences
    return { data: { success: true, order: mockOrder } };
};

interface CheckoutOrderSummaryProps { cart: any[]; subtotal: number; discount?: number; shipping: number; tax: number; total: number; appliedOffers?: OfferType[]; showUpsells?: boolean;}
const CheckoutOrderSummaryWrapper: React.FC<CheckoutOrderSummaryProps> = (props) => { return <OrderSummary {...props} />; };
type CheckoutStep = 'delivery' | 'payment' | 'processingOrder' | 'success' | 'tracking';
export interface DeliveryDetailsType { firstName: string; lastName: string; email: string; phone: string; address: string; city: string; state: string; zipCode: string; saveInfo?: boolean;}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart: cartFromHook, clearCart, addToCartSimple } = useCart();
  const { calculateCartWithOffers, isLoadingOffers, errorOffers } = useOffers();

  const [step, setStep] = useState<CheckoutStep>('delivery');
  const [progress, setProgress] = useState(25);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsType>(() => { /* ... */ return { firstName:'',lastName:'',email:'',phone:'',address:'',city:'',state:'',zipCode:'',saveInfo:false}; });
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [placedOrderDetails, setPlacedOrderDetails] = useState<Order | null>(null); // To store the full order object
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const serviceCartItems: ServiceCartItem[] = useMemo(() => cartFromHook.map(item => ({ productId: item.product.id, unitPrice: item.product.price, quantity: item.quantity, categoryId: item.product.category })), [cartFromHook]);
  const { items: processedCartItemsWithOffers, subTotal: offerAdjustedSubtotal, discount: totalDiscount, total: offerAdjustedCartTotal, appliedOffers } = useMemo(() => {
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

  useEffect(() => { if (cartFromHook.length === 0 && step !== 'success' && step !== 'tracking') { navigate('/cart'); toast.error('Cart is empty.'); } }, [cartFromHook, navigate, step]);
  useEffect(() => {
    switch (step) {
        case 'delivery': setProgress(25); break; case 'payment': setProgress(50); break;
        case 'processingOrder': setProgress(65); break; case 'success': setProgress(75); break;
        case 'tracking': setProgress(100); break;
      }
  }, [step]);

  const handleDeliverySubmit = (details: DeliveryDetailsType) => { setDeliveryDetails(details); if (details.saveInfo) { const {saveInfo, ...rest} = details; localStorage.setItem('deliveryInfo', JSON.stringify(rest));} setStep('payment'); };
  const handleDeliveryDetailsUpdateFromPaymentStep = useCallback((updatedDetails: Partial<DeliveryDetailsType>) => { setDeliveryDetails(prev => ({ ...prev, ...updatedDetails })); toast.info("Address updated."); }, []);
  const handleAddUpsellToCart = (upsellProduct: UpsellProduct) => { addToCartSimple({id: upsellProduct.id, name: upsellProduct.name, price: upsellProduct.price, images: [upsellProduct.imageUrl], category:'upsell', stock:1}, 1); toast.info(`${upsellProduct.name} added!`); };

  const handlePaymentSubmit = async (selectedPaymentMethod: 'upi' | 'card' | 'apple-pay', paymentDetailsFromMethod?: any) => {
    setPaymentMethod(selectedPaymentMethod);
    setIsPlacingOrder(true);
    setStep('processingOrder');
    const orderItemsBE: BEOrderItem[] = processedCartItemsWithOffers.map(item => {
        const originalCartItem = cartFromHook.find(ci => ci.product.id === item.productId);
        return { productId: item.productId, productName: originalCartItem?.product.name || 'Unknown', productImage: originalCartItem?.product.images[0] || '', quantity: item.quantity, unitPrice: item.unitPrice, itemDiscount: item.itemDiscount || 0, finalUnitPrice: item.discountedPrice ?? item.unitPrice, lineItemTotal: (item.discountedPrice ?? item.unitPrice) * item.quantity };
    });
    const orderCreationPayload: OrderCreationData = {
        userId: user?.uid, customerEmail: deliveryDetails.email, shippingAddress: deliveryDetails as BEOrderAddress,
        items: orderItemsBE, subtotal: displaySubtotal, cartDiscountAmount: displayDiscount, shippingCost: shipping, taxAmount: tax, grandTotal: finalTotalForPayment,
        appliedOffers: appliedOffers?.map(o => ({ id: o.id, name: o.name, type: o.type, discountPercent: o.discountPercent, discountAmount: o.discountAmount })), 
        paymentMethod: selectedPaymentMethod, paymentStatus: 'Paid', transactionId: paymentDetailsFromMethod?.transactionId, orderStatus: 'Pending',
    };
    try {
        const fn = createOrderOnlineCF || (() => fallbackCreateOrderCall(orderCreationPayload));
        const result = await fn(orderCreationPayload);
        if (result.data.success && result.data.order) {
            setPlacedOrderDetails(result.data.order); // Store the full order object
            // setOrderId(result.data.order.id); // No longer needed if passing full order
            toast.success("Order placed successfully!"); clearCart(); setStep('success');
            setTimeout(() => setStep('tracking'), 5000);
        } else { toast.error(result.data.error || "Failed to place order."); setStep('payment'); }
    } catch (e:any) { toast.error('Order error: ' + e.message); setStep('payment'); }
    setIsPlacingOrder(false);
  };

  if (isLoadingOffers && !cartFromHook.length) return <Layout><div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin" /> Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8 min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Checkout</h1>
        <div className="mb-6 md:mb-8"><Progress value={progress} className="h-2" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          <div className="lg:col-span-8">
            {step === 'delivery' && <><DeliveryDetails initialValues={deliveryDetails} onSubmit={handleDeliverySubmit} /><CheckoutUpsellDisplay onAddUpsellToCart={handleAddUpsellToCart} /></>}
            {step === 'payment' && <><PaymentMethods onSubmit={handlePaymentSubmit} onBack={() => setStep('delivery')} totalAmount={finalTotalForPayment} deliveryDetails={deliveryDetails} onDeliveryDetailsUpdate={handleDeliveryDetailsUpdateFromPaymentStep}/><CheckoutUpsellDisplay onAddUpsellToCart={handleAddUpsellToCart} /></>}
            {step === 'processingOrder' && ( <div className="text-center p-10"><Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" /><h2>Placing Order...</h2></div> )}
            {step === 'success' && placedOrderDetails && ( <OrderSuccess orderDetails={placedOrderDetails} deliveryDetails={deliveryDetails} /> )}
            {step === 'tracking' && placedOrderDetails && ( <OrderTracking orderDetails={placedOrderDetails} /> )}
          </div>
          <div className="hidden md:block lg:col-span-4">
            {(step === 'delivery' || step === 'payment' || step === 'processingOrder') && (
                <CheckoutOrderSummaryWrapper cart={processedCartItemsWithOffers} subtotal={displaySubtotal} discount={displayDiscount} shipping={shipping} tax={tax} total={finalTotalForPayment} appliedOffers={appliedOffers} showUpsells={step === 'delivery' || step === 'payment'}/>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Checkout;
