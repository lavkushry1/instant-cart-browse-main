// src/components/checkout/UpiQRCode.tsx
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Loader2, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

interface UpiQRCodeProps {
  amount: number;
  upiId: string; // Admin-configured UPI ID (VPA)
  merchantName?: string; // Optional: Store name or merchant name
  transactionNote?: string; // Optional: Note for the transaction, e.g., Order ID
  onLoad?: () => void; // Callback when QR code data is ready
  onError?: (error: Error) => void; // Callback for any errors during QR generation
  onStatusUpdate?: (status: 'pending' | 'success' | 'failed') => void; // Callback for payment status
}

type PaymentStatus = 'generating' | 'ready' | 'error' | 'scanning' | 'processing' | 'success' | 'failed';

const UpiQRCode: React.FC<UpiQRCodeProps> = ({
  amount,
  upiId,
  merchantName = 'Flipkart Store',
  transactionNote = 'Order Payment',
  onLoad,
  onError,
  onStatusUpdate
}) => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('generating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(300); // 5 minute countdown

  // Generate UPI QR code
  useEffect(() => {
    if (!upiId || amount <= 0) {
      const errorMsg = 'Invalid UPI ID or amount for QR code generation.';
      console.error(errorMsg);
      if (onError) onError(new Error(errorMsg));
      setErrorMessage(errorMsg);
      setPaymentStatus('error');
      return;
    }

    try {
      // Construct the UPI payment string
      // Standard UPI QR Code string format: upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&tn=<TransactionNote>&cu=INR
      const params = new URLSearchParams();
      params.append('pa', upiId);
      params.append('pn', encodeURIComponent(merchantName));
      params.append('am', amount.toFixed(2));
      params.append('tn', encodeURIComponent(transactionNote));
      params.append('cu', 'INR');
      params.append('tr', `trx_${Date.now()}`); // Transaction reference ID

      const upiString = `upi://pay?${params.toString()}`;
      setQrData(upiString);
      setPaymentStatus('ready');
      
      if (onLoad) onLoad();
    } catch (error) {
      console.error('Error generating UPI QR code:', error);
      setErrorMessage('Failed to generate QR code. Please try again.');
      setPaymentStatus('error');
      if (onError && error instanceof Error) onError(error);
    }
  }, [amount, upiId, merchantName, transactionNote, onLoad, onError]);

  // Handle payment simulation (for demo purposes)
  useEffect(() => {
    if (paymentStatus !== 'ready') return;
    
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Simulate user scanning QR code after some time
    const scanTimeout = setTimeout(() => {
      setPaymentStatus('scanning');
    }, 5000);
    
    // Simulate payment processing after some time
    const processTimeout = setTimeout(() => {
      setPaymentStatus('processing');
    }, 12000);
    
    // Simulate payment success/failure after some time
    const resultTimeout = setTimeout(() => {
      // For demo, let's make it succeed most of the time
      if (Math.random() > 0.2) {
        setPaymentStatus('success');
        if (onStatusUpdate) onStatusUpdate('success');
      } else {
        setPaymentStatus('failed');
        if (onStatusUpdate) onStatusUpdate('failed');
      }
    }, 15000);
    
    return () => {
      clearInterval(timer);
      clearTimeout(scanTimeout);
      clearTimeout(processTimeout);
      clearTimeout(resultTimeout);
    };
  }, [paymentStatus, onStatusUpdate]);

  // Format countdown as MM:SS
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (paymentStatus === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <Loader2 className="h-10 w-10 text-flipkart-blue animate-spin mb-4" />
        <p className="text-flipkart-body font-medium">Generating UPI QR Code...</p>
      </div>
    );
  }

  // Error state
  if (paymentStatus === 'error' || !qrData) {
    return (
      <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-semibold mb-2 text-red-500">Error</h3>
        <p className="text-center text-flipkart-body mb-3">{errorMessage || "Could not generate UPI QR Code."}</p>
        <p className="text-center text-flipkart-small text-gray-500">
          Please try another payment method or contact customer support.
        </p>
      </div>
    );
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
        <p className="text-center mb-4">
          Your payment of <span className="font-semibold">₹{amount.toFixed(2)}</span> has been received.
        </p>
        <p className="text-center text-flipkart-small text-gray-500">
          Processing your order... Please wait.
        </p>
      </div>
    );
  }

  // Failed state
  if (paymentStatus === 'failed') {
    return (
      <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-red-600">Payment Failed</h3>
        <p className="text-center mb-4">
          We couldn't process your payment. Please try again.
        </p>
        <p className="text-center text-flipkart-small text-gray-500">
          If the issue persists, please try another payment method.
        </p>
      </div>
    );
  }

  // Default QR code display state
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-flipkart-header-md font-semibold mb-2">Scan & Pay with UPI</h3>
      <p className="text-flipkart-small text-gray-500 mb-4">
        Time remaining: <span className="font-medium">{formatCountdown()}</span>
      </p>
      
      <div className="p-3 bg-white border rounded-lg mb-4 relative">
        <QRCode 
          value={qrData} 
          size={220}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
        />
        
        {paymentStatus === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded-lg">
            <div className="bg-white p-3 rounded-md shadow-lg">
              <p className="text-flipkart-body font-medium text-flipkart-blue animate-pulse">
                QR code being scanned...
              </p>
            </div>
          </div>
        )}
        
        {paymentStatus === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded-lg">
            <div className="bg-white p-3 rounded-md shadow-lg flex flex-col items-center">
              <Loader2 className="h-6 w-6 text-flipkart-blue animate-spin mb-2" />
              <p className="text-flipkart-body font-medium">Processing payment...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md mb-3 w-full">
        <ShieldCheck className="h-5 w-5 text-flipkart-blue" />
        <p className="text-xs text-flipkart-blue">
          <span className="font-medium">Amount:</span> ₹{amount.toFixed(2)}
        </p>
      </div>
      
      <div className="text-flipkart-small text-gray-500 space-y-1 w-full">
        <p><span className="font-medium">UPI ID:</span> {upiId}</p>
        <p><span className="font-medium">Merchant:</span> {merchantName}</p>
        <p><span className="font-medium">Note:</span> {transactionNote}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 w-full">
        <p className="text-xs text-center text-gray-500">
          Scan with any UPI app like Google Pay, PhonePe, Paytm, Amazon Pay, or BHIM UPI
        </p>
        <div className="flex justify-center gap-3 mt-3">
          <img src="/payment/gpay.png" alt="Google Pay" className="h-6" />
          <img src="/payment/phonepe.png" alt="PhonePe" className="h-6" />
          <img src="/payment/paytm.png" alt="Paytm" className="h-6" />
          <img src="/payment/amazonpay.png" alt="Amazon Pay" className="h-6" />
        </div>
      </div>
    </div>
  );
};

export default UpiQRCode;

export default UpiQRCode;
