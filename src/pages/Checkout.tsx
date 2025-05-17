import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart, CartItem as HookCartItem } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useOffers } from '@/contexts/useOfferHook';
import { CartItem as ServiceCartItem, Offer as OfferType } from '@/services/offerService';
import { OrderCreationData, OrderItem as BEOrderItem, OrderAddress as BEOrderAddress, Order } from '@/services/orderService';
import { Product } from '@/types/product';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import DeliveryDetails from '../components/checkout/DeliveryDetails';
import OrderSummary, { OrderSummaryProps, DisplayCartItem } from '../components/checkout/OrderSummary';
import PaymentMethods, { OrderDetailsType } from '../components/checkout/PaymentMethods';
import OrderSuccess from '../components/checkout/OrderSuccess';
import OrderTracking from '../components/checkout/OrderTracking';
import CheckoutUpsellDisplay, { UpsellProduct } from '../components/checkout/CheckoutUpsellDisplay';

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

interface CreateOrderResponse { success: boolean; order?: Order; error?: string }
let createOrderOnlineCF: HttpsCallable<OrderCreationData, CreateOrderResponse> | undefined;
if (functionsClient && Object.keys(functionsClient).length > 0) {
  try { createOrderOnlineCF = httpsCallable(functionsClient, 'orders-createOrderCF'); } catch (e) { console.error(e); }
}
const fallbackCreateOrderCall = async (orderData: OrderCreationData): Promise<CreateOrderResponse> => {
    console.warn("MOCK createOrderCF call:", orderData);
    await new Promise(r => setTimeout(r, 1000));
    const mockOrder: Order = {
        id: `MOCK_ORD_${Date.now()}`,
        ...orderData,
        orderStatus: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentStatus: orderData.paymentStatus || 'Paid',
    } as unknown as Order; 
    return { success: true, order: mockOrder };
};

// No longer need local definitions, using imported OrderSummaryProps
const CheckoutOrderSummaryWrapper: React.FC<OrderSummaryProps> = (props) => { return <OrderSummary {...props} />; };

type CheckoutStep = 'delivery' | 'payment' | 'processingOrder' | 'success' | 'tracking';
export interface DeliveryDetailsType { firstName: string; lastName: string; email: string; phone: string; address: string; city: string; state: string; zipCode: string; saveInfo?: boolean;}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart: cartFromHook, clearCartItems, addToCart } = useCart();
  const { calculateCartWithOffers, isLoadingOffers, errorOffers } = useOffers();

  const [step, setStep] = useState<CheckoutStep>('delivery');
  const [progress, setProgress] = useState(25);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsType>(() => { return { firstName:'',lastName:'',email:'',phone:'',address:'',city:'',state:'',zipCode:'',saveInfo:false}; });
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [placedOrderDetails, setPlacedOrderDetails] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const serviceCartItems: ServiceCartItem[] = useMemo(() => cartFromHook.map(item => ({ 
      productId: item.product.id, 
      unitPrice: item.product.price, 
      quantity: item.quantity, 
      categoryId: item.product.category || 'unknown'
    })), [cartFromHook]);

  const { items: processedCartItemsWithOffersNumeric, subTotal: offerAdjustedSubtotal, discount: totalDiscount, total: offerAdjustedCartTotal, appliedOffers } = useMemo(() => {
    if (isLoadingOffers || errorOffers || !serviceCartItems.length) { 
        const fallbackSubtotal = serviceCartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const itemsForFallback = serviceCartItems.map(item => ({...item, discountedPrice: item.unitPrice, itemDiscount: 0, finalUnitPrice: item.unitPrice, lineItemTotal: item.unitPrice * item.quantity }));
        return { items: itemsForFallback, subTotal: fallbackSubtotal, discount: 0, total: fallbackSubtotal, appliedOffers: [] };
    }
    const result = calculateCartWithOffers(serviceCartItems);
    return { 
      ...result, 
      items: result.items.map(item => ({ 
        ...item, 
        finalUnitPrice: item.discountedPrice ?? item.unitPrice, 
        lineItemTotal: (item.discountedPrice ?? item.unitPrice) * item.quantity 
      })) 
    };
  }, [serviceCartItems, calculateCartWithOffers, isLoadingOffers, errorOffers]); 

  const cartForSummary: DisplayCartItem[] = useMemo(() => {
    return processedCartItemsWithOffersNumeric.map(item => {
      const originalCartItem = cartFromHook.find(ci => ci.product.id === item.productId);
      return {
        id: item.productId,
        name: originalCartItem?.product.name || 'Unknown Product',
        price: item.unitPrice, 
        image: originalCartItem?.product.images?.[0] || '/placeholder.svg',
        quantity: item.quantity,
      };
    });
  }, [processedCartItemsWithOffersNumeric, cartFromHook]);

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
  const handleAddUpsellToCart = (upsellProduct: UpsellProduct) => { 
    const productForCart: Product = {
      id: upsellProduct.id, name: upsellProduct.name, price: upsellProduct.price, images: [upsellProduct.imageUrl],
      description: upsellProduct.description || '', category: 'upsell', stock: 1, compareAtPrice: upsellProduct.originalPrice || upsellProduct.price,
      tags: ['upsell'], featured: 0, discount: upsellProduct.originalPrice && upsellProduct.originalPrice > upsellProduct.price ? (upsellProduct.originalPrice - upsellProduct.price) : 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addToCart(productForCart, 1);
    toast.info(`${upsellProduct.name} added!`); 
  };

  const handlePaymentSubmit = async (selectedPaymentMethod: 'upi' | 'card' | 'apple-pay', paymentDetails?: OrderDetailsType) => {
    setPaymentMethod(selectedPaymentMethod);
    setIsPlacingOrder(true);
    setStep('processingOrder');
    const orderItemsBE: BEOrderItem[] = processedCartItemsWithOffersNumeric.map(item => {
        const originalCartItem = cartFromHook.find(ci => ci.product.id === item.productId);
        return { 
            productId: item.productId, productName: originalCartItem?.product.name || 'Unknown', 
            productImage: originalCartItem?.product.images?.[0] || '', quantity: item.quantity, unitPrice: item.unitPrice, 
            itemDiscount: item.itemDiscount || 0, finalUnitPrice: item.finalUnitPrice, lineItemTotal: item.lineItemTotal
        };
    });
    
    let transactionIdForBE: string | undefined = undefined;
    if (paymentDetails && 'transactionId' in paymentDetails && paymentDetails.transactionId) {
      transactionIdForBE = paymentDetails.transactionId;
    }

    const orderCreationPayload: OrderCreationData = {
        userId: user?.uid, customerEmail: deliveryDetails.email, shippingAddress: deliveryDetails as BEOrderAddress,
        items: orderItemsBE, subtotal: displaySubtotal, cartDiscountAmount: displayDiscount, 
        shippingCost: shipping, taxAmount: tax, grandTotal: finalTotalForPayment,
        appliedOffers: appliedOffers?.map(o => ({ id: o.id, name: o.name, type: o.type, discountPercent: o.discountPercent, discountAmount: o.discountAmount })), 
        paymentMethod: selectedPaymentMethod, paymentStatus: 'Paid', 
        transactionId: transactionIdForBE, 
        orderStatus: 'Pending',
    };
    try {
        const fn = createOrderOnlineCF || (() => fallbackCreateOrderCall(orderCreationPayload));
        const result = await fn(orderCreationPayload);
        const responseData = (fn === createOrderOnlineCF && createOrderOnlineCF) ? (result as HttpsCallableResult<CreateOrderResponse>).data : result as CreateOrderResponse;

        if (responseData.success && responseData.order) {
            setPlacedOrderDetails(responseData.order); 
            toast.success("Order placed successfully!"); clearCartItems(); setStep('success');
            setTimeout(() => setStep('tracking'), 5000);
        } else { toast.error(responseData.error || "Failed to place order."); setStep('payment'); }
    } catch (e: unknown) { 
      let message = 'Unknown error';
      if (e instanceof Error) {
        message = e.message;
      }
      toast.error('Order error: ' + message); 
      setStep('payment'); 
    }
    setIsPlacingOrder(false);
  };

  if (isLoadingOffers && !serviceCartItems.length && step !== 'success' && step !== 'tracking') return <Layout><div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin" /> Loading checkout details...</div></Layout>;

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
                <CheckoutOrderSummaryWrapper cart={cartForSummary} subtotal={displaySubtotal} discount={displayDiscount} shipping={shipping} tax={tax} total={finalTotalForPayment} appliedOffers={appliedOffers} showUpsells={step === 'delivery' || step === 'payment'}/>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Checkout;
