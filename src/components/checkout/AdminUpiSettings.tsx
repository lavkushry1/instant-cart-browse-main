import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Copy, ShieldAlert } from 'lucide-react';

interface AdminUpiSettingsProps {
  currentUpiId: string;
  onSave: (newUpiId: string) => void;
}

const AdminUpiSettings = ({ currentUpiId, onSave }: AdminUpiSettingsProps) => {
  const [upiId, setUpiId] = useState(currentUpiId);
  const [isUpiValid, setIsUpiValid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validate UPI ID format
  const validateUpiId = (value: string) => {
    // Basic UPI ID validation (username@provider)
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(value);
  };
  
  const handleUpiIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUpiId(value);
    setIsUpiValid(value.trim() === '' || validateUpiId(value));
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!upiId.trim()) {
      toast.error('UPI ID cannot be empty');
      return;
    }
    
    if (!validateUpiId(upiId)) {
      setIsUpiValid(false);
      toast.error('Invalid UPI ID format');
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
    onSave(upiId);
      setIsSaving(false);
      toast.success('UPI ID updated successfully');
    }, 1000);
  };
  
  // Copy UPI ID to clipboard
  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId)
      .then(() => toast.success('UPI ID copied to clipboard'))
      .catch(() => toast.error('Failed to copy UPI ID'));
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <ShieldAlert className="w-5 h-5 mr-2 text-amber-500" />
          Admin UPI Settings
        </CardTitle>
        <CardDescription>
          Configure the UPI ID for receiving payments
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSave}>
      <div className="space-y-4">
            <div>
              <Label htmlFor="upiId">
                UPI ID (Virtual Payment Address)
              </Label>
              <div className="mt-1 flex space-x-2">
          <Input 
                  id="upiId"
            value={upiId}
                  onChange={handleUpiIdChange}
                  placeholder="yourname@bankname"
                  className={!isUpiValid ? 'border-red-500' : ''}
          />
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  onClick={copyUpiId}
                  title="Copy UPI ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              {!isUpiValid && (
                <p className="text-xs text-red-500 mt-1">
                  Please enter a valid UPI ID in the format username@provider
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                This UPI ID will be used to generate payment QR codes for customer orders
          </p>
        </div>
        
            <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
              <ShieldAlert className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>
                Important: Ensure this is your correct business UPI ID. All customer payments will be directed to this account.
              </p>
            </div>
          </div>
          
          <div className="mt-6">
          <Button 
              type="submit" 
              className="w-full bg-brand-teal hover:bg-brand-dark"
              disabled={isSaving || !isUpiValid}
            >
              {isSaving ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <span className="loading loading-spinner loading-xs"></span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save UPI ID
                </>
              )}
          </Button>
        </div>
        </form>
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 border-t pt-4">
        <p>
          For security reasons, changing the UPI ID is logged in the admin audit trail.
        </p>
      </CardFooter>
    </Card>
  );
};

export default AdminUpiSettings;
