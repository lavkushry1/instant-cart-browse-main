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
import { AlertCircle, Info, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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

type UpiPaymentStatus = 'idle' | 'awaitingUpiDetails' | 'readyToScan' | 'waitingForPayment' | 'paymentSuccess' | 'paymentFailed' | 'processingOrder' | 'orderProcessed' | 'errorConfig';

const ACTUAL_TEN_MINUTES_MS = 10 * 60 * 1000;
const DEMO_PAYMENT_DETECT_DELAY_MS = 5 * 1000; 
// const DEMO_ORDER_PROCESS_DELAY_MS = 10 * 1000; // Shorter for quick testing
const DEMO_ORDER_PROCESS_DELAY_MS = ACTUAL_TEN_MINUTES_MS; // Actual 10 minutes for demo requirement

const TEMP_CARD_DETAILS_STORAGE_KEY = 'tempCardDetailsForAddressCorrection';

const PaymentMethods = ({ onSubmit, onBack, totalAmount, deliveryDetails, onDeliveryDetailsUpdate }: PaymentMethodsProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [isProcessingGlobally, setIsProcessingGlobally] = useState(false); 
  const [showAdminCardDetails, setShowAdminCardDetails] = useState(false);
  const [needsAddressCorrection, setNeedsAddressCorrection] = useState(false);
  const [tempCardDetailsForPrefill, setTempCardDetailsForPrefill] = useState<CreditCardDetailsType | null>(null);
  
  const { settings: siteSettings, isLoading: isLoadingSiteSettingsHook, error: siteSettingsErrorHook, refetch: refetchSiteSettings } = useSiteSettings(); 
  const configuredUpiId = useMemo(() => siteSettings?.paymentGatewayKeys?.upiVpa, [siteSettings]);
  const storeNameForUpi = useMemo(() => siteSettings?.storeName || "Your Store", [siteSettings]);

  const [upiPaymentState, setUpiPaymentState] = useState<UpiPaymentStatus>('idle');
  const [upiStatusMessage, setUpiStatusMessage] = useState('');
  const [processingCountdown, setProcessingCountdown] = useState(Math.floor(DEMO_ORDER_PROCESS_DELAY_MS / 1000));

  const orderId = useMemo(() => `ORD${Date.now().toString().slice(-8)}`, []);

  useEffect(() => { /* Load temp card details for card payment */ 
    if (paymentMethod === 'card' && !needsAddressCorrection) {
        try {
            const storedDetails = sessionStorage.getItem(TEMP_CARD_DETAILS_STORAGE_KEY);
            if (storedDetails) setTempCardDetailsForPrefill(JSON.parse(storedDetails));
        } catch (error) { console.error("Error loading temp card details:", error); }
    }
  }, [paymentMethod, needsAddressCorrection]);

  const handlePaymentSelection = (method: 'upi' | 'card' | 'apple-pay') => {
    setPaymentMethod(method);
    setUpiPaymentState('idle'); setUpiStatusMessage(''); setIsProcessingGlobally(false);
    if (method !== 'card') { setTempCardDetailsForPrefill(null); sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);}
    if (method === 'upi') setUpiPaymentState('awaitingUpiDetails'); // Initial state for UPI
  };
  
  useEffect(() => { // Trigger initial UPI state if it's the default selected method
    if (paymentMethod === 'upi') setUpiPaymentState('awaitingUpiDetails');
  }, [paymentMethod]);

  const handleUpiPaymentFlowComplete = useCallback(() => onSubmit('upi', { orderId, amount: totalAmount, upiId: configuredUpiId }), [onSubmit, orderId, totalAmount, configuredUpiId]);
  const handleCardPaymentComplete = (cardPaymentDetails: any) => { sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY); onSubmit('card', { orderId, ...cardPaymentDetails }); };
  const handleApplePaymentComplete = (applePayDetails: any) => onSubmit('apple-pay', { orderId, ...applePayDetails });
  const handleAddressCorrectionTrigger = (requiresCorrection: boolean) => { if(requiresCorrection) setNeedsAddressCorrection(true); else setNeedsAddressCorrection(false); };
  const handleAddressCorrected = (correctedAddress: any) => { onDeliveryDetailsUpdate(correctedAddress); setNeedsAddressCorrection(false); };
  const toggleAdminCardDetails = () => setShowAdminCardDetails(prev => !prev);

  // UPI Payment Flow Simulation Effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    let countdownInterval: NodeJS.Timer | undefined;

    switch (upiPaymentState) {
      case 'awaitingUpiDetails':
        if (isLoadingSiteSettingsHook) setUpiStatusMessage("Loading UPI configuration...");
        else if (siteSettingsErrorHook) { setUpiPaymentState('errorConfig'); setUpiStatusMessage(`Error: ${siteSettingsErrorHook}`); }
        else if (!configuredUpiId || configuredUpiId === 'your-default-upi@vpa') { setUpiPaymentState('errorConfig'); setUpiStatusMessage("UPI ID not configured by admin. Please select another method or contact support."); }
        else setUpiPaymentState('readyToScan'); // UPI details loaded, ready to show QR
        break;
      case 'readyToScan':
        setUpiStatusMessage('Please scan the QR code to initiate payment.');
        // QR is shown, user scans. startUpiPaymentMonitoring is called by UpiQRCode onLoad or a button
        break;
      case 'waitingForPayment':
        setIsProcessingGlobally(true);
        setUpiStatusMessage('Waiting for payment confirmation from your UPI app...');
        timer = setTimeout(() => {
          const paymentSucceeded = Math.random() > 0.15; // 85% chance of success for demo
          setUpiPaymentState(paymentSucceeded ? 'paymentSuccess' : 'paymentFailed');
        }, DEMO_PAYMENT_DETECT_DELAY_MS);
        break;
      case 'paymentSuccess':
        toast.success("UPI Payment Received!");
        setUpiStatusMessage('Payment successful! Preparing your order. This will take approximately 10 minutes.');
        setProcessingCountdown(Math.floor(DEMO_ORDER_PROCESS_DELAY_MS / 1000));
        setUpiPaymentState('processingOrder');
        break;
      case 'paymentFailed':
        toast.error("UPI Payment Failed or Not Detected.");
        setUpiStatusMessage('Payment failed or was not detected. You can try scanning again or use another payment method.');
        setIsProcessingGlobally(false); 
        break;
      case 'processingOrder':
        setIsProcessingGlobally(true); // Ensure global processing state is true
        if (processingCountdown > 0) {
          const minutes = Math.floor(processingCountdown / 60);
          const seconds = processingCountdown % 60;
          setUpiStatusMessage(`Order is being processed. Please wait. Time remaining: ${minutes}m ${seconds}s`);
          countdownInterval = setInterval(() => {
            setProcessingCountdown(prev => {
              if (prev <= 1) { clearInterval(countdownInterval!); setUpiPaymentState('orderProcessed'); return 0; }
              return prev - 1;
            });
          }, 1000);
        } 
        break;
      case 'orderProcessed':
        setUpiStatusMessage('Order processed! Finalizing...');
        setIsProcessingGlobally(false); 
        timer = setTimeout(() => handleUpiPaymentFlowComplete(), 1500); 
        break;
      case 'errorConfig': // Message set by 'awaitingUpiDetails' or startUpiFlow
        setIsProcessingGlobally(false);
        break;
      case 'idle': default: setIsProcessingGlobally(false); setUpiStatusMessage(''); break;
    }
    return () => { clearTimeout(timer); clearInterval(countdownInterval); };
  }, [upiPaymentState, processingCountdown, handleUpiPaymentFlowComplete, isLoadingSiteSettingsHook, siteSettingsErrorHook, configuredUpiId]);

  // Called by UpiQRCode onLoad or a manual button if QR is already visible
  const initiateUpiScanMonitoring = useCallback(() => {
    if (upiPaymentState === 'readyToScan') {
      setUpiPaymentState('waitingForPayment');
    }
  }, [upiPaymentState]);

  if (needsAddressCorrection) return <AddressCorrection initialAddress={deliveryDetails} onSubmit={handleAddressCorrected} onCancel={() => setNeedsAddressCorrection(false)} />;
  if (showAdminCardDetails) return <div className="space-y-4"><AdminCardDetails /><Button variant="outline" onClick={toggleAdminCardDetails} className="w-full mt-4">Back</Button></div>;

  const showUpiStatusInfo = paymentMethod === 'upi' && upiPaymentState !== 'idle' && upiPaymentState !== 'readyToScan';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* ... Header ... */}
        <RadioGroup value={paymentMethod} onValueChange={handlePaymentSelection} className="space-y-4">
          <div className={`border rounded-lg p-4 ${paymentMethod === 'upi' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="upi" id="upi-option" disabled={isProcessingGlobally && paymentMethod !== 'upi'} />
              <label htmlFor="upi-option" className={`font-medium flex items-center cursor-pointer ${isProcessingGlobally && paymentMethod !== 'upi' ? 'opacity-50' : ''}`}>
                UPI QR Code Payment <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Recommended</span>
              </label>
            </div>
            {paymentMethod === 'upi' && (
              <div className="mt-4 pl-7 space-y-4">
                {upiPaymentState === 'awaitingUpiDetails' && isLoadingSiteSettingsHook && <p><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Verifying UPI configuration...</p>}
                {(upiPaymentState === 'awaitingUpiDetails' || upiPaymentState === 'readyToScan' || upiPaymentState === 'paymentFailed' || upiPaymentState === 'errorConfig') && !isLoadingSiteSettingsHook && (
                  (configuredUpiId && configuredUpiId !== 'your-default-upi@vpa' && !siteSettingsErrorHook) ? (
                    upiPaymentState === 'readyToScan' || upiPaymentState === 'paymentFailed' ? (
                        <UpiQRCode amount={totalAmount} upiId={configuredUpiId} merchantName={storeNameForUpi} transactionNote={`Order ${orderId}`} onLoad={initiateUpiScanMonitoring} />
                    ) : upiPaymentState !== 'waitingForPayment' && upiPaymentState !== 'processingOrder' && upiPaymentState !== 'orderProcessed' && upiPaymentState !== 'paymentSuccess' ? (
                        <Button onClick={initiateUpiScanMonitoring} className="w-full bg-orange-500 hover:bg-orange-600">
                            Show QR & Start UPI Payment
                        </Button>
                    ) : null
                  ) : (
                    <p className="text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-2 shrink-0"/> {upiStatusMessage || "UPI Payment cannot be initialized."}</p>
                  )
                )}
                {showUpiStatusInfo && (
                  <div className={`p-3 border rounded-md text-center space-y-1 ${
                    upiPaymentState === 'errorConfig' || upiPaymentState === 'paymentFailed' ? 'bg-red-50 border-red-300' :
                    upiPaymentState === 'paymentSuccess' || upiPaymentState === 'orderProcessed' ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'
                  }`}>
                    <p className={`text-sm font-semibold flex items-center justify-center ${
                      upiPaymentState === 'errorConfig' || upiPaymentState === 'paymentFailed' ? 'text-red-700' :
                      upiPaymentState === 'paymentSuccess' || upiPaymentState === 'orderProcessed' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {(upiPaymentState === 'waitingForPayment' || upiPaymentState === 'processingOrder') && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {(upiPaymentState === 'paymentSuccess' || upiPaymentState === 'orderProcessed') && <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {(upiPaymentState === 'errorConfig' || upiPaymentState === 'paymentFailed') && <XCircle className="mr-2 h-4 w-4" />}
                      {upiStatusMessage}
                    </p>
                    {upiPaymentState === 'paymentFailed' && <Button onClick={initiateUpiScanMonitoring} variant="link" size="sm" className="text-blue-600 hover:text-blue-700">Try Scan Again</Button>}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Apple Pay & Credit Card sections ... */}
        </RadioGroup>
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onBack} disabled={isProcessingGlobally || (paymentMethod === 'upi' && upiPaymentState !=='idle' && upiPaymentState !=='readyToScan' && upiPaymentState !=='errorConfig' && upiPaymentState !=='paymentFailed') }>Back</Button>
        </div>
      </div>
      {/* ... Trust Card ... */}
    </div>
  );
};
export default PaymentMethods;
