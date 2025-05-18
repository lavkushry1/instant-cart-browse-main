"use strict";
// src/services/offerService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCartDiscounts = exports.applyProductOffers = exports.getOffers = void 0;
const firebaseClient_1 = require("./../lib/firebaseClient");
const firestore_1 = require("firebase/firestore");
const OFFERS_COLLECTION = 'offers';
// --- Client-Side Offer Fetching ---
const getOffers = async () => {
    console.log('(Service-Client) getOffers called');
    if (!firebaseClient_1.firestoreClient) {
        console.error("Firestore client not initialized. Cannot fetch offers.");
        return [];
    }
    try {
        const offersCollectionRef = (0, firestore_1.collection)(firebaseClient_1.firestoreClient, OFFERS_COLLECTION);
        const q = (0, firestore_1.query)(offersCollectionRef, (0, firestore_1.orderBy)('priority', 'desc'));
        const snapshot = await (0, firestore_1.getDocs)(q);
        if (snapshot.empty)
            return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    catch (error) {
        console.error("Error in getOffers (client-side):", error);
        throw error;
    }
};
exports.getOffers = getOffers;
// --- Client-Side Offer Application Logic ---
const applyProductOffers = (product, allOffers) => {
    const now = firestore_1.Timestamp.now().toDate();
    const applicableOffers = allOffers.filter(offer => {
        const validFromDate = offer.validFrom.toDate();
        const validTillDate = offer.validTill.toDate();
        return (offer.enabled && validFromDate <= now && validTillDate >= now &&
            (offer.type === 'store' ||
                (offer.type === 'product' && offer.productIds?.includes(product.id)) ||
                (offer.type === 'category' && product.categoryId && offer.categoryIds?.includes(product.categoryId))));
    });
    if (applicableOffers.length === 0)
        return { finalPrice: product.price };
    applicableOffers.sort((a, b) => {
        if (b.priority !== a.priority)
            return b.priority - a.priority;
        const priceA = a.discountPercent ? product.price * (1 - a.discountPercent / 100) : (a.discountAmount ? product.price - a.discountAmount : product.price);
        const priceB = b.discountPercent ? product.price * (1 - b.discountPercent / 100) : (b.discountAmount ? product.price - b.discountAmount : product.price);
        return priceA - priceB;
    });
    const bestOffer = applicableOffers[0];
    let finalPrice = product.price;
    if (bestOffer.discountPercent)
        finalPrice = product.price * (1 - bestOffer.discountPercent / 100);
    else if (bestOffer.discountAmount)
        finalPrice = Math.max(0, product.price - bestOffer.discountAmount);
    return { finalPrice: Math.max(0, finalPrice), appliedOffer: bestOffer };
};
exports.applyProductOffers = applyProductOffers;
const calculateCartDiscounts = (cartItems, allOffers) => {
    let subTotal = 0;
    const processedItems = [];
    let totalCartDiscount = 0;
    const uniqueAppliedOffersMap = new Map();
    const now = firestore_1.Timestamp.now().toDate();
    for (const item of cartItems) {
        const itemOriginalTotal = item.unitPrice * item.quantity;
        subTotal += itemOriginalTotal;
        const productForOfferCheck = { id: item.productId, price: item.unitPrice, categoryId: item.categoryId };
        const { finalPrice: discountedUnitPrice, appliedOffer: productOffer } = (0, exports.applyProductOffers)(productForOfferCheck, allOffers);
        let itemDiscountValue = 0;
        if (productOffer && discountedUnitPrice < item.unitPrice) {
            itemDiscountValue = (item.unitPrice - discountedUnitPrice) * item.quantity;
            totalCartDiscount += itemDiscountValue;
            if (!uniqueAppliedOffersMap.has(productOffer.id))
                uniqueAppliedOffersMap.set(productOffer.id, productOffer);
            processedItems.push({ ...item, discountedPrice: discountedUnitPrice, itemDiscount: itemDiscountValue, appliedOfferId: productOffer.id });
        }
        else {
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
        let offerCanBeApplied = false;
        let potentialDiscountFromThisOffer = 0;
        if (offer.type === 'store') {
            if (offer.discountPercent)
                potentialDiscountFromThisOffer = currentTotalAfterItemDiscounts * (offer.discountPercent / 100);
            else if (offer.discountAmount)
                potentialDiscountFromThisOffer = offer.discountAmount;
            offerCanBeApplied = true;
        }
        else if (offer.type === 'conditional' && offer.condition?.cartValueGreaterThan !== undefined) {
            if (currentTotalAfterItemDiscounts > offer.condition.cartValueGreaterThan) {
                if (offer.discountPercent)
                    potentialDiscountFromThisOffer = currentTotalAfterItemDiscounts * (offer.discountPercent / 100);
                else if (offer.discountAmount)
                    potentialDiscountFromThisOffer = offer.discountAmount;
                offerCanBeApplied = true;
            }
        }
        if (offerCanBeApplied && potentialDiscountFromThisOffer > 0) {
            totalCartDiscount += potentialDiscountFromThisOffer;
            currentTotalAfterItemDiscounts -= potentialDiscountFromThisOffer;
            if (!uniqueAppliedOffersMap.has(offer.id))
                uniqueAppliedOffersMap.set(offer.id, offer);
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
exports.calculateCartDiscounts = calculateCartDiscounts;
//# sourceMappingURL=offerService.js.map