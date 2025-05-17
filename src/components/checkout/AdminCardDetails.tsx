import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy, Lock, ShieldAlert } from 'lucide-react';

const AdminCardDetails: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cardDetails, setCardDetails] = useState<{ cardNumber: string; cardName: string; expiry: string; cvv: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const DEMO_PASSWORD = 'admin123'; // As per requirements
  const CARD_DETAILS_KEY = 'adminSavedCardDetails'; // Key used in CreditCardForm.tsx

  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedDetails = localStorage.getItem(CARD_DETAILS_KEY);
        if (storedDetails) {
          setCardDetails(JSON.parse(storedDetails));
        } else {
          toast.info('No card details found in demo storage.');
        }
      } catch (error) {
        toast.error('Failed to parse stored card details.');
        console.error("Error parsing card details from localStorage:", error);
      }
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Admin access granted.');
    } else {
      toast.error('Incorrect admin password.');
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(err => toast.error('Failed to copy.'));
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h3 className="text-lg font-semibold mb-3">Admin Access - Card Details (DEMO)</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <Label htmlFor="admin-password">Admin Password</Label>
            <Input 
              id="admin-password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </div>
    );
  }

  if (!cardDetails) {
    return (
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h3 className="text-lg font-semibold">Admin - Stored Card Details (DEMO)</h3>
        <p>No card details available in demo storage.</p>
      </div>
    );
  }

  const maskedCardNumber = `Card No: ${cardDetails.cardNumber.slice(0, 4)} **** **** ${cardDetails.cardNumber.slice(-4)}`;

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white space-y-4">
      <h3 className="text-lg font-semibold">Admin - Stored Card Details (DEMO)</h3>
      <p className="text-xs text-red-600">Warning: This is for DEMO purposes only. NEVER store or display full card details like this in a real application.</p>
      
      <div>
        <Label>Cardholder Name</Label>
        <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
          <span>{cardDetails.cardName}</span>
          <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(cardDetails.cardName)}><Copy className="w-4 h-4" /></Button>
        </div>
      </div>

      <div>
        <Label>Card Number</Label>
        <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
          <span>{showDetails ? cardDetails.cardNumber : maskedCardNumber}</span>
          <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(cardDetails.cardNumber)}><Copy className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Expiry Date</Label>
          <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
            <span>{cardDetails.expiry}</span>
            <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(cardDetails.expiry)}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
        <div>
          <Label>CVV</Label>
          <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
            <span>{showDetails ? cardDetails.cvv : '***'}</span>
            <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(cardDetails.cvv)}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={() => setShowDetails(!showDetails)} className="w-full">
        {showDetails ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} 
        {showDetails ? 'Hide Full Details' : 'Show Full Details'}
      </Button>
    </div>
  );
};

export default AdminCardDetails; 