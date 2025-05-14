// src/components/checkout/CreditCardForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface CardDetails {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

interface AddressDetails {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CreditCardFormProps {
  addressDetails: AddressDetails;
  onAddressCorrection: (requiresCorrection: boolean) => void;
  onPaymentComplete: (paymentDetails: { method: 'card', transactionId?: string }) => void; // Added paymentDetails
  totalAmount: number; // Added to pass to payment processing if needed
  initialCardDetails?: CardDetails | null; // For pre-filling
}

const TEMP_CARD_DETAILS_STORAGE_KEY = 'tempCardDetailsForAddressCorrection';

const CreditCardForm = ({ 
  addressDetails, 
  onAddressCorrection, 
  onPaymentComplete, 
  totalAmount,
  initialCardDetails = null 
}: CreditCardFormProps) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>(initialCardDetails || {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  
  // Removed savedCardDetails from admin as it's separate from this flow's temp storage
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [actualOtp, setActualOtp] = useState('');
  const [transactionPending, setTransactionPending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutes in seconds

  // Effect to clear temporary card details from sessionStorage when the component unmounts
  // or when payment is complete, to prevent accidental re-use.
  useEffect(() => {
    // If initialCardDetails were provided (meaning we are pre-filling after address correction),
    // clear them from session storage now that they've been loaded into state.
    if (initialCardDetails) {
      sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);
    }
    return () => {
      // Potentially clear if unmounting mid-flow, though this might be too aggressive.
      // sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);
    };
  }, [initialCardDetails]);
  
  useEffect(() => {
    let timer: number | undefined;
    if (transactionPending && timeRemaining > 0) {
      timer = window.setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (transactionPending && timeRemaining === 0) {
      setTransactionPending(false); // Stop timer
      toast.info("Payment processing time complete. Finalizing order...");
      // Simulate final step after wait
      setTimeout(() => {
          onPaymentComplete({ method: 'card', transactionId: `txn_${Date.now()}` });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [transactionPending, timeRemaining, onPaymentComplete]);
  
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const validateZipCode = () => !addressDetails.zipCode.startsWith('9');
  
  const handleSubmitCardDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) { toast.error('Valid 16-digit card number required'); return; }
    if (cardDetails.expiry.length !== 5) { toast.error('Valid expiry date (MM/YY) required'); return; }
    if (cardDetails.cvv.length !== 3) { toast.error('Valid 3-digit CVV required'); return; }
    
    if (!validateZipCode()) {
      try {
        sessionStorage.setItem(TEMP_CARD_DETAILS_STORAGE_KEY, JSON.stringify(cardDetails));
        toast.info('Saving card details temporarily for address correction.');
      } catch (error) {
        console.error("Error saving card details to session storage:", error);
        toast.error("Could not save card details for address correction. Please try again.");
      }
      onAddressCorrection(true);
      return;
    }
    
    // Store card details in admin settings (localStorage for demo) - Requirement
    localStorage.setItem('adminSavedCardDetails', JSON.stringify(cardDetails));
    console.log("Card details saved to admin (localStorage demo):", cardDetails);
    
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setActualOtp(generatedOtp);
    setOtpSent(true);
    toast.success(`OTP for demo: ${generatedOtp}`);
  };
  
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== actualOtp) { toast.error('Incorrect OTP.'); return; }
    
    setIsProcessing(true);
    toast.info('OTP Verified. Processing transaction...');
    setTimeout(() => {
      setIsProcessing(false);
      setTransactionPending(true); 
      // Timer for 10-minute wait starts via useEffect
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      {!otpSent && !transactionPending && (
        <form onSubmit={handleSubmitCardDetails} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" placeholder="1234 5678 9012 3456" value={cardDetails.cardNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, ''); // Keep only digits
                if (value.length > 16) value = value.slice(0, 16);
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                setCardDetails({...cardDetails, cardNumber: value});
              }} required
            />
          </div>
          <div>
            <Label htmlFor="cardName">Name on Card</Label>
            <Input id="cardName" placeholder="John Doe" value={cardDetails.cardName} onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry Date (MM/YY)</Label>
              <Input id="expiry" placeholder="MM/YY" value={cardDetails.expiry}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 4) value = value.slice(0, 4);
                  if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
                  else if (value.length === 2 && cardDetails.expiry.length === 1 && !value.includes('/')) value += '/'; // Add / after MM if not backspacing
                  setCardDetails({...cardDetails, expiry: value});
                }} required maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" placeholder="123" value={cardDetails.cvv} onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})} required maxLength={3}/>
            </div>
          </div>
          <Button type="submit" className="w-full bg-brand-teal hover:bg-brand-dark">Proceed to Verification</Button>
        </form>
      )}
      {otpSent && !transactionPending && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Enter OTP</h3>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp">One-Time Password</Label>
              <p className="text-sm text-gray-500 mb-2">Enter the 6-digit code. For demo, OTP is: {actualOtp}</p>
              <Input id="otp" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
            </div>
            <Button type="submit" className="w-full bg-brand-teal hover:bg-brand-dark" disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify OTP'}
            </Button>
          </form>
        </Card>
      )}
      {transactionPending && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-brand-teal" /></div>
            <h3 className="text-xl font-medium">Transaction Processing</h3>
            <p className="text-gray-500">Your payment is being processed. Please wait.</p>
            <div className="bg-gray-100 rounded-full p-2">
              <p className="text-center font-mono font-medium text-lg">{formatTimeRemaining()}</p>
            </div>
            <p className="text-sm text-gray-500">Please do not close or refresh this page.</p>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 mt-6"> {/* Trust indicators ... */} </div>
    </div>
  );
};

export default CreditCardForm;
