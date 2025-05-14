import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
    Offer,
    getOffers as fetchOffersService,
    applyProductOffers,
    calculateCartDiscounts,
    CartItem as ServiceCartItem, // Renaming to avoid conflict if CartItem is defined elsewhere
    Cart as ServiceCart, // Renaming
} from '../services/offerService';

interface Product {
    id: string;
    price: number;
    categoryId?: string;
    // Other product properties can be added if needed by offer logic
}

export interface OfferContextType {
    offers: Offer[];
    isLoadingOffers: boolean;
    errorOffers?: string;
    getApplicableOfferForProduct: (product: Product) => { finalPrice: number; appliedOffer?: Offer };
    calculateCartWithOffers: (items: ServiceCartItem[]) => ServiceCart;
    refreshOffers: () => Promise<void>;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export const OfferProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoadingOffers, setIsLoadingOffers] = useState(true);
    const [errorOffers, setErrorOffers] = useState<string | undefined>(undefined);

    const loadOffers = async () => {
        setIsLoadingOffers(true);
        setErrorOffers(undefined);
        try {
            const fetchedOffers = await fetchOffersService();
            setOffers(fetchedOffers);
        } catch (err) {
            console.error("Failed to load offers:", err);
            setErrorOffers(err instanceof Error ? err.message : 'An unknown error occurred while fetching offers.');
            setOffers([]); // Clear offers on error or set to a default state
        }
        setIsLoadingOffers(false);
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const getApplicableOfferForProduct = (product: Product): { finalPrice: number; appliedOffer?: Offer } => {
        if (isLoadingOffers || errorOffers) {
            // If offers are loading or there was an error, return original price
            return { finalPrice: product.price };
        }
        return applyProductOffers(product, offers);
    };

    const calculateCartWithOffers = (items: ServiceCartItem[]): ServiceCart => {
        if (isLoadingOffers || errorOffers) {
            // Calculate cart total without offers if offers are not ready
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
    };
    
    const memoizedValue = useMemo(() => ({
        offers,
        isLoadingOffers,
        errorOffers,
        getApplicableOfferForProduct,
        calculateCartWithOffers,
        refreshOffers: loadOffers, // Expose a way to manually refresh offers
    }), [offers, isLoadingOffers, errorOffers]);

    return (
        <OfferContext.Provider value={memoizedValue}>
            {children}
        </OfferContext.Provider>
    );
};

export const useOffers = (): OfferContextType => {
    const context = useContext(OfferContext);
    if (context === undefined) {
        throw new Error('useOffers must be used within an OfferProvider');
    }
    return context;
};
