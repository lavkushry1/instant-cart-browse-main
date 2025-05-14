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
import { useSiteSettings } from '@/hooks/useSiteSettings'; // Import the new hook
import { AlertCircle, Info, Loader2 } from 'lucide-react';

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

const DEMO_PAYMENT_DETECT_DELAY_MS = 5 * 1000; 
const DEMO_ORDER_PROCESS_DELAY_MS = 10 * 1000; 
const TEMP_CARD_DETAILS_STORAGE_KEY = 'tempCardDetailsForAddressCorrection';

const PaymentMethods = ({ onSubmit, onBack, totalAmount, deliveryDetails, onDeliveryDetailsUpdate }: PaymentMethodsProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [isProcessingGlobally, setIsProcessingGlobally] = useState(false); 
  const [showAdminCardDetails, setShowAdminCardDetails] = useState(false);
  const [needsAddressCorrection, setNeedsAddressCorrection] = useState(false);
  const [tempCardDetailsForPrefill, setTempCardDetailsForPrefill] = useState<CreditCardDetailsType | null>(null);
  
  // Use the new hook to get site settings, including UPI ID and store name
  const { settings: siteSettings, isLoading: isLoadingSiteSettings, error: siteSettingsError } = useSiteSettings(); 
  const configuredUpiId = useMemo(() => siteSettings?.paymentGatewayKeys?.upiVpa || 'your-default-upi@vpa', [siteSettings]);
  const storeNameForUpi = useMemo(() => siteSettings?.storeName || "Your Store", [siteSettings]);

  const [upiPaymentState, setUpiPaymentState] = useState<UpiPaymentStatus>('idle');
  const [upiStatusMessage, setUpiStatusMessage] = useState('');
  const [processingCountdown, setProcessingCountdown] = useState(DEMO_ORDER_PROCESS_DELAY_MS / 1000);

  const orderId = useMemo(() => `ORD${Date.now().toString().slice(-8)}`, []);

  // Load temp card details if returning from address correction (useEffect from previous step remains)
  useEffect(() => {
    if (paymentMethod === 'card' && !needsAddressCorrection) {
        try {
            const storedDetails = sessionStorage.getItem(TEMP_CARD_DETAILS_STORAGE_KEY);
            if (storedDetails) {
                setTempCardDetailsForPrefill(JSON.parse(storedDetails));
            }
        } catch (error) {
            console.error("Error loading temp card details from session storage:", error);
        }
    }
  }, [paymentMethod, needsAddressCorrection]);

  const handlePaymentSelection = (method: 'upi' | 'card' | 'apple-pay') => {
    setPaymentMethod(method);
    setUpiPaymentState('idle'); 
    setUpiStatusMessage('');
    setIsProcessingGlobally(false);
    if (method !== 'card') {
        setTempCardDetailsForPrefill(null); 
        sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);
    }
  };

  const handleUpiPaymentFlowComplete = useCallback(() => {
    onSubmit('upi', { orderId, amount: totalAmount, upiId: configuredUpiId }); 
  }, [onSubmit, orderId, totalAmount, configuredUpiId]);
  
  const handleCardPaymentComplete = (cardPaymentDetails: any) => {
    sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY); 
    onSubmit('card', { orderId, amount: totalAmount, ...cardPaymentDetails });
  };
  
  const handleApplePaymentComplete = (applePayDetails: any) => {
    onSubmit('apple-pay', { orderId, amount: totalAmount, ...applePayDetails });
  };
  
  const handleAddressCorrectionTrigger = (requiresCorrection: boolean) => {
    if (requiresCorrection) {
        setNeedsAddressCorrection(true);
        setTempCardDetailsForPrefill(null); 
    } else {
        setNeedsAddressCorrection(false);
    }
  };
  
  const handleAddressCorrected = (correctedAddress: any) => {
    onDeliveryDetailsUpdate(correctedAddress); 
    setNeedsAddressCorrection(false);
  };

  const handleCancelAddressCorrection = () => setNeedsAddressCorrection(false);
  const toggleAdminCardDetails = () => setShowAdminCardDetails(prev => !prev);

  // UPI Payment Flow Simulation (useEffect for upiPaymentState, processingCountdown, ...)
  useEffect(() => { 
    let timer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timer;

    if (upiPaymentState === 'waitingForScan') {
      setUpiStatusMessage('Scan the QR code. Waiting for payment confirmation...');
      timer = setTimeout(() => setUpiPaymentState('paymentDetected'), DEMO_PAYMENT_DETECT_DELAY_MS);
    } else if (upiPaymentState === 'paymentDetected') {
      setUpiStatusMessage('Payment detected! Processing your order. Please wait.');
      setProcessingCountdown(DEMO_ORDER_PROCESS_DELAY_MS / 1000);
      setUpiPaymentState('processingOrder');
    } else if (upiPaymentState === 'processingOrder') {
      if (processingCountdown > 0) {
        setUpiStatusMessage(`Processing your order... Please wait. Time remaining: ${processingCountdown}s`);
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
        setUpiStatusMessage('Order processed successfully! Redirecting shortly...');
        timer = setTimeout(() => handleUpiPaymentFlowComplete(), 1500);
    }
    return () => { clearTimeout(timer); clearInterval(countdownInterval); };
  }, [upiPaymentState, processingCountdown, handleUpiPaymentFlowComplete]);

  const startUpiFlow = useCallback(() => {
    if (upiPaymentState === 'idle' && configuredUpiId && configuredUpiId !== 'your-default-upi@vpa' && !siteSettingsError) {
      setUpiPaymentState('waitingForScan');
      setIsProcessingGlobally(true); 
    } else if (!configuredUpiId || configuredUpiId === 'your-default-upi@vpa') {
        setUpiPaymentState('error');
        setUpiStatusMessage("UPI ID not configured by admin.");
    } else if (siteSettingsError) {
        setUpiPaymentState('error');
        setUpiStatusMessage("Could not load UPI settings. Please try refreshing.");
    }
  }, [upiPaymentState, configuredUpiId, siteSettingsError]);

  if (needsAddressCorrection) return <AddressCorrection initialAddress={deliveryDetails} onSubmit={handleAddressCorrected} onCancel={handleCancelAddressCorrection} />;
  if (showAdminCardDetails) return <div className="space-y-4"><AdminCardDetails /><Button variant="outline" onClick={toggleAdminCardDetails} className="w-full mt-4">Back to Payment</Button></div>;

  const isUpiFlowActive = paymentMethod === 'upi' && upiPaymentState !== 'idle' && upiPaymentState !== 'orderProcessed' && upiPaymentState !== 'error';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Payment Method</h2>
          <button onClick={toggleAdminCardDetails} className="text-sm text-gray-500 underline">Admin Access</button>
        </div>
        
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
                    onLoad={startUpiFlow} // Automatically start flow when QR is ready
                  />
                ) : (
                  <p className="text-red-500 flex items-center"><AlertCircle className="h-4 w-4 mr-2"/>UPI Payment is currently unavailable. Admin needs to configure UPI ID.</p>
                )}
                {(isUpiFlowActive || (upiPaymentState === 'error' && paymentMethod === 'upi')) && (
                  <div className={`mt-4 p-3 border rounded-md text-center space-y-2 ${
                    upiPaymentState === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-sm font-semibold flex items-center justify-center ${
                      upiPaymentState === 'error' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {upiPaymentState === 'waitingForScan' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {upiPaymentState === 'paymentDetected' && <Info className="mr-2 h-4 w-4 text-blue-500" />}
                      {upiPaymentState === 'processingOrder' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {upiPaymentState === 'error' && <AlertCircle className="mr-2 h-4 w-4" />}
                      {upiStatusMessage}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Other payment methods (Apple Pay, Card) */}
          <div className={`border rounded-lg p-4 ${paymentMethod === 'apple-pay' ? 'border-brand-teal ring-2 ring-brand-teal' : 'border-gray-200'}`}>
            {/* ... Apple Pay content ... */}
          </div>
          <div className={`border rounded-lg p-4 ${paymentMethod === 'card' ? 'border-brand-teal ring-2 ring-brand-teal' : 'border-gray-200'}`}>
            {/* ... Credit Card content ... (ensure initialCardDetails={tempCardDetailsForPrefill} is passed) */}
            <div className="flex items-start space-x-3">
                <RadioGroupItem value="card" id="card-option" disabled={isProcessingGlobally && paymentMethod !== 'card'} />
                <label htmlFor="card-option" className={`font-medium cursor-pointer ${isProcessingGlobally && paymentMethod !== 'card' ? 'opacity-50' : ''}`}>Credit / Debit Card</label>
            </div>
            {paymentMethod === 'card' && 
                <div className="mt-4 pl-7">
                    <CreditCardForm 
                        addressDetails={deliveryDetails} 
                        onAddressCorrection={handleAddressCorrectionTrigger}
                        onPaymentComplete={handleCardPaymentComplete}
                        totalAmount={totalAmount} 
                        initialCardDetails={tempCardDetailsForPrefill}
                    />
                </div>
            }
           </div>
        </RadioGroup>
        
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onBack} disabled={isProcessingGlobally || isUpiFlowActive}>Back to Delivery</Button>
        </div>
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Secure Payment</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground"> {/* ... Trust ... */} </CardContent></Card>
    </div>
  );
};

export default PaymentMethods;
