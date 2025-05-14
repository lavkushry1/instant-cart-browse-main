// src/services/orderService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products'; // For inventory updates

import { Offer } from './offerService'; 
import { updateProductStockBE } from './productService'; 

import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export interface OrderAddress {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; city: string; state: string; zipCode: string; country?: string;
}
export interface OrderItem {
    productId: string; productName: string; productImage?: string; quantity: number;
    unitPrice: number; itemDiscount?: number; finalUnitPrice: number; lineItemTotal: number;
}
export type OrderStatus = 
  | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' 
  | 'Cancelled' | 'Refunded' | 'PaymentFailed';
export interface Order {
  id: string; userId?: string; customerEmail: string; shippingAddress: OrderAddress;
  billingAddress?: OrderAddress; items: OrderItem[]; subtotal: number; cartDiscountAmount: number; 
  shippingCost: number; taxAmount: number; grandTotal: number; 
  appliedOffers?: Pick<Offer, 'id' | 'name' | 'type' | 'discountPercent' | 'discountAmount'>[]; 
  paymentMethod: string; paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  transactionId?: string; orderStatus: OrderStatus; trackingNumber?: string;
  shippingCarrier?: string; notes?: string; createdAt: any; updatedAt: any;
}
export type OrderCreationData = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type OrderUpdateData = Partial<Pick<Order, 'orderStatus' | 'paymentStatus' | 'trackingNumber' | 'shippingCarrier' | 'notes' | 'transactionId'>>;

console.log(`(Service-Backend) Order Service: Using Firestore collection: ${ORDERS_COLLECTION}`);

export const createOrderBE = async (orderData: OrderCreationData): Promise<Order> => {
  console.log('(Service-Backend) createOrderBE called with:', orderData);
  try {
    const batch = db.batch();
    const orderDocRef = db.collection(ORDERS_COLLECTION).doc(); 
    const dataToSave: any = {
      ...orderData,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(orderDocRef, dataToSave);

    for (const item of orderData.items) {
      const productRef = db.collection(PRODUCTS_COLLECTION).doc(item.productId);
      batch.update(productRef, { 
        stock: adminInstance.firestore.FieldValue.increment(-item.quantity) 
      });
    }
    await batch.commit();
    const newOrderSnap = await orderDocRef.get();
    if (!newOrderSnap.exists) throw new Error('Order creation failed, document not found after commit.');
    return { id: newOrderSnap.id, ...newOrderSnap.data() } as Order;
  } catch (error) {
    console.error("Error in createOrderBE:", error);
    throw error;
  }
};

export const getOrderByIdBE = async (orderId: string): Promise<Order | null> => {
  console.log(`(Service-Backend) getOrderByIdBE for ID: ${orderId}`);
  try {
    const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Order;
  } catch (error) {
    console.error(`Error in getOrderByIdBE for ${orderId}:`, error);
    throw error;
  }
};

export interface GetOrdersOptionsBE {
    userId?: string; orderStatus?: OrderStatus; customerEmail?: string;
    paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    limit?: number; startAfter?: any; 
    sortBy?: 'createdAt' | 'grandTotal'; sortOrder?: 'asc' | 'desc';
}

export const getOrdersBE = async (options: GetOrdersOptionsBE = {}): Promise<{ orders: Order[], lastVisible?: any, totalCount?: number }> => {
  console.log('(Service-Backend) getOrdersBE with options:', options);
  try {
    let query: admin.firestore.Query = db.collection(ORDERS_COLLECTION);
    if (options.userId) query = query.where('userId', '==', options.userId);
    if (options.orderStatus) query = query.where('orderStatus', '==', options.orderStatus);
    if (options.customerEmail) query = query.where('customerEmail', '==', options.customerEmail);
    if (options.paymentStatus) query = query.where('paymentStatus', '==', options.paymentStatus);

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    let totalCount: number | undefined = undefined;
    // If using Firestore .count() - ensure your admin SDK version supports it.
    // const countQuery = query; // query without pagination for total count
    // try {
    //   const totalSnapshot = await countQuery.count().get();
    //   totalCount = totalSnapshot.data().count;
    // } catch (e) { console.warn("Count query failed or not supported:", e); }

    if (options.startAfter) query = query.startAfter(options.startAfter);
    if (options.limit) query = query.limit(options.limit);

    const snapshot = await query.get();
    if (snapshot.empty) return { orders: [], totalCount: totalCount !== undefined ? totalCount : 0 };

    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    return { orders, lastVisible, totalCount: totalCount !== undefined ? totalCount : orders.length }; // Fallback count if totalCount not fetched

  } catch (error) {
    console.error("Error in getOrdersBE:", error);
    throw error;
  }
};

export const updateOrderBE = async (orderId: string, updateData: OrderUpdateData): Promise<Order> => {
  console.log(`(Service-Backend) updateOrderBE for ID ${orderId} with:`, updateData);
  try {
    const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);
    const dataToUpdate: any = { ...updateData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
    await docRef.update(dataToUpdate);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) throw new Error('Order not found after update');
    return { id: updatedDoc.id, ...updatedDoc.data() } as Order;
  } catch (error) {
    console.error(`Error in updateOrderBE for ${orderId}:`, error);
    throw error;
  }
};

export const deleteOrderBE = async (orderId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteOrderBE for ID: ${orderId}`);
  try {
    // Consider implications: if order is hard-deleted, related data might be orphaned.
    // Soft deletion is often safer. Also consider if inventory should be restored for cancelled/deleted orders.
    // This logic could be complex and might involve checking the order status before deletion.
    await db.collection(ORDERS_COLLECTION).doc(orderId).delete();
  } catch (error) {
    console.error(`Error in deleteOrderBE for ${orderId}:`, error);
    throw error;
  }
};