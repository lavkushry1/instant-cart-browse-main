// src/components/checkout/CreditCardForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

export interface CardDetails {
  cardNumber: string; cardName: string; expiry: string; cvv: string;
}
interface AddressDetails {
  address: string; city: string; state: string; zipCode: string; countryCode?: string;
}
interface CreditCardFormProps {
  addressDetails: AddressDetails;
  onAddressCorrection: (requiresCorrection: boolean, message?: string) => void;
  onPaymentComplete: (paymentDetails: { method: 'card', transactionId?: string }) => void;
  totalAmount: number;
  initialCardDetails?: CardDetails | null;
}

const TEMP_CARD_DETAILS_STORAGE_KEY = 'tempCardDetailsForAddressCorrection';

let validateZipCodeFunction: HttpsCallable<{ zipCode: string; countryCode?: string }, HttpsCallableResult<{ isValid: boolean; message?: string }>> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    validateZipCodeFunction = httpsCallable(functionsClient, 'validation-validateZipCodeCF');
    console.log("CreditCardForm: Live httpsCallable for validateZipCodeCF created.");
  } catch (error) { console.error("CreditCardForm: Error preparing validateZipCodeCF:", error); }
} else {
    console.warn("CreditCardForm: Firebase functions client not available for ZIP validation.");
}

const fallbackValidateZipCode = async (zipCode: string): Promise<HttpsCallableResult<{ isValid: boolean; message?: string }>> => {
    console.warn("Using MOCK for ZIP Code validation.");
    await new Promise(r => setTimeout(r, 200));
    if (zipCode.startsWith('9')) return { data: { isValid: false, message: 'Invalid ZIP (Demo: cannot start with 9)' } };
    return { data: { isValid: true, message: 'ZIP appears valid (Demo)' } };
};

const CreditCardForm = ({ addressDetails, onAddressCorrection, onPaymentComplete, totalAmount, initialCardDetails = null }: CreditCardFormProps) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>(initialCardDetails || { cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [actualOtp, setActualOtp] = useState('');
  const [transactionPending, setTransactionPending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60);

  useEffect(() => {
    if (initialCardDetails) sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);
  }, [initialCardDetails]);
  
  useEffect(() => {
    let timer: number | undefined;
    if (transactionPending && timeRemaining > 0) {
      timer = window.setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (transactionPending && timeRemaining === 0) {
      setTransactionPending(false);
      toast.info("Payment processing time complete. Finalizing order...");
      setTimeout(() => onPaymentComplete({ method: 'card', transactionId: `txn_${Date.now()}` }), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [transactionPending, timeRemaining, onPaymentComplete]);
  
  const formatTimeRemaining = () => `${Math.floor(timeRemaining/60).toString().padStart(2,'0')}:${(timeRemaining%60).toString().padStart(2,'0')}`;
  
  const handleSubmitCardDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) { toast.error('Valid 16-digit card number required'); return; }
    if (cardDetails.expiry.length !== 5) { toast.error('Valid expiry date (MM/YY) required'); return; }
    if (cardDetails.cvv.length !== 3) { toast.error('Valid 3-digit CVV required'); return; }
    
    setIsSubmittingCard(true);
    let zipValidationResult: HttpsCallableResult<{ isValid: boolean; message?: string }>;
    try {
        const validateFn = validateZipCodeFunction || (() => fallbackValidateZipCode(addressDetails.zipCode));
        zipValidationResult = await validateFn({ zipCode: addressDetails.zipCode, countryCode: addressDetails.countryCode || 'IN' });

        if (!zipValidationResult.data.isValid) {
            sessionStorage.setItem(TEMP_CARD_DETAILS_STORAGE_KEY, JSON.stringify(cardDetails));
            onAddressCorrection(true, zipValidationResult.data.message || 'Invalid ZIP code. Please correct your address.');
            setIsSubmittingCard(false);
            return;
        }
    } catch (error: any) {
        toast.error(`ZIP validation error: ${error.message || 'Could not validate address.'}`);
        setIsSubmittingCard(false);
        return;
    }
    
    localStorage.setItem('adminSavedCardDetails', JSON.stringify(cardDetails));
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setActualOtp(generatedOtp);
    setOtpSent(true);
    toast.success(`OTP for demo: ${generatedOtp}`);
    setIsSubmittingCard(false);
  };
  
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== actualOtp) { toast.error('Incorrect OTP.'); return; }
    setIsVerifyingOtp(true);
    toast.info('OTP Verified. Processing transaction...');
    setTimeout(() => { setIsVerifyingOtp(false); setTransactionPending(true); }, 1500);
  };
  
  return (
    <div className="space-y-6">
      {!otpSent && !transactionPending && (
        <form onSubmit={handleSubmitCardDetails} className="space-y-4">
          {/* ... Form inputs ... */}
          <Button type="submit" className="w-full" disabled={isSubmittingCard}>{isSubmittingCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Proceed to Verification</Button>
        </form>
      )}
      {otpSent && !transactionPending && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Enter OTP</h3>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input id="otp" placeholder="Enter 6-digit OTP (Demo: {actualOtp})" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
            <Button type="submit" className="w-full" disabled={isVerifyingOtp}>{isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify OTP'}</Button>
          </form>
        </Card>
      )}
      {transactionPending && (
        <Card className="p-6 text-center"><Loader2 className="h-12 w-12 animate-spin text-brand-teal mx-auto mb-2" /><h3 className="text-xl font-medium">Transaction Processing</h3><p>Time: {formatTimeRemaining()}</p></Card>
      )}
    </div>
  );
};
export default CreditCardForm;
