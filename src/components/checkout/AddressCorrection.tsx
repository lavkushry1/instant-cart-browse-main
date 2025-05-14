import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface AddressDetails {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface AddressCorrectionProps {
  initialAddress: AddressDetails;
  onSubmit: (correctedAddress: AddressDetails) => void;
  onCancel: () => void;
}

const AddressCorrection = ({ initialAddress, onSubmit, onCancel }: AddressCorrectionProps) => {
  const [addressDetails, setAddressDetails] = useState<AddressDetails>(initialAddress);
  const [cardDetails, setCardDetails] = useState(null);
  
  // Load saved card details if available
  useEffect(() => {
    const savedCardDetails = localStorage.getItem('tempCardDetails');
    if (savedCardDetails) {
      try {
        const parsedDetails = JSON.parse(savedCardDetails);
        setCardDetails(parsedDetails);
      } catch (error) {
        console.error('Failed to parse saved card details');
      }
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation - ZIP code should not start with '9'
    if (addressDetails.zipCode.startsWith('9')) {
      toast.error('Please enter a valid ZIP code');
      return;
    }
    
    onSubmit(addressDetails);
  };
  
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Address Correction Required</h3>
          <p className="text-sm text-gray-500 mt-1">
            The ZIP code you entered is invalid. Please verify your address details.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input 
              id="address"
              value={addressDetails.address}
              onChange={(e) => setAddressDetails({...addressDetails, address: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input 
                id="city"
                value={addressDetails.city}
                onChange={(e) => setAddressDetails({...addressDetails, city: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input 
                id="state"
                value={addressDetails.state}
                onChange={(e) => setAddressDetails({...addressDetails, state: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input 
              id="zipCode"
              value={addressDetails.zipCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, '').slice(0, 5);
                setAddressDetails({...addressDetails, zipCode: value});
              }}
              maxLength={5}
              required
            />
            <p className="text-xs text-red-500 mt-1">
              Previous ZIP code was invalid. Please enter a correct ZIP code.
            </p>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              className="bg-brand-teal hover:bg-brand-dark"
            >
              Update Address
            </Button>
          </div>
        </form>
        
        {cardDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">Your card details have been saved.</p>
            <p className="text-xs text-gray-500">
              You won't need to re-enter them after correcting your address.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AddressCorrection; 