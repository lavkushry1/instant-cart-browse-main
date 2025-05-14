// src/services/cartService.ts (Backend Operations)

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const USER_CARTS_COLLECTION = 'user_carts'; 

export interface BackendCartItem {
    productId: string;
    quantity: number;
    addedAt: any; // admin.firestore.Timestamp 
}

export interface UserCartBE {
    userId: string; 
    items: BackendCartItem[];
    updatedAt: any; // admin.firestore.Timestamp
}

console.log(`(Service-Backend) Cart Service: Using Firestore collection: ${USER_CARTS_COLLECTION}`);

export const getUserCartBE = async (userId: string): Promise<UserCartBE | null> => {
  console.log(`(Service-Backend) getUserCartBE for userId: ${userId}`);
  try {
    const cartDocRef = db.collection(USER_CARTS_COLLECTION).doc(userId);
    const docSnap = await cartDocRef.get();
    if (!docSnap.exists) {
      return null; 
    }
    return { userId: docSnap.id, ...docSnap.data() } as UserCartBE;
  } catch (error) {
    console.error(`Error in getUserCartBE for userId ${userId}:`, error);
    throw error;
  }
};

export const setItemInUserCartBE = async (userId: string, productId: string, quantity: number): Promise<UserCartBE> => {
  console.log(`(Service-Backend) setItemInUserCartBE for userId ${userId}, product ${productId}, quantity ${quantity}`);
  try {
    const cartDocRef = db.collection(USER_CARTS_COLLECTION).doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const cartDoc = await transaction.get(cartDocRef);
      let items: BackendCartItem[] = [];
      if (cartDoc.exists) {
        items = (cartDoc.data() as UserCartBE).items || [];
      }

      const itemIndex = items.findIndex(item => item.productId === productId);

      if (quantity > 0) {
        if (itemIndex > -1) {
          items[itemIndex].quantity = quantity;
          items[itemIndex].addedAt = adminInstance.firestore.FieldValue.serverTimestamp(); 
        } else {
          items.push({ 
            productId,
            quantity,
            addedAt: adminInstance.firestore.FieldValue.serverTimestamp() 
          });
        }
      } else { 
        if (itemIndex > -1) {
          items.splice(itemIndex, 1);
        }
      }
      
      transaction.set(cartDocRef, { 
        userId: userId, 
        items: items, 
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() 
      }, { merge: true }); 
    });

    const updatedCartSnap = await cartDocRef.get();
    if (!updatedCartSnap.exists) {
        // This should not happen if merge:true is used and transaction succeeded
        throw new Error('Cart not found after update attempt, but transaction implied creation/update.');
    }
    return { userId: updatedCartSnap.id, ...updatedCartSnap.data() } as UserCartBE;

  } catch (error) {
    console.error(`Error in setItemInUserCartBE for userId ${userId}:`, error);
    throw error;
  }
};

export const clearUserCartBE = async (userId: string): Promise<void> => {
  console.log(`(Service-Backend) clearUserCartBE for userId: ${userId}`);
  try {
    const cartDocRef = db.collection(USER_CARTS_COLLECTION).doc(userId);
    // Update to empty items array. If the cart document should be deleted entirely,
    // check if it exists first, then delete. For now, just clear items.
    const cartSnap = await cartDocRef.get();
    if (cartSnap.exists) {
        await cartDocRef.update({
          items: [], 
          updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        });
    } else {
        console.log(`Cart for user ${userId} not found, nothing to clear.`);
        // Optionally create an empty cart record if desired, or just return.
        // await cartDocRef.set({ userId, items: [], updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() });
    }
  } catch (error) {
    console.error(`Error in clearUserCartBE for userId ${userId}:`, error);
    throw error;
  }
};