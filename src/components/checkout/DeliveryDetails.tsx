
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const formSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  city: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  state: z.string().min(2, { message: 'State must be at least 2 characters.' }),
  zipCode: z.string().regex(/^\d{6}$/, { message: 'Please enter a valid 6-digit ZIP code.' }),
  saveInfo: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

interface DeliveryDetailsProps {
  initialValues: Partial<FormValues>;
  onSubmit: (values: FormValues) => void;
}

const DeliveryDetails = ({ initialValues, onSubmit }: DeliveryDetailsProps) => {
  const [isVerifyingZip, setIsVerifyingZip] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialValues.firstName || '',
      lastName: initialValues.lastName || '',
      email: initialValues.email || '',
      phone: initialValues.phone || '',
      address: initialValues.address || '',
      city: initialValues.city || '',
      state: initialValues.state || '',
      zipCode: initialValues.zipCode || '',
      saveInfo: initialValues.saveInfo || false
    }
  });

  // Verify ZIP code and auto-fill city and state
  const verifyZipCode = async (zipCode: string) => {
    if (zipCode.length === 6 && /^\d{6}$/.test(zipCode)) {
      setIsVerifyingZip(true);
      
      // Simulate ZIP code verification API call
      setTimeout(() => {
        // This would be an API call in a real app
        const zipData = {
          '110001': { city: 'New Delhi', state: 'Delhi' },
          '400001': { city: 'Mumbai', state: 'Maharashtra' },
          '700001': { city: 'Kolkata', state: 'West Bengal' },
          '600001': { city: 'Chennai', state: 'Tamil Nadu' },
          '500001': { city: 'Hyderabad', state: 'Telangana' }
        }[zipCode];
        
        if (zipData) {
          form.setValue('city', zipData.city);
          form.setValue('state', zipData.state);
          toast.success('Address details updated based on ZIP code');
        }
        
        setIsVerifyingZip(false);
      }, 1000);
    }
  };

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Delivery Details</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* ZIP Code */}
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="110001" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        verifyZipCode(e.target.value);
                      }}
                      aria-describedby="zip-status-message"
                    />
                  </FormControl>
                  {isVerifyingZip && <p id="zip-status-message" className="text-xs text-muted-foreground mt-1" aria-live="polite">Verifying...</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Delhi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* State */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="Delhi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Save Info Checkbox */}
          <FormField
            control={form.control}
            name="saveInfo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Save this information for next time
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-brand-teal hover:bg-brand-dark">
            Continue to Payment
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default DeliveryDetails;
