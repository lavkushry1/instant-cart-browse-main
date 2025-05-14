import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, ShoppingBag, Bell, Shield, Globe } from 'lucide-react';

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="store">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Store
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="localization">
              <Globe className="h-4 w-4 mr-2" />
              Localization
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your store's general settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input id="store-name" defaultValue="Instant Cart" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-description">Store Description</Label>
                  <Textarea id="store-description" defaultValue="The best online shopping experience for all your needs." />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input id="contact-email" type="email" defaultValue="contact@instantcart.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input id="contact-phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <div className="text-sm text-gray-500">Take your store offline for maintenance</div>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
                
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your admin account information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Account settings functionality is under development. This tab will allow you to update your admin profile, change your password, and manage security settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Configure store-specific settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Store settings functionality is under development. This tab will allow you to configure store hours, shipping options, payment gateways, and tax settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Notification settings functionality is under development. This tab will allow you to configure email notifications, SMS alerts, and in-app notifications.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security options for your store</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Security settings functionality is under development. This tab will allow you to configure two-factor authentication, API access, and session management.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="localization">
            <Card>
              <CardHeader>
                <CardTitle>Localization Settings</CardTitle>
                <CardDescription>Configure regional settings for your store</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Localization settings functionality is under development. This tab will allow you to configure languages, currencies, date formats, and regional settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings; 