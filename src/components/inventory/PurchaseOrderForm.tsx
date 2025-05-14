import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { InventoryItem, Supplier, PurchaseOrder, PurchaseOrderItem } from '@/types/inventory';

const formSchema = z.object({
  supplierId: z.string().min(1, { message: 'Supplier is required' }),
  warehouseId: z.string().min(1, { message: 'Warehouse is required' }),
  expectedDeliveryDate: z.date(),
  items: z.array(z.object({
    productId: z.string().min(1, { message: 'Product is required' }),
    sku: z.string().min(1, { message: 'SKU is required' }),
    quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1' }),
    unitCost: z.coerce.number().min(0.01, { message: 'Unit cost must be greater than 0' }),
  })).min(1, { message: 'At least one item is required' }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  purchaseOrder?: PurchaseOrder;
  suppliers: Supplier[];
  warehouses: { id: string; name: string }[];
  inventoryItems: InventoryItem[];
  defaultItem?: InventoryItem;
}

export const PurchaseOrderForm = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  suppliers,
  warehouses,
  inventoryItems,
  defaultItem,
}: PurchaseOrderFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: purchaseOrder ? {
      supplierId: purchaseOrder.supplierId,
      warehouseId: purchaseOrder.warehouseId,
      expectedDeliveryDate: new Date(purchaseOrder.expectedDeliveryDate),
      items: purchaseOrder.items.map(item => ({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      notes: purchaseOrder.notes,
    } : {
      supplierId: '',
      warehouseId: '',
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      items: defaultItem ? [{
        productId: defaultItem.productId,
        sku: defaultItem.sku,
        quantity: defaultItem.reorderQuantity,
        unitCost: 0,
      }] : [],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Calculate total cost
  const calculateTotal = (items: { quantity?: number; unitCost?: number }[]) => {
    return items.reduce((total, item) => {
      return total + ((item.quantity || 0) * (item.unitCost || 0));
    }, 0);
  };

  // Find product/item by ID
  const findInventoryItem = (productId: string) => {
    return inventoryItems.find(item => item.productId === productId);
  };

  // Handle sku change when product is selected
  const handleProductChange = (productId: string, index: number) => {
    const item = findInventoryItem(productId);
    if (item) {
      form.setValue(`items.${index}.sku`, item.sku);
      // Set recommended reorder quantity if available
      form.setValue(`items.${index}.quantity`, item.reorderQuantity || 1);
    }
  };

  // Add empty item to the form
  const addItem = () => {
    append({ productId: '', sku: '', quantity: 1, unitCost: 0 });
  };

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    onClose();
  };

  // Initialize form with default item if provided
  useEffect(() => {
    if (defaultItem && !purchaseOrder && fields.length === 0) {
      append({
        productId: defaultItem.productId,
        sku: defaultItem.sku,
        quantity: defaultItem.reorderQuantity || defaultItem.quantity,
        unitCost: 0,
      });
    }
  }, [defaultItem, purchaseOrder, fields.length, append]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </DialogTitle>
          <DialogDescription>
            {purchaseOrder 
              ? `Update purchase order details for ${purchaseOrder.id}`
              : 'Create a new purchase order for your inventory'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expectedDeliveryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Delivery Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Order Items</h3>
                <Button
                  type="button"
                  onClick={addItem}
                  size="sm"
                  className="flex items-center"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Item
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-4 border rounded-md bg-slate-50">
                  <p className="text-sm text-slate-500">No items added yet. Click 'Add Item' to add products to this order.</p>
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-center border p-3 rounded-md">
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Product</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleProductChange(value, index);
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inventoryItems.map((item) => (
                                <SelectItem key={item.productId} value={item.productId}>
                                  {item.sku}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">SKU</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit Cost</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <div className="mt-6">
                      ${form.watch(`items.${index}.quantity`, 0) * form.watch(`items.${index}.unitCost`, 0)}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {fields.length > 0 && (
                <div className="text-right font-medium">
                  Total: ${calculateTotal(form.watch('items'))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any special instructions or notes for this order..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {purchaseOrder ? 'Update Order' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 