import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { Loader2, CheckCircle2, Copy, RefreshCw } from 'lucide-react';

interface UpiQRCodeProps {
  amount: number;
  orderId: string;
  upiId: string;
  onPaymentConfirmed: () => void;
}

const UpiQRCode = ({ amount, orderId, upiId, onPaymentConfirmed }: UpiQRCodeProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  
  // Format the amount to 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Generate UPI payment URL
  // Format: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT&cu=CURRENCY&tn=TRANSACTION_NOTE
  const upiPaymentUrl = `upi://pay?pa=${upiId}&pn=InstantCart&am=${formattedAmount}&cu=INR&tn=Order ${orderId}`;
  
  // Mock payment verification (in a real implementation, this would be an API call to a payment gateway)
  const verifyPayment = async () => {
    setIsVerifying(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll randomly consider payment as successful with 30% chance
      // or if it's the 3rd attempt (to ensure the flow can be tested)
      const isSuccessful = Math.random() < 0.3 || verificationAttempts >= 2;
      
      if (isSuccessful) {
        setIsPaymentConfirmed(true);
        toast.success('Payment confirmed! Your order has been placed.');
    
        // Wait a moment before redirecting to the success page
    setTimeout(() => {
        onPaymentConfirmed();
        }, 1500);
      } else {
        // Increment verification attempts
        setVerificationAttempts(prev => prev + 1);
        toast.error('Payment not detected yet. Please complete the payment or try again.');
      }
    } catch (error) {
      toast.error('Failed to verify payment. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Auto-verify payment after QR code is displayed
  useEffect(() => {
    // Automatically start verification after 10 seconds
    const timer = setTimeout(() => {
      if (!isPaymentConfirmed && !isVerifying) {
        verifyPayment();
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [isPaymentConfirmed, isVerifying]);
  
  // Copy UPI ID to clipboard
  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId)
      .then(() => toast.success('UPI ID copied to clipboard'))
      .catch(() => toast.error('Failed to copy UPI ID'));
  };

  return (
    <Card className="p-6 flex flex-col items-center space-y-6">
      {isPaymentConfirmed ? (
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h3 className="text-xl font-medium">Payment Successful!</h3>
          <p className="text-gray-500">
            Your payment of ₹{formattedAmount} has been confirmed.
            <br />
            Your order is being processed.
        </p>
      </div>
      ) : (
        <>
          <div className="text-center mb-2">
            <h3 className="text-xl font-medium">Scan to Pay</h3>
            <p className="text-sm text-gray-500 mt-1">
              Use any UPI app to scan this QR code
            </p>
            <div className="flex items-center justify-center mt-2">
              <p className="text-2xl font-bold text-brand-teal">₹{formattedAmount}</p>
            </div>
        </div>
        
          <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
            <QRCode 
              value={upiPaymentUrl} 
              size={200}
              level="H"
              fgColor="#000000"
              bgColor="#ffffff"
            />
      </div>
      
          <div className="text-center w-full space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <p className="text-sm font-medium">UPI ID:</p>
              <p className="text-sm font-mono bg-gray-100 py-1 px-2 rounded">{upiId}</p>
        <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyUpiId}
                title="Copy UPI ID"
              >
                <Copy className="h-4 w-4" />
        </Button>
        </div>
      
          <Button 
            onClick={verifyPayment} 
              disabled={isVerifying}
            className="w-full bg-brand-teal hover:bg-brand-dark"
          >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Payment...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verify Payment
                </>
              )}
          </Button>
            
            <p className="text-xs text-gray-500">
              {verificationAttempts > 0 ? (
                `Verification attempt ${verificationAttempts} - please ensure you've completed the payment`
              ) : (
                "After payment, verification will happen automatically"
              )}
            </p>
        </div>
        </>
      )}
    </Card>
  );
};

export default UpiQRCode;
