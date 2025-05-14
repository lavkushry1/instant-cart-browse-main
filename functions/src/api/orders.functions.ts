// functions/src/api/orders.functions.ts

import * as functions from 'firebase-functions';
import {
  createOrderBE,
  getOrderByIdBE,
  getOrdersBE,
  updateOrderBE, // Assuming this is for general updates by admin; status has a dedicated fn
  OrderUpdateData as ServiceOrderUpdateData, // Renamed to avoid conflict
} from '../../../src/services/orderService'; // Adjust path
import { OrderCreationData, GetOrdersOptionsBE, OrderStatus } from '../../../src/services/orderService';

const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  return context.auth.uid;
};

const ensureAdmin = (context: functions.https.CallableContext): string => {
  ensureAuthenticated(context); 
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) orders.functions.ts: Initializing with LIVE logic...");

export const createOrderCF = functions.https.onCall(async (data: OrderCreationData, context) => {
  console.log("(Cloud Function) createOrderCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    const orderDataWithUser = { ...data, userId: data.userId || userId };
    if (data.userId && data.userId !== userId && !context.auth?.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot create order for another user unless admin.');
    }
    // TODO: Validate OrderCreationData (e.g. items not empty, valid address, etc.)
    const newOrder = await createOrderBE(orderDataWithUser);
    return { success: true, order: newOrder };
  } catch (error: any) {
    console.error("Error in createOrderCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create order.');
  }
});

export const getOrderByIdCF = functions.https.onCall(async (data: { orderId: string }, context) => {
  console.log("(Cloud Function) getOrderByIdCF called with data:", data);
  const uid = ensureAuthenticated(context);
  try {
    const { orderId } = data;
    if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'Order ID is required.');
    
    const order = await getOrderByIdBE(orderId);
    if (!order) throw new functions.https.HttpsError('not-found', 'Order not found.');

    if (order.userId !== uid && !context.auth?.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this order.');
    }
    return { success: true, order };
  } catch (error: any) {
    console.error("Error in getOrderByIdCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get order.');
  }
});

export const getOrdersForUserCF = functions.https.onCall(async (data: { limit?: number; startAfter?: any }, context) => {
  console.log("(Cloud Function) getOrdersForUserCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    const options: GetOrdersOptionsBE = {
        userId: userId,
        limit: data.limit || 10,
        startAfter: data.startAfter, 
        sortBy: 'createdAt',
        sortOrder: 'desc'
    };
    const result = await getOrdersBE(options);
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error in getOrdersForUserCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get user orders.');
  }
});

export const getAllOrdersAdminCF = functions.https.onCall(async (data: GetOrdersOptionsBE | undefined, context) => {
  console.log("(Cloud Function) getAllOrdersAdminCF called with data:", data);
  ensureAdmin(context);
  try {
    // If data is undefined, provide default options or handle as error based on requirements
    const options: GetOrdersOptionsBE = {
        limit: data?.limit || 20,
        startAfter: data?.startAfter,
        sortBy: data?.sortBy || 'createdAt',
        sortOrder: data?.sortOrder || 'desc',
        orderStatus: data?.orderStatus,
        customerEmail: data?.customerEmail,
        paymentStatus: data?.paymentStatus,
        userId: data?.userId // Allow admin to filter by specific user
    };
    const result = await getOrdersBE(options);
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error in getAllOrdersAdminCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get all orders for admin.');
  }
});

interface UpdateOrderStatusData {
    orderId: string; 
    newStatus: OrderStatus; 
    trackingNumber?: string; 
    shippingCarrier?: string;
    // Potentially add admin notes or reason for status change
}

export const updateOrderStatusCF = functions.https.onCall(async (data: UpdateOrderStatusData, context) => {
  console.log("(Cloud Function) updateOrderStatusCF called with data:", data);
  ensureAdmin(context);
  try {
    const { orderId, newStatus, trackingNumber, shippingCarrier } = data;
    if (!orderId || !newStatus) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID and new status are required.');
    }
    const updatePayload: ServiceOrderUpdateData = { orderStatus: newStatus };
    if (trackingNumber) updatePayload.trackingNumber = trackingNumber;
    if (shippingCarrier) updatePayload.shippingCarrier = shippingCarrier;
    
    // TODO: Consider adding more robust logic based on status transitions
    // e.g., if status changes to 'Cancelled', trigger refund process or restock items.
    // if (newStatus === 'Cancelled') { /* Call refund, restock */ }

    const updatedOrder = await updateOrderBE(orderId, updatePayload);
    return { success: true, order: updatedOrder };
  } catch (error: any) {
    console.error("Error in updateOrderStatusCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update order status.');
  }
});
