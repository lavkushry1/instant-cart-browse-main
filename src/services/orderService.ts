import { Order, OrderStatus } from '@/types/order';
import { toast } from 'react-hot-toast';

const ORDERS_STORAGE_KEY = 'instantCartOrders';

// Sample orders data
const sampleOrders: Order[] = [
  {
    id: "1001",
    userId: "user123",
    customerName: "John Doe",
    customerEmail: "john.doe@example.com",
    shippingAddress: {
      address: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India"
    },
    billingAddress: {
      address: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India"
    },
    items: [
      {
        productId: "1",
        name: "Smart Watch Pro",
        price: 2999,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000"
      },
      {
        productId: "3",
        name: "Wireless Noise-Cancelling Headphones",
        price: 1499,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000"
      }
    ],
    status: "shipped",
    subtotal: 4498,
    tax: 449.8,
    shipping: 99,
    discount: 0,
    total: 5046.8,
    paymentMethod: "credit_card",
    paymentStatus: "paid",
    notes: "",
    createdAt: "2023-12-15T08:30:00Z",
    updatedAt: "2023-12-16T10:15:00Z",
    shippedAt: "2023-12-16T10:15:00Z",
    deliveredAt: null
  },
  {
    id: "1002",
    userId: "user456",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    shippingAddress: {
      address: "456 Park Ave",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "India"
    },
    billingAddress: {
      address: "456 Park Ave",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "India"
    },
    items: [
      {
        productId: "2",
        name: "Premium Leather Wallet",
        price: 999,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000"
      }
    ],
    status: "delivered",
    subtotal: 999,
    tax: 99.9,
    shipping: 49,
    discount: 0,
    total: 1147.9,
    paymentMethod: "upi",
    paymentStatus: "paid",
    notes: "Leave at the doorstep",
    createdAt: "2023-12-10T14:22:00Z",
    updatedAt: "2023-12-14T09:45:00Z",
    shippedAt: "2023-12-12T11:30:00Z",
    deliveredAt: "2023-12-14T09:45:00Z"
  },
  {
    id: "1003",
    userId: null,
    customerName: "Guest User",
    customerEmail: "guest@example.com",
    shippingAddress: {
      address: "789 First Road",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560001",
      country: "India"
    },
    billingAddress: {
      address: "789 First Road",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560001",
      country: "India"
    },
    items: [
      {
        productId: "4",
        name: "Organic Cotton T-Shirt",
        price: 599,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000"
      },
      {
        productId: "6",
        name: "Ceramic Coffee Mug Set",
        price: 1199,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1000"
      }
    ],
    status: "processing",
    subtotal: 2397,
    tax: 239.7,
    shipping: 99,
    discount: 200,
    total: 2535.7,
    paymentMethod: "credit_card",
    paymentStatus: "paid",
    notes: "Gift wrapping requested",
    createdAt: "2023-12-18T16:45:00Z",
    updatedAt: "2023-12-18T16:55:00Z",
    shippedAt: null,
    deliveredAt: null
  },
  {
    id: "1004",
    userId: "user789",
    customerName: "Amit Kumar",
    customerEmail: "amit.kumar@example.com",
    shippingAddress: {
      address: "42 Second Lane",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      country: "India"
    },
    billingAddress: {
      address: "42 Second Lane",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      country: "India"
    },
    items: [
      {
        productId: "5",
        name: "Professional Camera Lens",
        price: 8999,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1616279969780-e1f11cf685bd?q=80&w=1000"
      }
    ],
    status: "pending",
    subtotal: 8999,
    tax: 899.9,
    shipping: 0,
    discount: 0,
    total: 9898.9,
    paymentMethod: "credit_card",
    paymentStatus: "pending",
    notes: "",
    createdAt: "2023-12-19T11:10:00Z",
    updatedAt: "2023-12-19T11:10:00Z",
    shippedAt: null,
    deliveredAt: null
  }
];

/**
 * Initialize orders in local storage if not already present
 */
const initializeOrders = (): void => {
  const existingOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!existingOrders) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sampleOrders));
  }
};

// Initialize orders on module load
initializeOrders();

/**
 * Get all orders
 */
export const getAllOrders = async (): Promise<Order[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const ordersData = localStorage.getItem(ORDERS_STORAGE_KEY);
    return ordersData ? JSON.parse(ordersData) : [];
  } catch (error) {
    console.error('Failed to load orders:', error);
    return [];
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const orders = await getAllOrders();
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  return order;
};

/**
 * Get orders by user ID
 */
export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const orders = await getAllOrders();
  return orders.filter(o => o.userId === userId);
};

/**
 * Get orders by status
 */
export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  const orders = await getAllOrders();
  return orders.filter(o => o.status === status);
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'shippedAt' | 'deliveredAt'>): Promise<Order> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const orders = await getAllOrders();
    
    // Create new order with ID and timestamps
    const newOrder: Order = {
      ...orderData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shippedAt: null,
      deliveredAt: null
    };
    
    // Add to orders and save
    const updatedOrders = [...orders, newOrder];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    
    return newOrder;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw new Error('Failed to create order');
  }
};

/**
 * Update an existing order
 */
export const updateOrder = async (orderId: string, orderData: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<Order> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const orders = await getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    // Update order with new data and updated timestamp
    const updatedOrder: Order = {
      ...orders[orderIndex],
      ...orderData,
      updatedAt: new Date().toISOString()
    };
    
    // Replace old order with updated one
    orders[orderIndex] = updatedOrder;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    
    return updatedOrder;
  } catch (error) {
    console.error(`Failed to update order ${orderId}:`, error);
    throw new Error('Failed to update order');
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const orders = await getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    // Update the status and timestamps based on the new status
    const orderUpdate: Partial<Order> = { status };
    
    if (status === 'shipped' && !orders[orderIndex].shippedAt) {
      orderUpdate.shippedAt = new Date().toISOString();
    } else if (status === 'delivered' && !orders[orderIndex].deliveredAt) {
      orderUpdate.deliveredAt = new Date().toISOString();
    }
    
    return updateOrder(orderId, orderUpdate);
  } catch (error) {
    console.error(`Failed to update order status for ${orderId}:`, error);
    throw new Error('Failed to update order status');
  }
};

/**
 * Delete order (admin only)
 */
export const deleteOrder = async (orderId: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const orders = await getAllOrders();
    const updatedOrders = orders.filter(order => order.id !== orderId);
    
    // If no order was removed, return false
    if (updatedOrders.length === orders.length) {
      return false;
    }
    
    // Save updated orders
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    return true;
  } catch (error) {
    console.error(`Failed to delete order ${orderId}:`, error);
    throw new Error('Failed to delete order');
  }
};

/**
 * Search orders
 */
export const searchOrders = async (query: string): Promise<Order[]> => {
  const orders = await getAllOrders();
  const searchTerm = query.toLowerCase();
  
  return orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm) || 
    order.customerName.toLowerCase().includes(searchTerm) || 
    order.customerEmail.toLowerCase().includes(searchTerm)
  );
};

/**
 * Generate invoice for order (mock)
 */
export const generateInvoice = async (orderId: string): Promise<string> => {
  // In a real application, this would generate a PDF or similar document
  // For this mock, we'll just return a fake URL
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const order = await getOrderById(orderId);
    return `/invoices/INV-${order.id}-${Date.now()}.pdf`;
  } catch (error) {
    console.error(`Failed to generate invoice for order ${orderId}:`, error);
    throw new Error('Failed to generate invoice');
  }
};

/**
 * Process a return/refund for an order
 */
export const processReturn = async (orderId: string, reason: string): Promise<Order> => {
  try {
    const order = await getOrderById(orderId);
    
    // Only allow returns for delivered orders
    if (order.status !== 'delivered') {
      throw new Error('Only delivered orders can be returned');
    }
    
    // Update order status and add the return reason to notes
    return updateOrder(orderId, {
      status: 'returned',
      paymentStatus: 'refunded',
      notes: order.notes + `\nReturn reason: ${reason}`
    });
  } catch (error) {
    console.error(`Failed to process return for order ${orderId}:`, error);
    throw new Error('Failed to process return');
  }
}; 