import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { getUserOrders, updateUserPassword, addUserAddress, deleteUserAddress } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { User as AuthUser, UpdateUserProfileData, UserAddress, ClientOrder, ClientOrderItem } from '@/hooks/AuthContextDef'; // Import User type, UpdateUserProfileData, UserAddress, ClientOrder, ClientOrderItem
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eye, EyeOff, Plus, Trash2, Check, Clock, X, MapPin, Edit, Package, ShieldCheck, User, Loader2, AlertCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface ProfileDisplayFormData {
  displayName: string; // Changed from name to displayName for clarity with User type
  phoneNumber: string;
  // currentDisplayAddress is removed as addresses will be managed in their own tab via user.addresses
}

interface AddressFormData {
  name?: string; // Label for the address e.g., "Home", "Work"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  id?: string; // Add id for editing existing addresses
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Order {
  id: string;
  date: string; // Mapped from ClientOrder.createdAt
  status: string; // Mapped from ClientOrder.orderStatus
  total: number; // Mapped from ClientOrder.grandTotal
  items: {
    id: string; // Mapped from ClientOrderItem.productId
    name: string; // Mapped from ClientOrderItem.productName
    quantity: number;
    price: number; // Mapped from ClientOrderItem.finalUnitPrice
    image?: string; // Mapped from ClientOrderItem.productImage
  }[];
  deliveryAddress?: UserAddress; // Mapped from ClientOrder.shippingAddress
  tracking?: {
    number?: string; // Mapped from ClientOrder.trackingNumber
    carrier?: string; // Mapped from ClientOrder.shippingCarrier
    url?: string; // This might not be directly available from ClientOrder, to be reviewed
  };
  // Additional fields from ClientOrder if needed for display
  paymentMethod?: string;
  customerEmail?: string;
}

const Account = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isLoading, getUserOrders, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // Addresses will now come directly from user.addresses from context
  // const [addresses, setAddresses] = useState<UserAddress[]>([]); 
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA', // Default country
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  const [securityForm, setSecurityForm] = useState<SecurityFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileDisplayForm, setProfileDisplayForm] = useState<ProfileDisplayFormData>({
    displayName: '',
    phoneNumber: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileDisplayForm({
        displayName: user.displayName || user.email?.split('@')[0] || '',
        phoneNumber: user.phoneNumber || '',
      });

      // Addresses are now directly from user.addresses, no more localStorage
      // setAddresses(user.addresses || []); 

      // Fetch orders when the 'orders' tab is active and user is available
      if (activeTab === 'orders') {
        const fetchUserOrders = async () => {
          if (!user || !getUserOrders) return; 
          setIsOrdersLoading(true);
          try {
            const response = await getUserOrders();
            const mappedOrders: Order[] = response.orders.map((clientOrder: ClientOrder): Order => ({
              id: clientOrder.id,
              date: clientOrder.createdAt ? new Date(clientOrder.createdAt).toLocaleDateString() : 'N/A',
              status: clientOrder.orderStatus,
              total: clientOrder.grandTotal,
              items: clientOrder.items.map((item: ClientOrderItem) => ({
                id: item.productId,
                name: item.productName,
                quantity: item.quantity,
                price: item.finalUnitPrice,
                image: item.productImage,
              })),
              deliveryAddress: clientOrder.shippingAddress,
              tracking: {
                number: clientOrder.trackingNumber,
                carrier: clientOrder.shippingCarrier,
                // url: clientOrder.trackingUrl // Potential future field
              },
              paymentMethod: clientOrder.paymentMethod,
              customerEmail: clientOrder.customerEmail,
            }));
            setOrders(mappedOrders);
            if (mappedOrders.length === 0) {
              // toast.success('No orders found yet.'); // Avoid toast if it's just empty state
            }
          } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load order history.');
          } finally {
            setIsOrdersLoading(false);
          }
        };
        fetchUserOrders();
      }
    }
  }, [user, activeTab, getUserOrders]);

  // Handle profile display form field changes (displayName, phoneNumber)
  const handleProfileDisplayFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Ensure name is a key of ProfileDisplayFormData
    if (name === 'displayName' || name === 'phoneNumber') {
      setProfileDisplayForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle security form changes
  const handleSecurityFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle address form changes for adding/editing addresses
  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelectChange = (name: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [name]: value }));
  }

  const handleDefaultAddressChange = (checked: boolean) => {
    setAddressForm(prev => ({ ...prev, isDefault: checked }));
  };

  // Handle profile update
  const handleUpdateBaseProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    try {
      const updateData: UpdateUserProfileData = {
        displayName: profileDisplayForm.displayName,
        phoneNumber: profileDisplayForm.phoneNumber,
      };
      const updatedUser = await updateProfile(updateData);
      if (updatedUser) {
        toast.success('Profile updated successfully');
      }
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error(`Profile update failed: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate password
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (securityForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsUpdating(true); // Use a shared loading state or a specific one for password
    try {
      // Assuming updatePassword exists in useAuth() and calls a CF
      // For now, this is a placeholder as it's not fully implemented in provided AuthProvider code
      // await updatePassword(securityForm.currentPassword, securityForm.newPassword);
      // The existing AuthProvider.tsx doesn't have updatePassword. This is future work or relies on Firebase direct methods.
      toast('Password update functionality to be fully connected with backend.'); 
      // Placeholder: Simulate success
      // setShowPasswordForm(false);
      // setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // toast.success('Password updated successfully - (Simulated)'); 
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      const message = error instanceof Error ? error.message : 'Failed to update password. Please try again.';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Add/Edit Address Submission
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addAddress || !updateAddress) return;

    // Basic validation
    if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode || !addressForm.country) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    setIsUpdating(true);
    try {
      if (editingAddressId) {
        // Update existing address
        const addressToUpdate: UserAddress = { 
          ...addressForm,
          id: editingAddressId,
        };
        await updateAddress(editingAddressId, addressToUpdate);
        toast.success('Address updated successfully!');
      } else {
        // Add new address
        await addAddress(addressForm);
        toast.success('Address added successfully!');
      }
      setIsAddressFormOpen(false);
      setEditingAddressId(null);
      setAddressForm({ name: '', street: '', city: '', state: '', zipCode: '', country: 'USA', isDefault: false });
    } catch (error: unknown) {
      console.error("Error adding address:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error(`Failed to add address: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open address form for editing
  const handleEditAddress = (address: UserAddress) => {
    setEditingAddressId(address.id);
    setAddressForm({ // Pre-fill form with address data
      id: address.id,
      name: address.name || '',
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault || false,
    });
    setIsAddressFormOpen(true);
  };

  // Open address form for adding new address
  const openAddNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({ name: '', street: '', city: '', state: '', zipCode: '', country: 'USA', isDefault: false });
    setIsAddressFormOpen(true);
  };

  // Handle Remove Address
  const handleRemoveAddress = async (addressId: string) => {
    if (!user || !deleteAddress) return;
    if (window.confirm('Are you sure you want to delete this address?')) {
      setIsUpdating(true);
      try {
        await deleteAddress(addressId);
        toast.success('Address removed successfully!');
      } catch (error: unknown) {
        console.error('Error removing address:', error);
        const message = error instanceof Error ? error.message : 'Failed to remove address.';
        toast.error(message);
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  // Handle Set Default Address
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user || !setDefaultAddress) return;
    setIsUpdating(true);
    try {
      await setDefaultAddress(addressId);
      toast.success('Default address updated!');
    } catch (error: unknown) {
      console.error('Error setting default address:', error);
      const message = error instanceof Error ? error.message : 'Failed to set default address.';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // View order details
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate('/');
  };

  const getOrderStatusBadgeDetails = (status: string): { text: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: JSX.Element } => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { text: 'Pending', variant: 'outline', icon: <Clock className="mr-1 h-3 w-3" /> };
      case 'processing':
        return { text: 'Processing', variant: 'default', icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" /> };
      case 'shipped':
        return { text: 'Shipped', variant: 'default', icon: <Package className="mr-1 h-3 w-3" /> };
      case 'delivered':
        return { text: 'Delivered', variant: 'secondary', icon: <Check className="mr-1 h-3 w-3" /> };
      case 'cancelled':
        return { text: 'Cancelled', variant: 'destructive', icon: <X className="mr-1 h-3 w-3" /> };
      case 'paymentfailed':
        return { text: 'Payment Failed', variant: 'destructive', icon: <AlertCircle className="mr-1 h-3 w-3" /> };
      default:
        return { text: status || 'Unknown', variant: 'outline', icon: <Clock className="mr-1 h-3 w-3" /> };
    }
  };

  // Generate avatar fallback from name
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container py-10 min-h-[50vh] flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <div className="container py-10 min-h-[50vh] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="mb-4">You need to be logged in to view this page</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-10 min-h-[calc(100vh-12rem)]">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2">
                  <AvatarFallback className="text-xl">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{user.displayName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <TabsList className="flex flex-col h-auto">
                  <TabsTrigger value="profile" className="w-full justify-start">Profile</TabsTrigger>
                  <TabsTrigger value="addresses" className="w-full justify-start">Addresses</TabsTrigger>
                  <TabsTrigger value="orders" className="w-full justify-start">Order History</TabsTrigger>
                  <TabsTrigger value="security" className="w-full justify-start">Security</TabsTrigger>
                  {/* <TabsTrigger value="preferences" className="w-full justify-start">Preferences</TabsTrigger> */}
                </TabsList>
              </CardContent>
              <CardFooter>
                  <Button variant="outline" onClick={handleLogout} className="w-full">Logout</Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your name and phone number.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleUpdateBaseProfile}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Full Name</Label>
                        <Input 
                          id="displayName" 
                          name="displayName" 
                          value={profileDisplayForm.displayName} 
                          onChange={handleProfileDisplayFormChange} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input 
                          id="phoneNumber" 
                          name="phoneNumber" 
                          type="tel" 
                          value={profileDisplayForm.phoneNumber} 
                          onChange={handleProfileDisplayFormChange} 
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={isUpdating || isLoading}>
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Manage Addresses</CardTitle>
                      <Button onClick={openAddNewAddressForm} disabled={isUpdating || isLoading}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Address
                      </Button>
                    </div>
                    <CardDescription>View, add, edit, or remove your saved addresses.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoading && <p>Loading addresses...</p>}
                    {!isLoading && user?.addresses && user.addresses.length === 0 && (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-600">You haven't saved any addresses yet.</p>
                        <p className="text-sm text-gray-500">Add an address to make checkout faster.</p>
                        <Button onClick={openAddNewAddressForm} className="mt-4" variant="outline">
                          Add Your First Address
                        </Button>
                      </div>
                    )}
                    {!isLoading && user?.addresses && user.addresses.map((address) => (
                      <Card key={address.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 flex flex-row justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {address.name || `Address ${user.addresses?.indexOf(address) !== -1 ? (user.addresses?.indexOf(address) || 0) + 1 : ''}`}
                              {address.isDefault && (
                                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Default</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-600">
                              {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}
                            </CardDescription>
                          </div> 
                          <div className="flex space-x-2 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => handleEditAddress(address)} disabled={isUpdating} aria-label="Edit address">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveAddress(address.id)} disabled={isUpdating} aria-label="Delete address">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardFooter className="pt-2">
                          {!address.isDefault && (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              onClick={() => handleSetDefaultAddress(address.id)} 
                              disabled={isUpdating}
                            >
                              Set as Default
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>View your past orders and their status.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin mr-2" />
                        <p>Loading your orders...</p>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <Card key={order.id} onClick={() => handleViewOrderDetails(order)} className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Order #{order.id.substring(0, 8)}...</CardTitle>
                                {
                                  (() => {
                                    const badgeDetails = getOrderStatusBadgeDetails(order.status);
                                    return (
                                      <Badge variant={badgeDetails.variant} className="text-xs px-2 py-0.5">
                                        {badgeDetails.icon}
                                        {badgeDetails.text}
                                      </Badge>
                                    );
                                  })()
                                }
                              </div>
                              <CardDescription>Date: {order.date} | Total: ${order.total.toFixed(2)}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">Items: {order.items.length}</p>
                              {/* Optionally show a few item names or images here later */}
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" size="sm">View Details</Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">You have no past orders.</p>
                        <Button variant="link" className="mt-2" onClick={() => navigate('/')}>Start Shopping</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Change your password.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input id="currentPassword" name="currentPassword" type={showCurrentPassword ? "text" : "password"} value={securityForm.currentPassword} onChange={handleSecurityFormChange} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input id="newPassword" name="newPassword" type={showNewPassword ? "text" : "password"} value={securityForm.newPassword} onChange={handleSecurityFormChange} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" value={securityForm.confirmPassword} onChange={handleSecurityFormChange} />
                      </div>
                      <Button type="submit" disabled={isUpdating || isLoading}>
                        {isUpdating ? 'Updating Password...' : 'Update Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />

      {/* Order Details Dialog */}
      {selectedOrder && (() => {
          const effectiveDialogTitle = selectedOrder.id ? `Order Details - #${selectedOrder.id.substring(0,8)}...` : 'Order Details';
          
          let orderStatusDescriptionNode = null;
          if (selectedOrder) { // Check selectedOrder again for type safety inside this block
            const badgeDetails = getOrderStatusBadgeDetails(selectedOrder.status || 'Pending');
            orderStatusDescriptionNode = (
              <span>
                {`Placed on ${selectedOrder.date} | Status: `}
                <Badge variant={badgeDetails.variant} className="ml-1 text-xs px-2 py-0.5">
                  {badgeDetails.icon}
                  {badgeDetails.text}
                </Badge>
              </span>
            );
          }

          return (
            <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
              <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{effectiveDialogTitle}</DialogTitle>
                  {orderStatusDescriptionNode && (
                    <DialogDescription>
                      {orderStatusDescriptionNode}
                    </DialogDescription>
                  )}
                </DialogHeader>

                {selectedOrder && (
                  <div className="space-y-6">
                    {/* Items Summary */}
                    <Card>
                      <CardHeader><CardTitle>Items in this Order ({selectedOrder.items.length})</CardTitle></CardHeader>
                      <CardContent className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center py-4 space-x-4">
                            <img 
                              src={item.image || '/placeholder.svg'} 
                              alt={item.name} 
                              className="w-20 h-20 object-cover rounded-md border"
                            />
                            <div className="flex-grow">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="justify-end font-bold text-lg">
                        Total: ${selectedOrder.total.toFixed(2)}
                      </CardFooter>
                    </Card>

                    {/* Delivery & Payment Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader><CardTitle className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-blue-500"/>Delivery Address</CardTitle></CardHeader>
                        {selectedOrder.deliveryAddress ? (
                          <CardContent>
                            <p className="font-medium">{selectedOrder.deliveryAddress.name || 'N/A'}</p>
                            <p>{selectedOrder.deliveryAddress.street}</p>
                            <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}</p>
                            <p>{selectedOrder.deliveryAddress.country}</p>
                          </CardContent>
                        ) : <CardContent><p>No delivery address provided.</p></CardContent>}
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-500"/>Payment & Tracking</CardTitle></CardHeader>
                        <CardContent>
                          <p><strong>Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p>
                          <p><strong>Tracking:</strong> {selectedOrder.tracking?.number || 'Not available'}</p>
                          <p><strong>Carrier:</strong> {selectedOrder.tracking?.carrier || 'N/A'}</p>
                        </CardContent>
                      </Card>
                    </div>

                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()}

      {/* Add/Edit Address Dialog */}
      <Dialog open={isAddressFormOpen} onOpenChange={(isOpen) => {
        setIsAddressFormOpen(isOpen);
        if (!isOpen) {
          setEditingAddressId(null); // Reset editing state when dialog closes
          setAddressForm({ name: '', street: '', city: '', state: '', zipCode: '', country: 'USA', isDefault: false });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddressId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddressId ? 'Update your existing address details.' : 'Enter the details for your new address.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAddress} className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="address-name">Address Label (e.g., Home, Work)</Label>
              <Input 
                id="address-name" 
                name="name" 
                value={addressForm.name} 
                onChange={handleAddressFormChange} 
                placeholder="My Home Address"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address-street">Street Address *</Label>
              <Input 
                id="address-street" 
                name="street" 
                value={addressForm.street} 
                onChange={handleAddressFormChange} 
                required 
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="address-city">City *</Label>
                <Input 
                  id="address-city" 
                  name="city" 
                  value={addressForm.city} 
                  onChange={handleAddressFormChange} 
                  required 
                  placeholder="Anytown"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address-state">State/Province *</Label>
                <Input 
                  id="address-state" 
                  name="state" 
                  value={addressForm.state} 
                  onChange={handleAddressFormChange} 
                  required 
                  placeholder="CA"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="address-zipCode">ZIP/Postal Code *</Label>
                <Input 
                  id="address-zipCode" 
                  name="zipCode" 
                  value={addressForm.zipCode} 
                  onChange={handleAddressFormChange} 
                  required 
                  placeholder="90210"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address-country">Country *</Label>
                {/* Consider using a Select component for countries for better UX */}
                <Select name="country" value={addressForm.country} onValueChange={(value) => handleAddressSelectChange('country', value)} required>
                  <SelectTrigger id="address-country">
                      <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                      {/* Add more countries as needed */} 
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="CAN">Canada</SelectItem>
                      <SelectItem value="MEX">Mexico</SelectItem>
                      <SelectItem value="GBR">United Kingdom</SelectItem>
                      <SelectItem value="IND">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="address-isDefault" 
                checked={addressForm.isDefault} 
                onCheckedChange={handleDefaultAddressChange} 
              />
              <Label htmlFor="address-isDefault">Set as default address</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddressFormOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingAddressId ? 'Save Changes' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default Account; 