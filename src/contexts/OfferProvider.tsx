import React, { useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import {
    Offer,
    getOffers as fetchOffersService,
    applyProductOffers,
    calculateCartDiscounts,
    CartItem as ServiceCartItem,
    Cart as ServiceCart,
} from '../services/offerService';
import { OfferContext, OfferContextType } from './OfferContextDef'; // Import from new definition file

// Product interface might also be sharable or defined in OfferContextDef.ts if only used there
interface Product {
    id: string;
    price: number;
    categoryId?: string;
}

export const OfferProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoadingOffers, setIsLoadingOffers] = useState(true);
    const [errorOffers, setErrorOffers] = useState<string | undefined>(undefined);

    const loadOffers = useCallback(async () => {
        setIsLoadingOffers(true);
        setErrorOffers(undefined);
        try {
            const fetchedOffers = await fetchOffersService();
            setOffers(fetchedOffers);
        } catch (err) {
            console.error("Failed to load offers:", err);
            setErrorOffers(err instanceof Error ? err.message : 'An unknown error occurred while fetching offers.');
            setOffers([]);
        }
        setIsLoadingOffers(false);
    }, []);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    const getApplicableOfferForProduct = useCallback((product: Product): { finalPrice: number; appliedOffer?: Offer } => {
        if (isLoadingOffers || errorOffers) {
            return { finalPrice: product.price };
        }
        return applyProductOffers(product, offers);
    }, [isLoadingOffers, errorOffers, offers]);

    const calculateCartWithOffers = useCallback((items: ServiceCartItem[]): ServiceCart => {
        if (isLoadingOffers || errorOffers) {
            const subTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            return {
                items: items.map(item => ({...item, discountedPrice: item.unitPrice, itemDiscount: 0})),
                subTotal,
                discount: 0,
                total: subTotal,
                appliedOffers: [],
            };
        }
        return calculateCartDiscounts(items, offers);
    }, [isLoadingOffers, errorOffers, offers]);
    
    const memoizedValue: OfferContextType = useMemo(() => ({
        offers,
        isLoadingOffers,
        errorOffers,
        getApplicableOfferForProduct,
        calculateCartWithOffers,
        refreshOffers: loadOffers,
    }), [offers, isLoadingOffers, errorOffers, getApplicableOfferForProduct, calculateCartWithOffers, loadOffers]);

    return (
        <OfferContext.Provider value={memoizedValue}>
            {children}
        </OfferContext.Provider>
    );
};