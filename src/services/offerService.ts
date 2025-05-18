// src/services/offerService.ts

import { firestoreClient } from './../lib/firebaseClient';
import { Timestamp as ClientTimestamp, collection, getDocs, query, orderBy as clientOrderBy } from 'firebase/firestore';

const OFFERS_COLLECTION = 'offers';

export interface OfferCondition {
    cartValueGreaterThan?: number;
}

// This Offer type is for client-side usage and should use ClientTimestamp
export interface Offer {
  id: string;
  name: string;
  type: 'product' | 'store' | 'conditional' | 'category';
  discountPercent?: number;
  discountAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
  condition?: OfferCondition;
  validFrom: ClientTimestamp;
  validTill: ClientTimestamp;
  priority: number;
  enabled: boolean;
  createdAt: ClientTimestamp;
  updatedAt: ClientTimestamp;
}

// For data coming from client (e.g., forms), expect ISO strings for dates
export type OfferCreationData = Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'> & {
    validFrom: string; 
    validTill: string; 
};

export type OfferUpdateData = Partial<Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'> & {
    validFrom?: string; // Client can send string
    validTill?: string; // Client can send string
}>;

// --- Client-Side Offer Fetching ---
export const getOffers = async (): Promise<Offer[]> => {
  console.log('(Service-Client) getOffers called');
  if (!firestoreClient) {
    console.error("Firestore client not initialized. Cannot fetch offers.");
    return [];
  }
  try {
    const offersCollectionRef = collection(firestoreClient, OFFERS_COLLECTION);
    const q = query(offersCollectionRef, clientOrderBy('priority', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
  } catch (error) {
    console.error("Error in getOffers (client-side):", error);
    throw error;
  }
};

// --- Client-Side Offer Application Logic ---
export const applyProductOffers = (
    product: { id: string; price: number; categoryId?: string },
    allOffers: Offer[]
): { finalPrice: number; appliedOffer?: Offer } => {
    const now = ClientTimestamp.now().toDate();
    const applicableOffers = allOffers.filter(offer => {
        const validFromDate = offer.validFrom.toDate();
        const validTillDate = offer.validTill.toDate();
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
    const now = ClientTimestamp.now().toDate();

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

    const activeGlobalOffers = allOffers.filter(offer => {
        const validFromDate = offer.validFrom.toDate();
        const validTillDate = offer.validTill.toDate();
        return offer.enabled && validFromDate <= now && validTillDate >= now && (offer.type === 'store' || offer.type === 'conditional');
    }).sort((a, b) => b.priority - a.priority);

    let currentTotalAfterItemDiscounts = subTotal - totalCartDiscount;

    for (const offer of activeGlobalOffers) {
        let offerCanBeApplied = false; let potentialDiscountFromThisOffer = 0;
        if (offer.type === 'store') {
            if (offer.discountPercent) potentialDiscountFromThisOffer = currentTotalAfterItemDiscounts * (offer.discountPercent / 100);
            else if (offer.discountAmount) potentialDiscountFromThisOffer = offer.discountAmount;
            offerCanBeApplied = true;
        } else if (offer.type === 'conditional' && offer.condition?.cartValueGreaterThan !== undefined) {
            if (currentTotalAfterItemDiscounts > offer.condition.cartValueGreaterThan) {
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
    const finalTotal = subTotal - totalCartDiscount;
    return {
        items: processedItems,
        subTotal: subTotal, // Original subtotal before any discounts
        discount: totalCartDiscount,
        total: Math.max(0, finalTotal),
        appliedOffers: Array.from(uniqueAppliedOffersMap.values()),
    };
};