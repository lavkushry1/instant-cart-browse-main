import * as admin from 'firebase-admin'; // Import for Timestamp and DocumentSnapshot types
// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../../src/lib/firebaseAdmin'; // Corrected path for functions/* structure
const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products'; // For inventory updates

// import { Offer } from './offerService'; // This will need to point to the BE offer service if used
// For now, assuming Offer type is simple enough or we might need to redefine a relevant part for Order.appliedOffers
// If Offer from './offerServiceBE' is needed, ensure that file exists and is structured correctly.
// For simplicity, let's assume the Pick in Order.appliedOffers is self-contained enough for now.
export interface AppliedOfferInfoBE {
    id: string;
    name: string;
    type: string; // e.g., 'product', 'category', 'cart'
    discountPercent?: number;
    discountAmount?: number;
}


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
  appliedOffers?: AppliedOfferInfoBE[]; // Using simplified BE version
  paymentMethod: string; paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  transactionId?: string; orderStatus: OrderStatus; trackingNumber?: string;
  shippingCarrier?: string; notes?: string; 
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue; 
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue; 
}
export type OrderCreationData = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

interface OrderWriteData extends OrderCreationData {
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}

export type OrderUpdateData = Partial<Pick<Order, 'orderStatus' | 'paymentStatus' | 'trackingNumber' | 'shippingCarrier' | 'notes' | 'transactionId'>>;

interface OrderUpdateWriteData extends OrderUpdateData {
    updatedAt: admin.firestore.FieldValue;
}

console.log(`(Service-Backend) Order Service BE: Using Firestore collection: ${ORDERS_COLLECTION}`);

export const createOrderBE = async (orderData: OrderCreationData): Promise<Order> => {
  console.log('(Service-Backend) createOrderBE called with:', orderData);
  try {
    const batch = db.batch();
    const orderDocRef = db.collection(ORDERS_COLLECTION).doc(); 
    const dataToSave: OrderWriteData = { 
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
    limit?: number; 
    startAfter?: admin.firestore.DocumentSnapshot; 
    sortBy?: 'createdAt' | 'grandTotal'; sortOrder?: 'asc' | 'desc';
    // Added for analytics to fetch within a date range
    startDate?: admin.firestore.Timestamp;
    endDate?: admin.firestore.Timestamp;
}

export const getOrdersBE = async (options: GetOrdersOptionsBE = {}): Promise<{ orders: Order[], lastVisible?: admin.firestore.DocumentSnapshot, totalCount?: number }> => {
  console.log('(Service-Backend) getOrdersBE with options:', options);
  try {
    let query: admin.firestore.Query = db.collection(ORDERS_COLLECTION);
    if (options.userId) query = query.where('userId', '==', options.userId);
    if (options.orderStatus) query = query.where('orderStatus', '==', options.orderStatus);
    if (options.customerEmail) query = query.where('customerEmail', '==', options.customerEmail);
    if (options.paymentStatus) query = query.where('paymentStatus', '==', options.paymentStatus);
    
    // Date range filtering for analytics
    if (options.startDate) query = query.where('createdAt', '>=', options.startDate);
    if (options.endDate) query = query.where('createdAt', '<=', options.endDate);

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    // If filtering by date range, primary sort should usually be by date for consistent pagination
    // If also filtering by another field equality, Firestore needs a composite index.
    // If range filtering on createdAt, secondary sort by createdAt is implicit or fine.
    // If primary sort is different than createdAt AND range filtering on createdAt, that might be an issue.
    // For now, assume createdAt is the primary sort when date range is used.
    if (options.startDate && sortBy !== 'createdAt') {
        query = query.orderBy('createdAt', sortOrder).orderBy(sortBy, sortOrder); // Requires composite index
    } else {
        query = query.orderBy(sortBy, sortOrder);
    }


    const totalCount: number | undefined = undefined;

    if (options.startAfter) query = query.startAfter(options.startAfter);
    if (options.limit) query = query.limit(options.limit);

    const snapshot = await query.get();
    if (snapshot.empty) return { orders: [], totalCount: totalCount !== undefined ? totalCount : 0 };

    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    const lastVisible: admin.firestore.DocumentSnapshot | undefined = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    return { orders, lastVisible, totalCount: totalCount !== undefined ? totalCount : orders.length }; 

  } catch (error) {
    console.error("Error in getOrdersBE:", error);
    throw error;
  }
};

export const updateOrderBE = async (orderId: string, updateData: OrderUpdateData): Promise<Order> => {
  console.log(`(Service-Backend) updateOrderBE for ID ${orderId} with:`, updateData);
  try {
    const docRef = db.collection(ORDERS_COLLECTION).doc(orderId);
    const dataToUpdate: OrderUpdateWriteData = { 
        ...updateData, 
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() 
    };
    await docRef.update(dataToUpdate as { [key: string]: any }); 
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
    await db.collection(ORDERS_COLLECTION).doc(orderId).delete();
  } catch (error) {
    console.error(`Error in deleteOrderBE for ${orderId}:`, error);
    throw error;
  }
}; 