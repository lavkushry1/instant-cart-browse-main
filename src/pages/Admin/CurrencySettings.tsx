import { useState, useEffect } from 'react';
import { Banknote, RefreshCw, Check, X, Settings, ArrowUpDown, PlusCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { Currency, CurrencyDisplayOptions } from '@/types/currency';
import { RegionalSettings } from '@/components/currency/RegionalSettings';
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';

const CurrencySettings = () => {
  const { 
    currencies, 
    activeCurrency, 
    displayOptions, 
    regionalSettings,
    loading, 
    error, 
    updateCurrencies,
    updateDisplayOptions,
    updateRegionalSettings,
    changeCurrency 
  } = useCurrency();
  
  const [updatingRates, setUpdatingRates] = useState(false);
  const [editDisplayOptions, setEditDisplayOptions] = useState<CurrencyDisplayOptions>(displayOptions);
  
  useEffect(() => {
    setEditDisplayOptions(displayOptions);
  }, [displayOptions]);
  
  const handleUpdateRates = async () => {
    setUpdatingRates(true);
    try {
      await updateCurrencies();
      toast({
        title: "Exchange rates updated",
        description: "Currency exchange rates have been refreshed with the latest data.",
      });
    } catch (error) {
      console.error('Failed to update rates:', error);
      toast({
        title: "Update failed",
        description: "Failed to update exchange rates. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRates(false);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDisplayOptionChange = (key: keyof CurrencyDisplayOptions, value: any) => {
    const newOptions = {
      ...editDisplayOptions,
      [key]: value
    };
    setEditDisplayOptions(newOptions);
  };
  
  const saveDisplayOptions = () => {
    updateDisplayOptions(editDisplayOptions);
    toast({
      title: "Display options saved",
      description: "Your currency display preferences have been updated.",
    });
  };
  
  const toggleCurrencyActive = async (currencyCode: string, isActive: boolean) => {
    // In a real app, this would update the backend
    toast({
      title: isActive ? "Currency activated" : "Currency deactivated",
      description: `${currencyCode} is now ${isActive ? 'available' : 'unavailable'} for customers.`,
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Currency Settings</h1>
            <p className="text-gray-500">Manage your store's currency options and exchange rates</p>
          </div>
          <Button onClick={handleUpdateRates} disabled={updatingRates} className="flex items-center">
            <RefreshCw className={`mr-2 h-4 w-4 ${updatingRates ? 'animate-spin' : ''}`} />
            Update Exchange Rates
          </Button>
        </div>
        
        <Tabs defaultValue="currencies">
          <TabsList className="mb-6">
            <TabsTrigger value="currencies">
              <Banknote className="h-4 w-4 mr-2" />
              Currencies
            </TabsTrigger>
            <TabsTrigger value="display">
              <Settings className="h-4 w-4 mr-2" />
              Display Options
            </TabsTrigger>
            <TabsTrigger value="regional">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Regional Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="currencies">
            <Card>
              <CardHeader>
                <CardTitle>Available Currencies</CardTitle>
                <CardDescription>
                  Manage which currencies are available in your store and their exchange rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Base currency: <strong>{currencies.find(c => c.isBaseCurrency)?.code || 'USD'}</strong>
                        </p>
                        {/* Add last updated timestamp if available */}
                      </div>
                      <Button variant="outline" className="flex items-center">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Currency
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead className="text-right">Exchange Rate</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currencies.map((currency) => (
                            <TableRow key={currency.code}>
                              <TableCell className="font-medium">
                                {currency.flag && (
                                  <span className="mr-2">{currency.flag}</span>
                                )}
                                {currency.code}
                              </TableCell>
                              <TableCell>{currency.name}</TableCell>
                              <TableCell>{currency.symbol}</TableCell>
                              <TableCell className="text-right">
                                {currency.isBaseCurrency ? (
                                  <Badge variant="outline">Base</Badge>
                                ) : (
                                  currency.exchangeRate.toFixed(4)
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={currency.isActive}
                                  onCheckedChange={(checked) => toggleCurrencyActive(currency.code, checked)}
                                  aria-label={`${currency.code} active status`}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button variant="ghost" size="sm">Edit</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Currency Converter */}
            <CurrencyConverter className="mt-6" />
          </TabsContent>
          
          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle>Display Options</CardTitle>
                <CardDescription>
                  Configure how prices are displayed throughout your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-symbol">Show Currency Symbol</Label>
                      <p className="text-sm text-muted-foreground">Display currency symbols like $, €, £</p>
                    </div>
                    <Switch
                      id="show-symbol"
                      checked={editDisplayOptions.showSymbol}
                      onCheckedChange={(checked) => handleDisplayOptionChange('showSymbol', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-code">Show Currency Code</Label>
                      <p className="text-sm text-muted-foreground">Display currency codes like USD, EUR, GBP</p>
                    </div>
                    <Switch
                      id="show-code"
                      checked={editDisplayOptions.showCode}
                      onCheckedChange={(checked) => handleDisplayOptionChange('showCode', checked)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="symbol-position">Symbol Position</Label>
                    <p className="text-sm text-muted-foreground mb-2">Where to display the currency symbol relative to the amount</p>
                    <Select
                      value={editDisplayOptions.symbolPosition}
                      onValueChange={(value) => handleDisplayOptionChange('symbolPosition', value)}
                    >
                      <SelectTrigger id="symbol-position">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Before amount ($123.45)</SelectItem>
                        <SelectItem value="after">After amount (123.45$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t flex justify-end">
                  <Button onClick={saveDisplayOptions}>
                    Save Display Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="regional">
            <RegionalSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default CurrencySettings; 