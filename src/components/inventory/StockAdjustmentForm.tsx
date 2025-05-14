import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryItem, MovementType } from '@/types/inventory';

const stockAdjustmentFormSchema = z.object({
  quantity: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number()
      .min(1, 'Quantity must be greater than 0')
      .int('Quantity must be a whole number')
  ),
  type: z.enum(['stock_received', 'stock_adjusted', 'returned', 'damaged'], {
    required_error: 'Please select a movement type',
  }),
  reason: z.string().min(1, 'Please provide a reason for this adjustment'),
  notes: z.string().optional(),
});

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>;

interface StockAdjustmentFormProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    itemId: string,
    quantity: number,
    type: MovementType,
    reason: string,
    notes?: string
  ) => void;
}

export const StockAdjustmentForm = ({
  item,
  isOpen,
  onClose,
  onSubmit,
}: StockAdjustmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      quantity: 1,
      type: 'stock_received',
      reason: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: StockAdjustmentFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(
        item.id,
        data.quantity,
        data.type as MovementType,
        data.reason,
        data.notes
      );
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {item.sku}</DialogTitle>
          <DialogDescription>
            Update the inventory quantity for this product
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select adjustment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stock_received">Stock Received</SelectItem>
                        <SelectItem value="stock_adjusted">Manual Adjustment</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="damaged">Damaged/Loss</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Why is this adjustment being made?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional details about this adjustment"
                      className="resize-none"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 