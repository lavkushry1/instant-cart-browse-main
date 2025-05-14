// src/services/offerService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const OFFERS_COLLECTION = 'offers';

// Keep client-side Timestamp for type consistency in shared interfaces if needed
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export interface OfferCondition {
    cartValueGreaterThan?: number;
}

export interface Offer {
  id: string; 
  name: string;
  type: 'product' | 'store' | 'conditional' | 'category';
  discountPercent?: number;
  discountAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
  condition?: OfferCondition;
  validFrom: any; // admin.firestore.Timestamp on backend
  validTill: any; // admin.firestore.Timestamp on backend
  priority: number;
  enabled: boolean;
  createdAt: any; // admin.firestore.Timestamp
  updatedAt: any; // admin.firestore.Timestamp
}

export type OfferCreationData = Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'> & {
    validFrom: string; // Expect ISO string from client
    validTill: string; // Expect ISO string from client
};

export type OfferUpdateData = Partial<Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'>> & {
    validFrom?: string; // Expect ISO string from client if changed
    validTill?: string; // Expect ISO string from client if changed
};

console.log(`(Service-Backend) Offer Service: Using Firestore collection: ${OFFERS_COLLECTION}`);

export const createOfferBE = async (offerData: OfferCreationData): Promise<Offer> => {
  console.log('(Service-Backend) createOfferBE called with:', offerData);
  try {
    const { validFrom, validTill, ...restOfData } = offerData;
    const dataToSave: any = {
      ...restOfData,
      validFrom: adminInstance.firestore.Timestamp.fromDate(new Date(validFrom)),
      validTill: adminInstance.firestore.Timestamp.fromDate(new Date(validTill)),
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

    const docRef = await db.collection(OFFERS_COLLECTION).add(dataToSave);
    // To return the full offer object with server timestamps, a re-fetch is best.
    const newDoc = await docRef.get();
    if (!newDoc.exists) {
        throw new Error('Offer document not found after creation.');
    }
    return { id: newDoc.id, ...newDoc.data() } as Offer;
  } catch (error) {
    console.error("Error in createOfferBE:", error);
    throw error;
  }
};

export const getOfferByIdBE = async (offerId: string): Promise<Offer | null> => {
  console.log(`(Service-Backend) getOfferByIdBE for ID: ${offerId}`);
  try {
    const docRef = db.collection(OFFERS_COLLECTION).doc(offerId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Offer;
  } catch (error) {
    console.error(`Error in getOfferByIdBE for ${offerId}:`, error);
    throw error;
  }
};

export const getAllOffersBE = async (): Promise<Offer[]> => {
  console.log('(Service-Backend) getAllOffersBE called');
  try {
    const snapshot = await db.collection(OFFERS_COLLECTION).orderBy('priority', 'desc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
  } catch (error) {
    console.error("Error in getAllOffersBE:", error);
    throw error;
  }
};

export const updateOfferBE = async (offerId: string, offerData: OfferUpdateData): Promise<Offer> => {
  console.log(`(Service-Backend) updateOfferBE for ID ${offerId} with:`, offerData);
  try {
    const docRef = db.collection(OFFERS_COLLECTION).doc(offerId);
    const dataToUpdate: any = { ...offerData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
    if (offerData.validFrom) dataToUpdate.validFrom = adminInstance.firestore.Timestamp.fromDate(new Date(offerData.validFrom));
    if (offerData.validTill) dataToUpdate.validTill = adminInstance.firestore.Timestamp.fromDate(new Date(offerData.validTill));
    
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
    await docRef.update(dataToUpdate);
    
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        throw new Error('Offer document not found after update.');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Offer;
  } catch (error) {
    console.error(`Error in updateOfferBE for ${offerId}:`, error);
    throw error;
  }
};

export const deleteOfferBE = async (offerId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteOfferBE for ID: ${offerId}`);
  try {
    await db.collection(OFFERS_COLLECTION).doc(offerId).delete();
  } catch (error) {
    console.error(`Error in deleteOfferBE for ${offerId}:`, error);
    throw error;
  }
};

// --- Client-Side Offer Application Logic (remains for context or potential frontend use) ---
export const applyProductOffers = (
    product: { id: string; price: number; categoryId?: string }, 
    allOffers: Offer[] 
): { finalPrice: number; appliedOffer?: Offer } => {
    const now = adminInstance.firestore.Timestamp.now().toDate();
    const applicableOffers = allOffers.filter(offer => {
        const validFromDate = offer.validFrom instanceof adminInstance.firestore.Timestamp ? offer.validFrom.toDate() : new Date(offer.validFrom);
        const validTillDate = offer.validTill instanceof adminInstance.firestore.Timestamp ? offer.validTill.toDate() : new Date(offer.validTill);
        return (
            offer.enabled && validFromDate <= now && validTillDate >= now &&
            ( offer.type === 'store' || 
              (offer.type === 'product' && offer.productIds?.includes(product.id)) ||
              (offer.type === 'category' && product.categoryId && offer.categoryIds?.includes(product.categoryId)) )
        );
    });
    if (applicableOffers.length === 0) return { finalPrice: product.price };
    applicableOffers.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        const priceA = a.discountPercent ? product.price * (1 - a.discountPercent / 100) : (a.discountAmount ? product.price - a.discountAmount : product.price);
        const priceB = b.discountPercent ? product.price * (1 - b.discountPercent / 100) : (b.discountAmount ? product.price - b.discountAmount : product.price);
        return priceA - priceB;
    });
    const bestOffer = applicableOffers[0];
    let finalPrice = product.price;
    if (bestOffer.discountPercent) finalPrice = product.price * (1 - bestOffer.discountPercent / 100);
    else if (bestOffer.discountAmount) finalPrice = Math.max(0, product.price - bestOffer.discountAmount);
    return { finalPrice: Math.max(0, finalPrice), appliedOffer: bestOffer };
};
export interface CartItem { productId: string; unitPrice: number; quantity: number; categoryId?: string; }
export interface Cart {
    items: (CartItem & { discountedPrice?: number; itemDiscount?: number; appliedOfferId?: string })[];
    subTotal: number; discount: number; total: number; appliedOffers?: Offer[]; 
}
export const calculateCartDiscounts = (cartItems: CartItem[], allOffers: Offer[]): Cart => {
    let subTotal = 0;
    const processedItems: (CartItem & { discountedPrice?: number; itemDiscount?: number; appliedOfferId?: string })[] = [];
    let totalCartDiscount = 0;
    const uniqueAppliedOffersMap = new Map<string, Offer>();
    const now = adminInstance.firestore.Timestamp.now().toDate();
    for (const item of cartItems) {
        const itemOriginalTotal = item.unitPrice * item.quantity;
        subTotal += itemOriginalTotal;
        const productForOfferCheck = { id: item.productId, price: item.unitPrice, categoryId: item.categoryId };
        const { finalPrice: discountedUnitPrice, appliedOffer: productOffer } = applyProductOffers(productForOfferCheck, allOffers);
        let itemDiscountValue = 0;
        if (productOffer && discountedUnitPrice < item.unitPrice) {
            itemDiscountValue = (item.unitPrice - discountedUnitPrice) * item.quantity;
            totalCartDiscount += itemDiscountValue;
            if (!uniqueAppliedOffersMap.has(productOffer.id)) uniqueAppliedOffersMap.set(productOffer.id, productOffer);
            processedItems.push({ ...item, discountedPrice: discountedUnitPrice, itemDiscount: itemDiscountValue, appliedOfferId: productOffer.id });
        } else {
            processedItems.push({ ...item, discountedPrice: item.unitPrice, itemDiscount: 0 });
        }
    }
    const activeGlobalOffers = allOffers.filter(offer =>{
        const validFromDate = offer.validFrom instanceof adminInstance.firestore.Timestamp ? offer.validFrom.toDate() : new Date(offer.validFrom);
        const validTillDate = offer.validTill instanceof adminInstance.firestore.Timestamp ? offer.validTill.toDate() : new Date(offer.validTill);
        return offer.enabled && validFromDate <= now && validTillDate >= now && (offer.type === 'store' || offer.type === 'conditional');
    }).sort((a, b) => b.priority - a.priority);
    let currentTotalAfterItemDiscounts = subTotal - totalCartDiscount;
    for (const offer of activeGlobalOffers) {
        let offerCanBeApplied = false; let potentialDiscountFromThisOffer = 0;
        if (offer.type === 'store') {
            if (offer.discountPercent) potentialDiscountFromThisOffer = currentTotalAfterItemDiscounts * (offer.discountPercent / 100);
            else if (offer.discountAmount) potentialDiscountFromThisOffer = offer.discountAmount;
            offerCanBeApplied = true; 
        }
        if (offer.type === 'conditional' && offer.condition) {
            if (offer.condition.cartValueGreaterThan && currentTotalAfterItemDiscounts > offer.condition.cartValueGreaterThan) {
                if (offer.discountPercent) potentialDiscountFromThisOffer = currentTotalAfterItemDiscounts * (offer.discountPercent / 100);
                else if (offer.discountAmount) potentialDiscountFromThisOffer = offer.discountAmount;
                offerCanBeApplied = true;
            }
        }
        if (offerCanBeApplied && potentialDiscountFromThisOffer > 0) {
            totalCartDiscount += potentialDiscountFromThisOffer;
            currentTotalAfterItemDiscounts -= potentialDiscountFromThisOffer;
            if (!uniqueAppliedOffersMap.has(offer.id)) uniqueAppliedOffersMap.set(offer.id, offer);
        }
    }
    const finalTotal = Math.max(0, subTotal - totalCartDiscount);
    return {
        items: processedItems,
        subTotal: parseFloat(subTotal.toFixed(2)),
        discount: parseFloat(totalCartDiscount.toFixed(2)),
        total: parseFloat(finalTotal.toFixed(2)),
        appliedOffers: Array.from(uniqueAppliedOffersMap.values())
    };
};