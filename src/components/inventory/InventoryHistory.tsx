import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  InventoryMovement, 
  MovementType 
} from '@/types/inventory';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InventoryHistoryProps {
  movements: InventoryMovement[];
  sku?: string;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({ 
  movements,
  sku 
}) => {
  const [filteredMovements, setFilteredMovements] = useState<InventoryMovement[]>(movements);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementType, setMovementType] = useState<MovementType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({from: undefined, to: undefined});

  // Filtering function
  const applyFilters = () => {
    let filtered = [...movements];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (movement) =>
          movement.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (movement.referenceId && movement.referenceId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by movement type
    if (movementType !== 'all') {
      filtered = filtered.filter((movement) => movement.type === movementType);
    }

    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter((movement) => 
        new Date(movement.timestamp) >= dateRange.from!
      );
    }
    
    if (dateRange.to) {
      filtered = filtered.filter((movement) => 
        new Date(movement.timestamp) <= new Date(dateRange.to!.setHours(23, 59, 59, 999))
      );
    }

    setFilteredMovements(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setMovementType('all');
    setDateRange({from: undefined, to: undefined});
    setFilteredMovements(movements);
  };

  // Apply filters on any change
  React.useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, movementType, dateRange.from, dateRange.to]);

  // Get movement type icon and color
  const getMovementTypeDisplay = (type: MovementType) => {
    switch (type) {
      case 'stock_received':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <ArrowUp className="mr-1 h-3 w-3" /> Received
          </Badge>
        );
      case 'stock_adjusted':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <ArrowRight className="mr-1 h-3 w-3" /> Adjusted
          </Badge>
        );
      case 'order_fulfilled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <ArrowDown className="mr-1 h-3 w-3" /> Fulfilled
          </Badge>
        );
      case 'returned':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ArrowUp className="mr-1 h-3 w-3" /> Returned
          </Badge>
        );
      case 'damaged':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <ArrowDown className="mr-1 h-3 w-3" /> Damaged
          </Badge>
        );
      case 'transfer':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            <ArrowRight className="mr-1 h-3 w-3" /> Transferred
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{type}</Badge>
        );
    }
  };

  // Helper to determine if quantity should be displayed as positive or negative
  const getQuantityDisplay = (movement: InventoryMovement) => {
    switch (movement.type) {
      case 'stock_received':
      case 'returned':
        return `+${movement.quantity}`;
      case 'order_fulfilled':
      case 'damaged':
        return `-${movement.quantity}`;
      default:
        return movement.quantity.toString();
    }
  };

  // Helper to determine quantity text color
  const getQuantityColor = (movement: InventoryMovement) => {
    switch (movement.type) {
      case 'stock_received':
      case 'returned':
        return 'text-green-600';
      case 'order_fulfilled':
      case 'damaged':
        return 'text-red-600';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {sku ? `Inventory History for ${sku}` : 'Inventory Movement History'}
        </CardTitle>
        <CardDescription>
          Track all inventory movements, adjustments, and transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by product ID, reason, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                value={movementType}
                onValueChange={(value) => setMovementType(value as MovementType | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Movement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stock_received">Stock Received</SelectItem>
                  <SelectItem value="stock_adjusted">Stock Adjusted</SelectItem>
                  <SelectItem value="order_fulfilled">Order Fulfilled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <span>
                      {dateRange.from
                        ? dateRange.to
                          ? `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
                          : format(dateRange.from, 'LLL dd, y')
                        : 'Select date range'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={(range) => setDateRange({
                      from: range?.from,
                      to: range?.to
                    })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="ghost" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length > 0 ? (
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.timestamp), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="font-medium">{movement.productId}</TableCell>
                    <TableCell>{getMovementTypeDisplay(movement.type)}</TableCell>
                    <TableCell className={getQuantityColor(movement)}>
                      {getQuantityDisplay(movement)}
                    </TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell>{movement.referenceId || '-'}</TableCell>
                    <TableCell>{movement.performedBy || 'System'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No movement history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}; 