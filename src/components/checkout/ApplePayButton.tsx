import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Apple } from 'lucide-react';

// Add TypeScript declaration for ApplePaySession
declare global {
  interface Window {
    ApplePaySession?: {
      canMakePayments: () => boolean;
    };
  }
}

interface ApplePayButtonProps {
  amount: number;
  orderId: string;
  onPaymentConfirmed: () => void;
}

const ApplePayButton = ({ amount, orderId, onPaymentConfirmed }: ApplePayButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  
  // Format the amount to 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Check if Apple Pay is available in the browser
  const isApplePayAvailable = () => {
    // This is a simplified check for demo purposes only
    // In a real implementation, we would use Stripe's isApplePaySupported() method
    return false; // Always returns false since this is just a demo
  };

  // Mock Apple Pay payment flow
  const initiateApplePay = async () => {
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would be integrated with Stripe's Apple Pay flow
      // For demo purposes, we'll simulate a payment flow with a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful payment
      setIsPaymentConfirmed(true);
      toast.success('Apple Pay payment successful!');
      
      // Wait a moment before redirecting to the success page
      setTimeout(() => {
        onPaymentConfirmed();
      }, 1500);
    } catch (error) {
      toast.error('Apple Pay payment failed. Please try another payment method.');
    } finally {
      setIsProcessing(false);
    }
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
            <h3 className="text-xl font-medium">Apple Pay</h3>
            <p className="text-sm text-gray-500 mt-1">
              Fast, secure checkout with Apple Pay
            </p>
            <div className="flex items-center justify-center mt-2">
              <p className="text-2xl font-bold text-brand-teal">₹{formattedAmount}</p>
            </div>
          </div>
          
          <Button 
            onClick={initiateApplePay} 
            disabled={isProcessing}
            className="w-full bg-black hover:bg-gray-900 text-white flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Apple className="mr-2 h-5 w-5" />
                Pay with Apple Pay
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            {isApplePayAvailable() ? 
              "Checkout securely using Apple Pay" : 
              "Apple Pay is not available on this device/browser. This is a demo button for display purposes."}
          </p>
        </>
      )}
    </Card>
  );
};

export default ApplePayButton; 