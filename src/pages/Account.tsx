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
import { getUserOrders, updateUserPassword, addUserAddress, deleteUserAddress } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Eye, EyeOff, Plus, Trash2, Check, Clock, X, MapPin, Edit, Package, ShieldCheck, User } from 'lucide-react';
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

interface ProfileFormData {
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  deliveryAddress?: Address;
  tracking?: {
    number: string;
    carrier: string;
    url?: string;
  };
}

const Account = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false
  });
  
  const [securityForm, setSecurityForm] = useState<SecurityFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    }
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
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        }
      });

      // Load addresses (would come from API in real app)
      const savedAddresses = localStorage.getItem(`user-addresses-${user.id}`);
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      }

      // Fetch orders
      if (activeTab === 'orders') {
        const fetchOrders = async () => {
          try {
            const userOrders = await getUserOrders(user.id);
            setOrders(userOrders);
          } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load order history');
          }
        };
        fetchOrders();
      }
    }
  }, [user, activeTab]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested address fields
      const [parent, field] = name.split('.');
      setProfileForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [field]: value
        }
      }));
    } else {
      // Handle top-level fields
      setProfileForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle security form changes
  const handleSecurityFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle address form changes
  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle address form checkbox change
  const handleDefaultAddressChange = (checked: boolean) => {
    setAddressForm(prev => ({ ...prev, isDefault: checked }));
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      const updatedUser = await updateProfile(user.id, profileForm);
      
      if (updatedUser) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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
    
    setIsUpdating(true);
    
    try {
      const success = await updateUserPassword(
        user.id,
        securityForm.currentPassword,
        securityForm.newPassword
      );
      
      if (success) {
        toast.success('Password updated successfully');
        setSecurityForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password. Check your current password.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle adding new address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // If setting as default, update all other addresses
      if (addressForm.isDefault) {
        const updatedAddresses = addresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
        setAddresses(updatedAddresses);
      }
      
      const newAddress = await addUserAddress(user.id, addressForm);
      
      if (newAddress) {
        // Add to local state
        setAddresses(prev => [...prev, newAddress]);
        
        // Reset form
        setAddressForm({
          name: '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          isDefault: false
        });
        
        setIsAddressFormOpen(false);
        toast.success('Address added successfully');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address');
    }
  };

  // Handle removing address
  const handleRemoveAddress = async (addressId: string) => {
    if (!user) return;
    
    try {
      await deleteUserAddress(user.id, addressId);
      
      // Update local state
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      
      toast.success('Address removed successfully');
    } catch (error) {
      console.error('Error removing address:', error);
      toast.error('Failed to remove address');
    }
  };

  // Handle setting default address
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;
    
    try {
      // Update all addresses
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      
      // Save updates
      localStorage.setItem(`user-addresses-${user.id}`, JSON.stringify(updatedAddresses));
      
      // Update local state
      setAddresses(updatedAddresses);
      
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
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
    navigate('/');
    toast.success('You have been logged out');
  };

  // Get status badge for orders
  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Check className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Processing
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <X className="w-3 h-3 mr-1" /> Cancelled
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Package className="w-3 h-3 mr-1" /> Shipped
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  // Generate avatar fallback from name
  const getInitials = (name: string) => {
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
      <main className="container py-10">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
        
        <Tabs 
          defaultValue="profile" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="max-w-3xl mx-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center justify-center">
              <User className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center justify-center">
              <MapPin className="h-4 w-4 mr-2" /> Addresses
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 mr-2" /> Security
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center justify-center">
              <Package className="h-4 w-4 mr-2" /> Orders
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details here
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
                
                <CardHeader className="pt-2">
                  <CardTitle>Primary Address</CardTitle>
                  <CardDescription>
                    Update your default shipping and billing address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.street">Street Address</Label>
                    <Input
                      id="address.street"
                      name="address.street"
                      value={profileForm.address.street}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.city">City</Label>
                      <Input
                        id="address.city"
                        name="address.city"
                        value={profileForm.address.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.state">State/Province</Label>
                      <Input
                        id="address.state"
                        name="address.state"
                        value={profileForm.address.state}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="address.zipCode"
                        name="address.zipCode"
                        value={profileForm.address.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address.country">Country</Label>
                      <Input
                        id="address.country"
                        name="address.country"
                        value={profileForm.address.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="ml-auto"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Address Book</CardTitle>
                  <CardDescription>
                    Manage your shipping and billing addresses
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddressFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Address
                </Button>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map(address => (
                      <Card key={address.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{address.name}</CardTitle>
                            {address.isDefault && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Default
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          <p>{address.country}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div>
                            {!address.isDefault && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSetDefaultAddress(address.id)}
                              >
                                Set as Default
                              </Button>
                            )}
                          </div>
                          <div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemoveAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border rounded-md bg-muted/10">
                    <MapPin className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p>No addresses found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a new address to your address book.
                    </p>
                    <Button onClick={() => setIsAddressFormOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showPasswordForm ? (
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your password to enhance account security
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-4 border rounded-md p-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={securityForm.currentPassword}
                          onChange={handleSecurityFormChange}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full aspect-square"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={securityForm.newPassword}
                          onChange={handleSecurityFormChange}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full aspect-square"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={securityForm.confirmPassword}
                        onChange={handleSecurityFormChange}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowPasswordForm(false);
                          setSecurityForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isUpdating || !securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword}
                      >
                        {isUpdating ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View your recent orders and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                              <p className="text-sm">
                                {new Date(order.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              {getOrderStatusBadge(order.status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {order.items.slice(0, 2).map(item => (
                              <div key={item.id} className="flex justify-between py-1 border-b last:border-0">
                                <div>
                                  <p>{item.name}</p>
                                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p>${item.price.toFixed(2)}</p>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-sm text-muted-foreground text-center">
                                + {order.items.length - 2} more items
                              </p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleViewOrderDetails(order)}>
                            View Details
                          </Button>
                          <p className="font-medium">Total: ${order.total.toFixed(2)}</p>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border rounded-md bg-muted/10">
                    <Package className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p>No orders found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start shopping to see your order history
                    </p>
                    <Button variant="outline" onClick={() => navigate('/products')}>
                      Start Shopping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Address Form Dialog */}
      <Dialog open={isAddressFormOpen} onOpenChange={setIsAddressFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Add a new shipping or billing address to your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAddress}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Address Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Home, Work, etc."
                  value={addressForm.name}
                  onChange={handleAddressFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  name="street"
                  placeholder="123 Main St, Apt 4B"
                  value={addressForm.street}
                  onChange={handleAddressFormChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="New York"
                    value={addressForm.city}
                    onChange={handleAddressFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="NY"
                    value={addressForm.state}
                    onChange={handleAddressFormChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="10001"
                    value={addressForm.zipCode}
                    onChange={handleAddressFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={addressForm.country}
                    onValueChange={(value) => setAddressForm(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="CAN">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AUS">Australia</SelectItem>
                      <SelectItem value="IND">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onCheckedChange={handleDefaultAddressChange}
                />
                <Label htmlFor="isDefault">Set as default address</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddressFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Address</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Order #{selectedOrder.id}</span>
                {getOrderStatusBadge(selectedOrder.status)}
              </DialogTitle>
              <DialogDescription>
                {new Date(selectedOrder.date).toLocaleDateString()} at {new Date(selectedOrder.date).toLocaleTimeString()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <div className="border rounded-md divide-y">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p>${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="p-3 flex justify-between font-medium">
                    <p>Total</p>
                    <p>${selectedOrder.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {selectedOrder.deliveryAddress && (
                  <div>
                    <h3 className="font-medium mb-2">Delivery Address</h3>
                    <div className="border rounded-md p-3">
                      <p>{selectedOrder.deliveryAddress.name}</p>
                      <p>{selectedOrder.deliveryAddress.street}</p>
                      <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}</p>
                      <p>{selectedOrder.deliveryAddress.country}</p>
                    </div>
                  </div>
                )}
                {selectedOrder.tracking && (
                  <div>
                    <h3 className="font-medium mb-2">Tracking Information</h3>
                    <div className="border rounded-md p-3">
                      <p>Carrier: {selectedOrder.tracking.carrier}</p>
                      <p>Tracking Number: {selectedOrder.tracking.number}</p>
                      {selectedOrder.tracking.url && (
                        <Button 
                          variant="outline" 
                          className="mt-2 w-full"
                          onClick={() => window.open(selectedOrder.tracking.url, '_blank')}
                        >
                          Track Package
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Account; 