"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrderBE = exports.updateOrderBE = exports.getOrdersBE = exports.getOrderByIdBE = exports.createOrderBE = void 0;
// Import Firebase Admin resources
const firebaseAdmin_1 = require("../lib/firebaseAdmin"); // Corrected path for functions/* structure
const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products'; // For inventory updates
console.log(`(Service-Backend) Order Service BE: Using Firestore collection: ${ORDERS_COLLECTION}`);
const createOrderBE = async (orderData) => {
    console.log('(Service-Backend) createOrderBE called with:', orderData);
    try {
        const batch = firebaseAdmin_1.firestoreDB.batch();
        const orderDocRef = firebaseAdmin_1.firestoreDB.collection(ORDERS_COLLECTION).doc();
        const dataToSave = {
            ...orderData,
            createdAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(orderDocRef, dataToSave);
        for (const item of orderData.items) {
            const productRef = firebaseAdmin_1.firestoreDB.collection(PRODUCTS_COLLECTION).doc(item.productId);
            batch.update(productRef, {
                stock: firebaseAdmin_1.adminInstance.firestore.FieldValue.increment(-item.quantity)
            });
        }
        await batch.commit();
        const newOrderSnap = await orderDocRef.get();
        if (!newOrderSnap.exists)
            throw new Error('Order creation failed, document not found after commit.');
        return { id: newOrderSnap.id, ...newOrderSnap.data() };
    }
    catch (error) {
        console.error("Error in createOrderBE:", error);
        throw error;
    }
};
exports.createOrderBE = createOrderBE;
const getOrderByIdBE = async (orderId) => {
    console.log(`(Service-Backend) getOrderByIdBE for ID: ${orderId}`);
    try {
        const docRef = firebaseAdmin_1.firestoreDB.collection(ORDERS_COLLECTION).doc(orderId);
        const docSnap = await docRef.get();
        if (!docSnap.exists)
            return null;
        return { id: docSnap.id, ...docSnap.data() };
    }
    catch (error) {
        console.error(`Error in getOrderByIdBE for ${orderId}:`, error);
        throw error;
    }
};
exports.getOrderByIdBE = getOrderByIdBE;
const getOrdersBE = async (options = {}) => {
    console.log('(Service-Backend) getOrdersBE with options:', options);
    try {
        let query = firebaseAdmin_1.firestoreDB.collection(ORDERS_COLLECTION);
        if (options.userId)
            query = query.where('userId', '==', options.userId);
        if (options.orderStatus)
            query = query.where('orderStatus', '==', options.orderStatus);
        if (options.customerEmail)
            query = query.where('customerEmail', '==', options.customerEmail);
        if (options.paymentStatus)
            query = query.where('paymentStatus', '==', options.paymentStatus);
        // Date range filtering for analytics
        if (options.startDate)
            query = query.where('createdAt', '>=', options.startDate);
        if (options.endDate)
            query = query.where('createdAt', '<=', options.endDate);
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        // If filtering by date range, primary sort should usually be by date for consistent pagination
        // If also filtering by another field equality, Firestore needs a composite index.
        // If range filtering on createdAt, secondary sort by createdAt is implicit or fine.
        // If primary sort is different than createdAt AND range filtering on createdAt, that might be an issue.
        // For now, assume createdAt is the primary sort when date range is used.
        if (options.startDate && sortBy !== 'createdAt') {
            query = query.orderBy('createdAt', sortOrder).orderBy(sortBy, sortOrder); // Requires composite index
        }
        else {
            query = query.orderBy(sortBy, sortOrder);
        }
        const totalCount = undefined;
        if (options.startAfter)
            query = query.startAfter(options.startAfter);
        if (options.limit)
            query = query.limit(options.limit);
        const snapshot = await query.get();
        if (snapshot.empty)
            return { orders: [], totalCount: totalCount !== undefined ? totalCount : 0 };
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        return { orders, lastVisible, totalCount: totalCount !== undefined ? totalCount : orders.length };
    }
    catch (error) {
        console.error("Error in getOrdersBE:", error);
        throw error;
    }
};
exports.getOrdersBE = getOrdersBE;
const updateOrderBE = async (orderId, updateData) => {
    console.log(`(Service-Backend) updateOrderBE for ID ${orderId} with:`, updateData);
    try {
        const docRef = firebaseAdmin_1.firestoreDB.collection(ORDERS_COLLECTION).doc(orderId);
        const dataToUpdate = {
            ...updateData,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp()
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await docRef.update(dataToUpdate);
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists)
            throw new Error('Order not found after update');
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }
    catch (error) {
        console.error(`Error in updateOrderBE for ${orderId}:`, error);
        throw error;
    }
};
exports.updateOrderBE = updateOrderBE;
const deleteOrderBE = async (orderId) => {
    console.log(`(Service-Backend) deleteOrderBE for ID: ${orderId}`);
    try {
        await firebaseAdmin_1.firestoreDB.collection(ORDERS_COLLECTION).doc(orderId).delete();
    }
    catch (error) {
        console.error(`Error in deleteOrderBE for ${orderId}:`, error);
        throw error;
    }
};
exports.deleteOrderBE = deleteOrderBE;
//# sourceMappingURL=orderServiceBE.js.map