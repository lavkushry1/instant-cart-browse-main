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

// Define the expected direct return type from the Cloud Function
interface ValidateZipCodeCFResponse {
  success: boolean;
  validationResult: { 
    isValid: boolean; 
    message?: string;
    // Potentially other fields like placeName, state from actual ZipCodeValidationResult if needed here
  };
  error?: string; // If success can be false with an error message property
}

const TEMP_CARD_DETAILS_STORAGE_KEY = 'tempCardDetailsForAddressCorrection';

// Correctly type the HttpsCallable: Input type, and direct JSON Output type from CF
let validateZipCodeFunction: HttpsCallable<{ zipCode: string; countryCode?: string }, ValidateZipCodeCFResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    validateZipCodeFunction = httpsCallable(functionsClient, 'validation-validateZipCodeCF');
    console.log("CreditCardForm: Live httpsCallable for validateZipCodeCF created.");
  } catch (error) { console.error("CreditCardForm: Error preparing validateZipCodeCF:", error); }
} else {
    console.warn("CreditCardForm: Firebase functions client not available for ZIP validation.");
}

// Fallback should mimic the structure of the *direct data* returned by the HttpsCallableResult, not the whole HttpsCallableResult
const fallbackValidateZipCode = async (zipCode: string): Promise<ValidateZipCodeCFResponse> => {
    console.warn("Using MOCK for ZIP Code validation.");
    await new Promise(r => setTimeout(r, 200));
    if (zipCode.startsWith('9')) return { 
        success: false, 
        validationResult: { isValid: false, message: 'Invalid ZIP (Demo: cannot start with 9)' } 
    };
    return { 
        success: true, 
        validationResult: { isValid: true, message: 'ZIP appears valid (Demo)' } 
    };
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
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'rupay' | 'unknown'>('unknown');

  useEffect(() => {
    if (initialCardDetails) sessionStorage.removeItem(TEMP_CARD_DETAILS_STORAGE_KEY);
  }, [initialCardDetails]);

  // Determine card type based on card number prefix
  useEffect(() => {
    const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      setCardType('unknown');
      return;
    }
    
    if (cardNumber.startsWith('4')) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(cardNumber)) {
      setCardType('mastercard');
    } else if (/^6[0-9]/.test(cardNumber)) {
      setCardType('rupay');
    } else {
      setCardType('unknown');
    }
  }, [cardDetails.cardNumber]);
  
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
  
  // Format card number with spaces every 4 digits
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    
    return groups.join(' ');
  };
  
  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    }
    
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({ ...prev, cardNumber: formatted.slice(0, 19) })); // Limit to 19 chars (16 digits + 3 spaces)
  };
  
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setCardDetails(prev => ({ ...prev, expiry: formatted.slice(0, 5) })); // Limit to 5 chars (MM/YY)
  };
  
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setCardDetails(prev => ({ ...prev, cvv: digits.slice(0, 3) })); // Limit to 3 digits
  };
  
  const handleSubmitCardDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) { toast.error('Valid 16-digit card number required'); return; }
    if (cardDetails.expiry.length !== 5) { toast.error('Valid expiry date (MM/YY) required'); return; }
    if (cardDetails.cvv.length !== 3) { toast.error('Valid 3-digit CVV required'); return; }
    
    setIsSubmittingCard(true);
    let cfResponseData: ValidateZipCodeCFResponse;
    try {
        if (validateZipCodeFunction) {
            const result: HttpsCallableResult<ValidateZipCodeCFResponse> = await validateZipCodeFunction({ zipCode: addressDetails.zipCode, countryCode: addressDetails.countryCode || 'IN' });
            cfResponseData = result.data;
        } else {
            cfResponseData = await fallbackValidateZipCode(addressDetails.zipCode);
        }

        if (!cfResponseData.success || !cfResponseData.validationResult.isValid) {
            sessionStorage.setItem(TEMP_CARD_DETAILS_STORAGE_KEY, JSON.stringify(cardDetails));
            onAddressCorrection(true, cfResponseData.validationResult.message || cfResponseData.error || 'Invalid ZIP code. Please correct your address.');
            setIsSubmittingCard(false);
            return;
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Could not validate address.';
        toast.error(`ZIP validation error: ${message}`);
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
          <div><Label htmlFor="cardName">Name on Card</Label><Input id="cardName" value={cardDetails.cardName} onChange={e => setCardDetails({...cardDetails, cardName: e.target.value})} required /></div>
          <div><Label htmlFor="cardNumber">Card Number</Label><Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardDetails.cardNumber} onChange={e => setCardDetails({...cardDetails, cardNumber: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)})} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="expiry">Expiry Date (MM/YY)</Label><Input id="expiry" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value.replace(/\D/g, '').replace(/(.{2})/, '$1/').trim().slice(0,5)})} required /></div>
            <div><Label htmlFor="cvv">CVV</Label><Input id="cvv" placeholder="123" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0,3)})} required /></div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmittingCard}>{isSubmittingCard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Proceed to Verification</Button>
        </form>
      )}
      {otpSent && !transactionPending && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Enter OTP</h3>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp" className="sr-only">Enter OTP</Label> {/* Visually hidden label for screen readers */}
              <Input id="otp" placeholder={`Enter 6-digit OTP (Demo: ${actualOtp})`} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={isVerifyingOtp}>{isVerifyingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify OTP'}</Button>
          </form>
        </Card>
      )}
      {transactionPending && (
        <div aria-live="polite">
          <Card className="p-6 text-center"><Loader2 className="h-12 w-12 animate-spin text-brand-teal mx-auto mb-2" /><h3 className="text-xl font-medium">Transaction Processing</h3><p>Time: {formatTimeRemaining()}</p></Card>
        </div>
      )}
    </div>
  );
};
export default CreditCardForm;
