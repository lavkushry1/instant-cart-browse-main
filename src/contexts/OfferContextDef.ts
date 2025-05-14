import { createContext } from 'react';
import type { Offer, CartItem as ServiceCartItem, Cart as ServiceCart } from '../services/offerService';

interface Product {
    id: string;
    price: number;
    categoryId?: string;
}

export interface OfferContextType {
    offers: Offer[];
    isLoadingOffers: boolean;
    errorOffers?: string;
    getApplicableOfferForProduct: (product: Product) => { finalPrice: number; appliedOffer?: Offer };
    calculateCartWithOffers: (items: ServiceCartItem[]) => ServiceCart;
    refreshOffers: () => Promise<void>;
}

export const OfferContext = createContext<OfferContextType | undefined>(undefined);