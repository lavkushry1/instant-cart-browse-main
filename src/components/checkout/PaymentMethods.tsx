import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import UpiQRCode from './UpiQRCode';
import CreditCardForm from './CreditCardForm';
import ApplePayButton from './ApplePayButton';
import AddressCorrection from './AddressCorrection';
import AdminCardDetails from './AdminCardDetails';

interface PaymentMethodsProps {
  onSubmit: (paymentMethod: 'upi' | 'card' | 'apple-pay') => void;
  onBack: () => void;
  totalAmount: number;
  deliveryDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const PaymentMethods = ({ onSubmit, onBack, totalAmount, deliveryDetails }: PaymentMethodsProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple-pay'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdminCardDetails, setShowAdminCardDetails] = useState(false);
  const [needsAddressCorrection, setNeedsAddressCorrection] = useState(false);
  
  // Get UPI ID from localStorage or use default
  // In a real app, this would come from your backend/admin settings
  const upiId = localStorage.getItem('storeUpiId') || 'store@yesbank';
  
  // Generate a unique order ID for this transaction
  const orderId = `ORD${Date.now().toString().slice(-8)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For card payments, process now handled in the CreditCardForm
    if (paymentMethod === 'card') {
      // Processing delegated to CreditCardForm component
    } else if (paymentMethod === 'apple-pay') {
      // Processing delegated to ApplePayButton component
    } else {
      // For UPI, we don't immediately proceed - we wait for verification
      // This is handled by the UpiQRCode component
    }
  };

  const handleUpiPaymentConfirmed = () => {
    // Wait a short while then redirect to confirmation
    setTimeout(() => {
      onSubmit('upi');
    }, 1000);
  };
  
  const handleCardPaymentComplete = () => {
    onSubmit('card');
  };
  
  const handleApplePaymentComplete = () => {
    onSubmit('apple-pay');
  };
  
  const handleAddressCorrection = (incorrectZip: boolean) => {
    if (incorrectZip) {
      setNeedsAddressCorrection(true);
    }
  };
  
  const handleAddressCorrected = (correctedAddress) => {
    // In a real app, we would update the delivery details in the parent component
    setNeedsAddressCorrection(false);
  };
  
  const handleCancelAddressCorrection = () => {
    setNeedsAddressCorrection(false);
  };
  
  const toggleAdminCardDetails = () => {
    setShowAdminCardDetails(prev => !prev);
  };

  // If address correction is needed, show the address correction form
  if (needsAddressCorrection) {
    return (
      <AddressCorrection 
        initialAddress={{
          address: deliveryDetails.address,
          city: deliveryDetails.city,
          state: deliveryDetails.state,
          zipCode: deliveryDetails.zipCode
        }}
        onSubmit={handleAddressCorrected}
        onCancel={handleCancelAddressCorrection}
      />
    );
  }
  
  // If admin card details are shown, show the admin card details
  if (showAdminCardDetails) {
    return (
      <div className="space-y-4">
        <AdminCardDetails />
        <Button 
          variant="outline" 
          onClick={toggleAdminCardDetails}
          className="w-full mt-4"
        >
          Back to Payment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Payment Method</h2>
          <button 
            onClick={toggleAdminCardDetails} 
            className="text-sm text-gray-500 underline"
          >
            Admin Access
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value: 'upi' | 'card' | 'apple-pay') => setPaymentMethod(value)}
            className="space-y-4"
          >
            {/* UPI Payment */}
            <div className={`border rounded-lg p-4 ${paymentMethod === 'upi' ? 'border-brand-teal' : 'border-gray-200'}`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="upi" id="upi" />
                <div className="flex-1">
                  <label htmlFor="upi" className="font-medium flex items-center">
                    UPI QR Code Payment
                    <div className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Recommended</div>
                  </label>
                  
                  {paymentMethod === 'upi' && (
                    <div className="mt-4">
                      <UpiQRCode 
                        amount={totalAmount}
                        orderId={orderId}
                        upiId={upiId}
                        onPaymentConfirmed={handleUpiPaymentConfirmed}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Apple Pay */}
            <div className={`border rounded-lg p-4 ${paymentMethod === 'apple-pay' ? 'border-brand-teal' : 'border-gray-200'}`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="apple-pay" id="apple-pay" />
                <div className="flex-1">
                  <label htmlFor="apple-pay" className="font-medium flex items-center">
                    Apple Pay
                    <div className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Fast Checkout</div>
                  </label>
                  
                  {paymentMethod === 'apple-pay' && (
                    <div className="mt-4">
                      <ApplePayButton 
                        amount={totalAmount}
                        orderId={orderId}
                        onPaymentConfirmed={handleApplePaymentComplete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Credit/Debit Card */}
            <div className={`border rounded-lg p-4 ${paymentMethod === 'card' ? 'border-brand-teal' : 'border-gray-200'}`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="card" id="card" />
                <div className="flex-1">
                  <label htmlFor="card" className="font-medium">Credit / Debit Card</label>
                  
                  {paymentMethod === 'card' && (
                    <div className="mt-4">
                      <CreditCardForm 
                        addressDetails={{
                          address: deliveryDetails.address,
                          city: deliveryDetails.city,
                          state: deliveryDetails.state,
                          zipCode: deliveryDetails.zipCode
                        }}
                        onAddressCorrection={handleAddressCorrection}
                        onPaymentComplete={handleCardPaymentComplete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
          
          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={onBack}
              disabled={isProcessing}
            >
              Back to Delivery
            </Button>
          </div>
        </form>
      </div>
      
      {/* Trust indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Secure Payment</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                🔒
              </div>
              <div>
                <p className="font-medium">256-bit encryption</p>
                <p>Bank-level security</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                🛡️
              </div>
              <div>
                <p className="font-medium">PCI DSS Compliant</p>
                <p>Industry standard protection</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethods;
