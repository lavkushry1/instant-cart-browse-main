import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import OrderTracking from '../components/checkout/OrderTracking'; // Corrected path
import { Order, OrderStatus, OrderAddress, OrderItem as BEOrderItem, AppliedOffer } from '@/services/orderService'; // Assuming Order type is available
import { Timestamp } from 'firebase/firestore'; // For Timestamp type
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Mock function to simulate fetching an order
const fetchMockOrderById = async (orderId: string): Promise<Order | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Example mock orders (in a real app, this would be an API call)
  const mockShippingAddress: OrderAddress = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    address: '123 Mock Street',
    city: 'Mockville',
    state: 'CA',
    zipCode: '90210',
    country: 'US',
  };

  const mockItems: BEOrderItem[] = [
    { productId: 'prod1', productName: 'Awesome T-Shirt', productImage: '/placeholder.svg', quantity: 1, unitPrice: 25, itemDiscount: 0, finalUnitPrice: 25, lineItemTotal: 25 },
    { productId: 'prod2', productName: 'Cool Mug', productImage: '/placeholder.svg', quantity: 2, unitPrice: 15, itemDiscount: 0, finalUnitPrice: 15, lineItemTotal: 30 },
  ];
  
  const mockAppliedOffers: AppliedOffer[] = [
    { id: 'offer1', name: '10% Off Total', type: 'store', discountAmount: 5.50 }
  ];

  const mockOrders: { [key: string]: Order } = {
    "order123": {
      id: "order123",
      userId: "userABC",
      customerEmail: "test@example.com",
      shippingAddress: mockShippingAddress,
      items: mockItems,
      subtotal: 55,
      cartDiscountAmount: 5.50,
      shippingCost: 5,
      taxAmount: 2.50,
      grandTotal: 57.00,
      paymentMethod: "card",
      paymentStatus: "Paid",
      orderStatus: "Shipped" as OrderStatus,
      appliedOffers: mockAppliedOffers,
      trackingNumber: "TRACK98765",
      shippingCarrier: "DemoTrans",
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
    },
    "order456": {
      id: "order456",
      userId: "userXYZ",
      customerEmail: "another@example.com",
      shippingAddress: { ...mockShippingAddress, firstName: "Jane", address: "456 Other Avenue" },
      items: [mockItems[0]],
      subtotal: 25,
      cartDiscountAmount: 0,
      shippingCost: 5,
      taxAmount: 1.25,
      grandTotal: 31.25,
      paymentMethod: "upi",
      paymentStatus: "Paid",
      orderStatus: "Delivered" as OrderStatus,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    },
    "order789": {
      id: "order789",
      userId: "userMNO",
      customerEmail: "new@example.com",
      shippingAddress: { ...mockShippingAddress, firstName: "Alex" },
      items: [mockItems[1]],
      subtotal: 30,
      cartDiscountAmount: 0,
      shippingCost: 0, // Free shipping
      taxAmount: 1.50,
      grandTotal: 31.50,
      paymentMethod: "card",
      paymentStatus: "Paid",
      orderStatus: "Processing" as OrderStatus,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    }
  };

  return mockOrders[orderId] || null;
};

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      fetchMockOrderById(orderId)
        .then(data => {
          if (data) {
            setOrder(data);
          } else {
            setError('Order not found.');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching mock order:", err);
          setError('Failed to load order details.');
          setLoading(false);
        });
    } else {
      setError('No order ID provided.');
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return <Layout><div className="container mx-auto p-6 text-center">Loading order details...</div></Layout>;
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-6 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <Button asChild className="mt-4">
                <Link to="/account/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!order) {
     // This case should ideally be covered by the error state from fetchMockOrderById
    return <Layout><div className="container mx-auto p-6 text-center">Order not found.</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link to="/account/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders</Link>
          </Button>
        </div>
        <OrderTracking orderDetails={order} />
      </div>
    </Layout>
  );
};

export default OrderTrackingPage;
