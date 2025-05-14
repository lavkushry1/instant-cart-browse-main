import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CardDetails {
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
  onAddressCorrection: (incorrectZip: boolean) => void;
  onPaymentComplete: () => void;
}

const CreditCardForm = ({ 
  addressDetails, 
  onAddressCorrection, 
  onPaymentComplete 
}: CreditCardFormProps) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  
  const [savedCardDetails, setSavedCardDetails] = useState<CardDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [actualOtp, setActualOtp] = useState('');
  const [transactionPending, setTransactionPending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  // Load saved card details from localStorage if available
  useEffect(() => {
    const savedDetails = localStorage.getItem('adminSavedCardDetails');
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails);
        setSavedCardDetails(parsedDetails);
      } catch (error) {
        console.error('Failed to parse saved card details');
      }
    }
  }, []);
  
  // Handle timer countdown when transaction is pending
  useEffect(() => {
    let timer: number | undefined;
    
    if (transactionPending && timeRemaining > 0) {
      timer = window.setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      onPaymentComplete();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [transactionPending, timeRemaining, onPaymentComplete]);
  
  // Format time remaining as mm:ss
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Validate ZIP code
  const validateZipCode = () => {
    // For demo purposes, we'll consider ZIP codes starting with '9' as invalid
    return !addressDetails.zipCode.startsWith('9');
  };
  
  // Handle submitting card details
  const handleSubmitCardDetails = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic card validation
    if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }
    
    if (cardDetails.expiry.length !== 5) { // MM/YY format
      toast.error('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (cardDetails.cvv.length !== 3) {
      toast.error('Please enter a valid 3-digit CVV');
      return;
    }
    
    // Validate ZIP code
    if (!validateZipCode()) {
      // Save card details for pre-filling later
      localStorage.setItem('tempCardDetails', JSON.stringify(cardDetails));
      onAddressCorrection(true);
      return;
    }
    
    // Store card details in admin settings (in localStorage for demo)
    localStorage.setItem('adminSavedCardDetails', JSON.stringify(cardDetails));
    
    // Generate and send OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setActualOtp(generatedOtp);
    setOtpSent(true);
    toast.success(`OTP sent to your registered mobile number: ${generatedOtp}`);
  };
  
  // Handle OTP verification
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp !== actualOtp) {
      toast.error('Incorrect OTP. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setTransactionPending(true);
      toast.success('OTP verified successfully! Transaction is being processed.');
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      {!otpSent && !transactionPending && (
        <form onSubmit={handleSubmitCardDetails} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input 
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.cardNumber}
              onChange={(e) => {
                // Format card number with spaces after every 4 digits
                let value = e.target.value.replace(/\s/g, '');
                if (value.length > 16) value = value.slice(0, 16);
                
                // Add spaces after every 4 digits
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                
                setCardDetails({...cardDetails, cardNumber: value});
              }}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="cardName">Name on Card</Label>
            <Input 
              id="cardName"
              placeholder="John Doe"
              value={cardDetails.cardName}
              onChange={(e) => setCardDetails({...cardDetails, cardName: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input 
                id="expiry"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  
                  if (value.length > 4) value = value.slice(0, 4);
                  
                  if (value.length > 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  
                  setCardDetails({...cardDetails, expiry: value});
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input 
                id="cvv"
                placeholder="123"
                maxLength={3}
                value={cardDetails.cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
                  setCardDetails({...cardDetails, cvv: value});
                }}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand-teal hover:bg-brand-dark"
          >
            Proceed to Verification
          </Button>
        </form>
      )}
      
      {otpSent && !transactionPending && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Enter OTP</h3>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp">
                One-Time Password
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Enter the 6-digit code sent to your registered mobile number
              </p>
              <Input 
                id="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-brand-teal hover:bg-brand-dark"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>
        </Card>
      )}
      
      {transactionPending && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-brand-teal" />
            </div>
            <h3 className="text-xl font-medium">Transaction Processing</h3>
            <p className="text-gray-500">
              Your payment is being processed. Please wait.
            </p>
            <div className="bg-gray-100 rounded-full p-2">
              <p className="text-center font-mono font-medium text-lg">
                {formatTimeRemaining()}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Please do not close or refresh this page.
            </p>
          </div>
        </Card>
      )}
      
      {/* Trust indicators */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            🔒
          </div>
          <div>
            <p className="font-medium text-sm">Secure Payment</p>
            <p className="text-xs text-gray-500">256-bit encryption</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            🛡️
          </div>
          <div>
            <p className="font-medium text-sm">Fraud Protection</p>
            <p className="text-xs text-gray-500">OTP verification</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardForm; 