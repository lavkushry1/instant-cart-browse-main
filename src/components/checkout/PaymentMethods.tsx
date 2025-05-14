// src/components/checkout/PaymentMethods.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import UpiQRCode from './UpiQRCode';
import CreditCardForm, { CardDetails as CreditCardDetailsType } from './CreditCardForm'; 
import ApplePayButton from './ApplePayButton';
import AddressCorrection from './AddressCorrection';
import AdminCardDetails from './AdminCardDetails';
import { useSiteSettings } from '@/hooks/useSiteSettings'; 
import { AlertCircle, Info, Loader2, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2

interface PaymentMethodsProps {
  onSubmit: (paymentMethod: 'upi' | 'card' | 'apple-pay', orderDetails?: any) => void;
  onBack: () => void;
  totalAmount: number;
  deliveryDetails: {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; city: string; state: string; zipCode: string;
  };
  onDeliveryDetailsUpdate: (updatedDetails: Partial<PaymentMethodsProps['deliveryDetails']>) => void;
}

type UpiPaymentStatus = 'idle' | 'waitingForScan' | 'paymentDetected' | 'processingOrder' | 'orderProcessed' | 'error';

const ACTUAL_TEN_MINUTES_MS = 10 * 60 * 1000;
const DEMO_PAYMENT_DETECT_DELAY_MS = 5 * 1000; 
// const DEMO_ORDER_PROCESS_DELAY_MS = 10 * 1000; // 10 seconds for demo
const DEMO_ORDER_PROCESS_DELAY_MS = ACTUAL_TEN_MINUTES_MS; // Using actual 10 minutes for simulation

const TEMP_CARD_DETAILS_STORAGE_KEY = 'tempCardDetailsForAddressCorrection';

const PaymentMethods = ({ onSubmit, onBack, totalAmount, deliveryDetails, onDeliveryDetailsUpdate }: PaymentMethodsProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [isProcessingGlobally, setIsProcessingGlobally] = useState(false); 
  const [showAdminCardDetails, setShowAdminCardDetails] = useState(false);
  const [needsAddressCorrection, setNeedsAddressCorrection] = useState(false);
  const [tempCardDetailsForPrefill, setTempCardDetailsForPrefill] = useState<CreditCardDetailsType | null>(null);
  
  const { settings: siteSettings, isLoading: isLoadingSiteSettings, error: siteSettingsError } = useSiteSettings(); 
  const configuredUpiId = useMemo(() => siteSettings?.paymentGatewayKeys?.upiVpa || 'your-default-upi@vpa', [siteSettings]);
  const storeNameForUpi = useMemo(() => siteSettings?.storeName || "Your Store", [siteSettings]);

  const [upiPaymentState, setUpiPaymentState] = useState<UpiPaymentStatus>('idle');
  const [upiStatusMessage, setUpiStatusMessage] = useState('');
  const [processingCountdown, setProcessingCountdown] = useState(Math.floor(DEMO_ORDER_PROCESS_DELAY_MS / 1000));

  const orderId = useMemo(() => `ORD${Date.now().toString().slice(-8)}`, []);

  useEffect(() => { /* Load temp card details */ }, [paymentMethod, needsAddressCorrection]);

  const handlePaymentSelection = (method: 'upi' | 'card' | 'apple-pay') => {
    setPaymentMethod(method);
    setUpiPaymentState('idle'); setUpiStatusMessage(''); setIsProcessingGlobally(false);
    if (method !== 'card') { setTempCardDetailsForPrefill(null); sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);}
  };

  const handleUpiPaymentFlowComplete = useCallback(() => {
    onSubmit('upi', { orderId, amount: totalAmount, upiId: configuredUpiId }); 
  }, [onSubmit, orderId, totalAmount, configuredUpiId]);
  
  const handleCardPaymentComplete = (cardPaymentDetails: any) => { /* ... */ onSubmit('card', { orderId, ...cardPaymentDetails }); };
  const handleApplePaymentComplete = (applePayDetails: any) => { /* ... */ onSubmit('apple-pay', { orderId, ...applePayDetails }); };
  const handleAddressCorrectionTrigger = (requiresCorrection: boolean) => setNeedsAddressCorrection(requiresCorrection);
  const handleAddressCorrected = (correctedAddress: any) => { onDeliveryDetailsUpdate(correctedAddress); setNeedsAddressCorrection(false); };
  const handleCancelAddressCorrection = () => setNeedsAddressCorrection(false);
  const toggleAdminCardDetails = () => setShowAdminCardDetails(prev => !prev);

  useEffect(() => { 
    let timer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timer;

    if (upiPaymentState === 'waitingForScan') {
      setUpiStatusMessage('Please scan the QR code with your UPI app to complete the payment. Waiting for confirmation...');
      timer = setTimeout(() => setUpiPaymentState('paymentDetected'), DEMO_PAYMENT_DETECT_DELAY_MS);
    } else if (upiPaymentState === 'paymentDetected') {
      setUpiStatusMessage('Payment successful! Your order is being processed. Please wait.');
      setProcessingCountdown(Math.floor(DEMO_ORDER_PROCESS_DELAY_MS / 1000)); // Reset countdown for this phase
      setUpiPaymentState('processingOrder');
    } else if (upiPaymentState === 'processingOrder') {
      if (processingCountdown > 0) {
        const minutes = Math.floor(processingCountdown / 60);
        const seconds = processingCountdown % 60;
        setUpiStatusMessage(`Processing your order... Do not refresh. Time remaining: ${minutes}m ${seconds}s`);
        countdownInterval = setInterval(() => {
          setProcessingCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setUpiPaymentState('orderProcessed');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } 
    } else if (upiPaymentState === 'orderProcessed') {
        setUpiStatusMessage('Order processed successfully! Proceeding to confirmation...');
        timer = setTimeout(() => handleUpiPaymentFlowComplete(), 2000); 
    }
    return () => { clearTimeout(timer); clearInterval(countdownInterval); };
  }, [upiPaymentState, processingCountdown, handleUpiPaymentFlowComplete]);

  const startUpiFlow = useCallback(() => {
    if (upiPaymentState === 'idle' && configuredUpiId && configuredUpiId !== 'your-default-upi@vpa' && !siteSettingsError) {
      setUpiPaymentState('waitingForScan');
      setIsProcessingGlobally(true); 
    } else if (!configuredUpiId || configuredUpiId === 'your-default-upi@vpa') {
        setUpiPaymentState('error');
        setUpiStatusMessage("UPI ID not configured. Please contact support or try another payment method.");
    } else if (siteSettingsError) {
        setUpiPaymentState('error');
        setUpiStatusMessage("Could not load UPI settings. Please refresh or try another method.");
    }
  }, [upiPaymentState, configuredUpiId, siteSettingsError]);

  if (needsAddressCorrection) return <AddressCorrection initialAddress={deliveryDetails} onSubmit={handleAddressCorrected} onCancel={handleCancelAddressCorrection} />;
  if (showAdminCardDetails) return <div className="space-y-4"><AdminCardDetails /><Button variant="outline" onClick={toggleAdminCardDetails} className="w-full mt-4">Back to Payment</Button></div>;

  const isUpiFlowActive = paymentMethod === 'upi' && upiPaymentState !== 'idle' && upiPaymentState !== 'orderProcessed' && upiPaymentState !== 'error';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* ... RadioGroup and payment method sections ... */}
        <RadioGroup value={paymentMethod} onValueChange={handlePaymentSelection} className="space-y-4">
          <div className={`border rounded-lg p-4 ${paymentMethod === 'upi' ? 'border-brand-teal ring-2 ring-brand-teal' : 'border-gray-200'}`}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="upi" id="upi-option" disabled={isProcessingGlobally && paymentMethod !== 'upi'} />
              <label htmlFor="upi-option" className={`font-medium flex items-center cursor-pointer ${isProcessingGlobally && paymentMethod !== 'upi' ? 'opacity-50' : ''}`}>
                UPI QR Code Payment <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Recommended</span>
              </label>
            </div>
            {paymentMethod === 'upi' && (
              <div className="mt-4 pl-7">
                {isLoadingSiteSettings ? <p><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading UPI details...</p> : 
                 siteSettingsError ? <p className="text-red-500 flex items-center"><AlertCircle className="h-4 w-4 mr-2"/> Error loading UPI settings: {siteSettingsError}</p> : 
                 configuredUpiId && configuredUpiId !== 'your-default-upi@vpa' ? (
                  <UpiQRCode 
                    amount={totalAmount}
                    upiId={configuredUpiId}
                    merchantName={storeNameForUpi}
                    transactionNote={`Order #${orderId}`}
                    onLoad={upiPaymentState === 'idle' ? startUpiFlow : undefined}
                  />
                ) : (
                  <p className="text-red-500 flex items-center"><AlertCircle className="h-4 w-4 mr-2"/>UPI Payment is currently unavailable. Admin needs to configure UPI ID.</p>
                )}
                {(isUpiFlowActive || (upiPaymentState !== 'idle' && paymentMethod === 'upi')) && (
                  <div className={`mt-4 p-4 border rounded-md text-center space-y-2 ${
                    upiPaymentState === 'error' ? 'bg-red-50 border-red-300' : 
                    upiPaymentState === 'orderProcessed' ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'
                  }`}>
                    <p className={`text-sm font-semibold flex items-center justify-center ${
                      upiPaymentState === 'error' ? 'text-red-700' : 
                      upiPaymentState === 'orderProcessed' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {upiPaymentState === 'waitingForScan' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {upiPaymentState === 'paymentDetected' && <Info className="mr-2 h-4 w-4" />}
                      {upiPaymentState === 'processingOrder' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {upiPaymentState === 'orderProcessed' && <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {upiPaymentState === 'error' && <AlertCircle className="mr-2 h-4 w-4" />}
                      {upiStatusMessage}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Other payment methods ... */}
        </RadioGroup>
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onBack} disabled={isProcessingGlobally || isUpiFlowActive}>Back to Delivery</Button>
        </div>
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Secure Payment</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground"> {/* ... Trust ... */} </CardContent></Card>
    </div>
  );
};
export default PaymentMethods;
