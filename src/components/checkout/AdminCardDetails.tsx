import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy, Lock, ShieldAlert } from 'lucide-react';

interface CardDetails {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

const AdminCardDetails = () => {
  const [savedCards, setSavedCards] = useState<CardDetails[]>([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  
  // Load saved card details
  useEffect(() => {
    if (isAuthenticated) {
      const savedCardDetails = localStorage.getItem('adminSavedCardDetails');
      if (savedCardDetails) {
        try {
          const parsedDetails = JSON.parse(savedCardDetails);
          // Handle both single card and array of cards
          if (Array.isArray(parsedDetails)) {
            setSavedCards(parsedDetails);
          } else {
            setSavedCards([parsedDetails]);
          }
        } catch (error) {
          console.error('Failed to parse saved card details');
          toast.error('Error loading saved card details');
        }
      }
    }
  }, [isAuthenticated]);
  
  // Authenticate admin
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes, use a simple password "admin123"
    if (adminPassword === 'admin123') {
      setIsAuthenticated(true);
      toast.success('Admin authenticated successfully');
    } else {
      toast.error('Invalid admin password');
    }
  };
  
  // Copy card details to clipboard
  const handleCopyCard = (card: CardDetails) => {
    const cardInfo = `
Card Number: ${card.cardNumber}
Cardholder: ${card.cardName}
Expiry: ${card.expiry}
CVV: ${card.cvv}
    `;
    
    navigator.clipboard.writeText(cardInfo.trim())
      .then(() => toast.success('Card details copied to clipboard'))
      .catch(() => toast.error('Failed to copy card details'));
  };
  
  // Log out
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setShowCardDetails(false);
  };
  
  // Toggle showing masked/unmasked card details
  const toggleShowCardDetails = () => {
    setShowCardDetails(prev => !prev);
  };
  
  // Mask card number except last 4 digits
  const maskCardNumber = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const lastFour = cleanNumber.slice(-4);
    const maskedPart = '*'.repeat(cleanNumber.length - 4);
    return maskedPart + lastFour;
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Admin Card Details
        </CardTitle>
        <CardDescription>
          Secure access to stored payment information
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!isAuthenticated ? (
          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input 
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              Authenticate
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Stored Card Details</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleShowCardDetails}
              >
                {showCardDetails ? (
                  <><EyeOff className="w-4 h-4 mr-2" /> Hide</>
                ) : (
                  <><Eye className="w-4 h-4 mr-2" /> Show</>
                )}
              </Button>
            </div>
            
            {savedCards.length === 0 ? (
              <p className="text-sm text-gray-500">No card details stored yet.</p>
            ) : (
              <div className="space-y-4">
                {savedCards.map((card, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Card Number</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCopyCard(card)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-mono">
                        {showCardDetails ? card.cardNumber : maskCardNumber(card.cardNumber)}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <span className="text-sm font-medium">Cardholder</span>
                          <p>{card.cardName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Expiry</span>
                          <p>{card.expiry}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium">CVV</span>
                        <p>{showCardDetails ? card.cvv : '***'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex items-center text-amber-600 text-sm">
              <ShieldAlert className="w-4 h-4 mr-2" />
              <span>This data is sensitive. Handle with care.</span>
            </div>
          </div>
        )}
      </CardContent>
      
      {isAuthenticated && (
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full"
          >
            Log Out
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AdminCardDetails; 