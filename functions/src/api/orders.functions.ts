// functions/src/api/orders.functions.ts

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin'; // Needed for Firestore operations if not already via db
import * as fs from 'fs';
import * as path from 'path';
import {
  createOrderBE,
  getOrderByIdBE,
  getOrdersBE,
  updateOrderBE, // Assuming this is for general updates by admin; status has a dedicated fn
  OrderUpdateData as ServiceOrderUpdateData, // Renamed to avoid conflict
} from '../services/orderServiceBE'; // Corrected path
import { OrderCreationData, GetOrdersOptionsBE, OrderStatus, Order } from '../services/orderServiceBE'; // Corrected path & Added Order type
import { sendEmail } from '../lib/emailService'; // Import our email service

// Initialize Firebase Admin SDK if not already done (typically in index.ts)
// For standalone testing or if this is the main entry, ensure admin.initializeApp() is called.
// Assuming it's initialized globally.
const db = admin.firestore(); // Get Firestore instance

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
  } catch (error: unknown) {
    console.error("Error in createOrderCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to create order.';
    throw new functions.https.HttpsError('internal', message);
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
  } catch (error: unknown) {
    console.error("Error in getOrderByIdCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get order.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const getOrdersForUserCF = functions.https.onCall(async (data: { limit?: number; startAfter?: unknown }, context) => {
  console.log("(Cloud Function) getOrdersForUserCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    const options: GetOrdersOptionsBE = {
        userId: userId,
        limit: data.limit || 10,
        startAfter: data.startAfter as any, // Cast to any to resolve linter error
        sortBy: 'createdAt',
        sortOrder: 'desc'
    };
    const result = await getOrdersBE(options);
    return { success: true, ...result };
  } catch (error: unknown) {
    console.error("Error in getOrdersForUserCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get user orders.';
    throw new functions.https.HttpsError('internal', message);
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
  } catch (error: unknown) {
    console.error("Error in getAllOrdersAdminCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get all orders for admin.';
    throw new functions.https.HttpsError('internal', message);
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
  } catch (error: unknown) {
    console.error("Error in updateOrderStatusCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to update order status.';
    throw new functions.https.HttpsError('internal', message);
  }
});

// --- Firestore Trigger for Order Confirmation Email ---

export const sendOrderConfirmationEmailOnCreate = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data() as Order; // Type assertion
    const orderId = context.params.orderId;

    console.log(`New order created: ${orderId}, preparing to send confirmation email.`);

    try {
      let customerEmail = order.customerEmail;
      let customerName = order.shippingAddress?.firstName || 'Valued Customer';

      // If userId exists, try to get the user's primary email and name from the users collection
      if (order.userId) {
        try {
          const userDoc = await db.collection('users').doc(order.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.email) customerEmail = userData.email;
            if (userData?.displayName) customerName = userData.displayName;
          }
        } catch (userError) {
          console.error(`Error fetching user details for ${order.userId}:`, userError);
          // Proceed with email from order if user fetch fails
        }
      }
      
      if (!customerEmail) {
        console.error(`No email address found for order ${orderId}. Cannot send confirmation.`);
        return null;
      }

      // Read and populate email template
      const templatePath = path.join(__dirname, '../lib/templates/orderConfirmationEmail.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Helper to format currency for email
      const formatCurrencyForEmail = (value: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
      };

      // Populate template
      htmlTemplate = htmlTemplate.replace(/{{CUSTOMER_NAME}}/g, customerName);
      htmlTemplate = htmlTemplate.replace(/{{ORDER_ID}}/g, orderId);
      
      const itemRows = order.items.map(item => `
        <tr>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrencyForEmail(item.finalUnitPrice)}</td>
            <td>${formatCurrencyForEmail(item.lineItemTotal)}</td>
        </tr>`).join('');
      htmlTemplate = htmlTemplate.replace('{{ORDER_ITEMS_ROWS}}', itemRows);

      htmlTemplate = htmlTemplate.replace('{{ORDER_SUBTOTAL}}', formatCurrencyForEmail(order.subtotal));
      
      let appliedOffersSummaryHtml = '';
      if (order.appliedOffers && order.appliedOffers.length > 0) {
          order.appliedOffers.forEach(offer => {
              const discountAmount = offer.discountAmount || (offer.discountPercent ? (order.subtotal * offer.discountPercent / 100) : 0);
              appliedOffersSummaryHtml += `
                <tr>
                    <td colspan="3" style="text-align:right;">Discount (${offer.name || 'Offer'}):</td>
                    <td>-${formatCurrencyForEmail(discountAmount)}</td>
                </tr>`;
          });
      }
       htmlTemplate = htmlTemplate.replace('{{APPLIED_OFFERS_SUMMARY}}', appliedOffersSummaryHtml);


      htmlTemplate = htmlTemplate.replace('{{ORDER_SHIPPING}}', formatCurrencyForEmail(order.shippingCost));
      htmlTemplate = htmlTemplate.replace('{{ORDER_TAX}}', formatCurrencyForEmail(order.taxAmount));
      htmlTemplate = htmlTemplate.replace('{{ORDER_GRAND_TOTAL}}', formatCurrencyForEmail(order.grandTotal));

      const shippingAddr = order.shippingAddress;
      htmlTemplate = htmlTemplate.replace('{{SHIPPING_ADDRESS_LINE1}}', `${shippingAddr.firstName} ${shippingAddr.lastName}`);
      htmlTemplate = htmlTemplate.replace('{{SHIPPING_ADDRESS_LINE2}}', shippingAddr.address);
      htmlTemplate = htmlTemplate.replace('{{SHIPPING_ADDRESS_CITY_STATE_ZIP}}', `${shippingAddr.city}, ${shippingAddr.state} ${shippingAddr.zipCode}`);
      htmlTemplate = htmlTemplate.replace('{{SHIPPING_ADDRESS_COUNTRY}}', shippingAddr.country || 'India');
      
      htmlTemplate = htmlTemplate.replace('{{CURRENT_YEAR}}', new Date().getFullYear().toString());

      const emailOptions = {
        to: customerEmail,
        subject: `Your Instant Cart Order Confirmation #${orderId}`,
        html: htmlTemplate,
      };

      const emailResult = await sendEmail(emailOptions);
      if (emailResult.success) {
        console.log(`Order confirmation email sent successfully for order ${orderId} to ${customerEmail}. Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`Failed to send order confirmation email for order ${orderId}. Error: ${emailResult.error}`);
      }
      return null;

    } catch (error) {
      console.error(`Error processing order confirmation for ${orderId}:`, error);
      return null; // Ensures function completes gracefully
    }
  });
